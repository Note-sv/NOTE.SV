/*
  Node.js for Mobile Apps Cordova plugin.

  Implements the plugin APIs exposed to the Cordova layer and routes messages
  between the Cordova layer and the Node.js engine.
 */
package io.chainbow.note_node

import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.AssetManager
import android.system.ErrnoException
import android.system.Os
import com.chibatching.kotpref.Kotpref
import com.chibatching.kotpref.gsonpref.gson
import com.getcapacitor.*
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.internal.LinkedTreeMap
import de.adorsys.android.securestoragelibrary.SecurePreferences
import io.chainbow.note_node.model.*
import io.chainbow.note_node.notenode.BuildConfig
import io.chainbow.note_node.util.*
import io.realm.Realm
import io.realm.RealmConfiguration
import io.realm.Sort
import io.realm.kotlin.where
import org.greenrobot.eventbus.EventBus
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import timber.log.Timber
import java.io.*
import java.util.*

@NativePlugin
class NoteNode : Plugin() {
    companion object {
        private var filesDir: String? = null
        private var libsDir: String? = null
        private const val PROJECT_ROOT = "nodejs-project"
        private const val BUILTIN_NATIVE_ASSETS_PREFIX = "nodejs-native-assets-"
        private var nodeAppRootAbsolutePath = ""
        private var nodePath = ""
        private var nativeAssetsPath = ""
        private const val SYSTEM_CHANNEL = "_SYSTEM_"
        private const val EVENT_CHANNEL = "_EVENTS_"
        private const val DB_CHANNEL = "_DB_"
        private const val TRUE = "true"
        private const val FALSE = "false"

        // Flag to indicate if node is ready to receive app events.
        private var nodeIsReadyForAppEvents = false
        private val syncMap: MutableMap<String, Queue<PluginCall>?> = HashMap()
        private val notReadyMap: MutableMap<String, String> = HashMap()
        private lateinit var mContext: Context

        //We just want one instance of node running in the background.
        var startedNodeAlready = false

        var notifyListenersStatic: ((String, JSObject) -> Unit)? = null
        private var realmConfiguration: RealmConfiguration? = null

        private fun runRealm(block: (realm: Realm) -> Unit) {
            realmConfiguration?.let {
                val realm = Realm.getInstance(it)
                block(realm)
                realm.close()
            }
        }

        private fun handleResultFromNode(msg: String): JSObject? {
            var msgObject: JSObject? = null
            try {
                msgObject = JSObject(msg)
            } catch (e: JSONException) {
                e.printStackTrace()
            }
            return msgObject
        }

        private fun configRealm(seedString: String) {
            val key = HashUtil.sha256(seedString)
            realmConfiguration = RealmConfiguration.Builder()
                    .name("notesv.realm")
                    .schemaVersion(10)
                    .migration(MyMigration())
                    .encryptionKey(key.toByteArray())
                    .build()
        }

        @JvmStatic
        @Synchronized
        fun sendMessageToApplication(channelName: String, msg: String) {
            try {
                if (channelName == EVENT_CHANNEL) {
                    val msgObject = handleResultFromNode(msg)
                    val event = msgObject!!.getString("event")
                    val payload = msgObject.getString("payload") ?: "null"
                    if (syncMap.containsKey(event)) {
                        val pc = syncMap[event]!!.poll()
                        if (syncMap[event]!!.size == 0) syncMap.remove(event)

                        when (event) {
                            "login-with-password" -> {
                                if (payload != "null") {
                                    configRealm(JSObject(payload).getString("seedString"))
                                }
                            }
                            "save-seed-string" -> {
                                val payloadObject = JSObject(payload)
                                if (payload != "null") {
                                    configRealm(payloadObject.getString("seedString"))
                                }

                                SecurePreferences.setValue("password", payloadObject.getString("password"), mContext)
                            }
                        }

                        pc?.let {
                            val ret = constructReturnToFront(payload)
                            pc.success(ret)
                        }
                    } else if (event == "settings") {
                        val prefs = mContext.getSharedPreferences("CapacitorStorage", Activity.MODE_PRIVATE)
                        val settings = prefs.getString("settings", null)
                        val msgToNode = MessageCodec(event, settings?.trimIndent()).toJson()
                        sendMessageToNodeChannel(EVENT_CHANNEL, msgToNode)
                    } else {
                        notifyListenersStatic?.invoke(event, constructReturnToFront(payload))
                    }
                } else if (channelName == DB_CHANNEL) {
                    val msgObject = handleResultFromNode(msg)
                    val event = msgObject!!.getString("event")
                    val payload = msgObject.getString("payload")
                    var payloadReturn = payload
                    val _id = payload.substring(1, payload.length - 1)

                    when {
                        _id == Seed.SEED -> {
                            payloadReturn = if (Store.seed.doc == null) {
                                "null"
                            } else {
                                Store.seed.toJson()
                            }
                        }
                        event.startsWith(REALM_GET) -> {
                            payloadReturn = getRealmData(payload)
                        }
                        event.startsWith(REALM_PUT) -> {
                            payloadReturn = putRealmData(payload)
                        }
                        event.startsWith(REALM_FIND) -> {
                            payloadReturn = findRealmData(payload)
                        }
                        event.startsWith(REALM_REMOVE) -> {
                            payloadReturn = removeRealmData(payload)
                        }
                    }
                    val msgToNode = MessageCodec(event, payloadReturn).toJson()
                    sendMessageToNodeChannel(DB_CHANNEL, msgToNode)
                } else if (channelName == SYSTEM_CHANNEL) {
                    // If it's a system channel call, handle it in the plugin native side.
                    handleAppChannelMessage(msg)
                } else {
                    // TODO Otherwise, send it to Cordova. Nothing to do right now
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        private fun constructReturnToFront(payload: String): JSObject {
            val ret = JSObject()
            if (JsonUtil.isJSONValid(payload)) {
                if (JsonUtil.isJSONObjectValid(payload)) {
                    ret.put("value", JSObject(payload))
                } else if (JsonUtil.isJSONArrayValid(payload)) {
                    ret.put("value", JSONArray(payload))
                }
            } else {
                try {
                    val number = payload.toBigDecimal()
                    ret.put("value", number)
                } catch (e: Exception) {
                    when (payload) {
                        "null" -> {
                            ret.put("value", null)
                        }
                        "true", "false" -> {
                            ret.put("value", payload.toBoolean())
                        }
                        else -> {
                            ret.put("value", payload.substring(1, payload.length - 1))
                        }
                    }
                }
            }
            return ret
        }

        private fun removeRealmData(payload: String): String {
            var payloadReturn: String
            val removeDB = payload.substring(1, payload.length - 1) == "db"
            try {
                if (removeDB) {
                    val realmURL = mContext.filesDir.absolutePath + "/notesv.realm"
                    val realmURLs = arrayOf(
                            realmURL,
                            "$realmURL.lock",
                            "$realmURL.note",
                            "$realmURL.management"
                    )
                    for (URL in realmURLs) {
                        deleteRecursive(File(URL))
                    }
                    Store.clear()
                    realmConfiguration = null
                    SecurePreferences.removeValue("password", mContext)
                } else {
                    runRealm {
                        it.executeTransaction {
                            val id = toJsonObject<ID>(payload)
                            when {
                                id._id == Seed.SEED -> {
                                }
                                id._id.startsWith(NoteTxRecord.START_WITH) -> {
                                    it.where<NoteTxRecord>().equalTo("_id", id._id).findFirst()?.apply {
                                        deleteFromRealm()
                                    }
                                }
                                id._id.startsWith(NoteRecord.START_WITH) -> {
                                    it.where<NoteRecord>().equalTo("_id", id._id).findFirst()?.apply {
                                        deleteFromRealm()
                                    }
                                }
                                else -> {
                                }
                            }
                        }
                    }
                }
                payloadReturn = TRUE
            } catch (e: Exception) {
                payloadReturn = e.localizedMessage
            }
            return payloadReturn
        }

        private fun findRealmData(payload: String): String {
            var payloadReturn = TRUE

            if (realmConfiguration != null) {
                val finder = Gson().fromJson(payload, Finder::class.java)
                runRealm {
                    if (finder.selector != null) {
                        if (finder.selector!!.tx_status != null) {
                            if (finder.selector!!._id != null) {
                                val searchId = finder.selector!!._id!!
                                if (searchId.startsWith(NoteTxRecord.START_WITH)) {
                                    val noteTxRecords = it.where<NoteTxRecord>()
                                            .equalTo("tx_status", finder.selector!!.tx_status)
                                            .beginsWith("_id", searchId)
                                            .findAll()
                                    val noteTxRecordList = it.copyFromRealm(noteTxRecords)
                                    payloadReturn = noteTxRecordList.toJson()
                                }
                            } else if (finder.selector!!.draft != null) {
                                val noteTxRecords = it.where<NoteTxRecord>()
                                        .equalTo("tx_status", finder.selector!!.tx_status)
                                        .equalTo("draft", finder.selector!!.draft)
                                        .findAll()

                                val noteTxRecordList = it.copyFromRealm(noteTxRecords)
                                payloadReturn = noteTxRecordList.toJson()
                            }
                        } else if (finder.tx_hash != null) {
                            if (finder.selector!!._id != null) {
                                val searchId = finder.selector!!._id!!
                                if (searchId.startsWith(NoteRecord.START_WITH)) {
                                    val noteRecords = it.where<NoteRecord>()
                                            .equalTo("tx_hash", finder.tx_hash)
                                            .findAll()
                                    val noteTxRecordList = it.copyFromRealm(noteRecords)
                                    payloadReturn = noteTxRecordList.toJson()
                                } else if (searchId.startsWith(NoteTxRecord.START_WITH)) {
                                    val noteTxRecords = it.where<NoteTxRecord>()
                                            .equalTo("tx_hash", finder.tx_hash)
                                            .findAll()
                                    val noteTxRecordList = it.copyFromRealm(noteTxRecords)
                                    payloadReturn = noteTxRecordList.toJson()
                                }
                            }
                        } else if (finder.selector!!._id != null) {
                            val searchId = finder.selector!!._id!!
                            val del = finder.selector!!.del
                            if (searchId == NoteRecord.START_WITH) {
                                if(del==true) {
                                    val noteRecords = it.where<NoteRecord>()
                                            .equalTo("del", del)
                                            .findAll()

                                    val noteRecordList = it.copyFromRealm(noteRecords)
                                    payloadReturn = noteRecordList.toJson()
                                }else{
                                    payloadReturn = findAllNotes().toJson()
                                }
                            } else if (searchId.startsWith(NoteTxRecord.START_WITH)) {
                                val noteTxRecordsSearch = it.where<NoteTxRecord>().beginsWith("_id", searchId)
                                finder.sort?.first()?.let {
                                    noteTxRecordsSearch.sort(it)
                                }
                                val noteTxRecords = noteTxRecordsSearch.findAll()

                                val noteTxRecordList = it.copyFromRealm(noteTxRecords)
                                payloadReturn = noteTxRecordList.toJson()
                            }
                        }
                    }
                }
            } else {
                payloadReturn = FALSE
            }

            return payloadReturn
        }

        private fun findAllNotes(): MutableList<NoteRecord>? {
            var noteRecordsList: MutableList<NoteRecord> = mutableListOf()
            runRealm {
                val noteRecords = it.where<NoteRecord>().sort("tms").findAll()
                noteRecordsList = it.copyFromRealm(noteRecords)
            }
            return noteRecordsList
        }

        private fun putRealmData(payload: String): String {
            var payloadReturn: String
            val id = toJsonObject<ID>(payload)
            try {
                when {
                    id._id == Seed.SEED -> {
                        Store.seed = Gson().fromJson(payload, Seed::class.java)
                    }
                    id._id.startsWith(NoteTxRecord.START_WITH) -> {
                        runRealm {
                            it.executeTransaction { it.createOrUpdateObjectFromJson(NoteTxRecord::class.java, payload) }
                        }
                    }
                    id._id.startsWith(NoteRecord.START_WITH) -> {
                        runRealm {
                            it.executeTransaction { it.createOrUpdateObjectFromJson(NoteRecord::class.java, payload) }
                        }
                    }
                    else -> {
                        runRealm {
                            it.executeTransaction { it.createOrUpdateObjectFromJson(TxRecord::class.java, payload) }
                        }
                    }
                }
                payloadReturn = TRUE
            } catch (e: Exception) {
                payloadReturn = e.localizedMessage
            }
            return payloadReturn
        }

        private fun getRealmData(payload: String): String {
            var payloadReturn: String = TRUE
            val _id = payload.substring(1, payload.length - 1)
            when {
                _id.startsWith(NoteTxRecord.START_WITH) -> {
                    runRealm {
                        payloadReturn = it.getResult<NoteTxRecord>(_id)
                    }
                }
                _id.startsWith(NoteRecord.START_WITH) -> {
                    runRealm {
                        payloadReturn = it.getResult<NoteRecord>(_id)
                    }
                }
                else -> {
                    runRealm {
                        payloadReturn = it.getResult<TxRecord>(_id)
                    }

                }
            }
            return payloadReturn
        }

        private fun handleAppChannelMessage(event: String) {
            when (event) {
                "ready-for-app-events" -> {
                    nodeIsReadyForAppEvents = true
                    notifyListenersStatic?.invoke(event, JSObject())
                    if (notReadyMap.isNotEmpty()) {
                        for ((chanelName, msg) in notReadyMap) {
                            sendMessageToNodeChannel(chanelName, msg)
                        }
                    }
                }
            }
        }

        private fun deleteFolderRecursively(file: File): Boolean {
            return try {
                var res = true
                for (childFile in file.listFiles()) {
                    res = if (childFile.isDirectory) {
                        res and deleteFolderRecursively(childFile)
                    } else {
                        res and childFile.delete()
                    }
                }
                res = res and file.delete()
                res
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }

        private fun deleteRecursive(fileOrDirectory: File) {
            if (fileOrDirectory.isDirectory) {
                for (child in fileOrDirectory.listFiles()) {
                    deleteRecursive(child)
                }
            }
            fileOrDirectory.delete()
        }

        private fun copyAssetFolder(assetManager: AssetManager, fromAssetPath: String, toPath: String): Boolean {
            return try {
                val files = assetManager.list(fromAssetPath)!!
                var res = true
                if (files.isEmpty()) {
                    //If it's a file, it won't have any assets "inside" it.
                    res = res and copyAsset(assetManager,
                            fromAssetPath,
                            toPath)
                } else {
                    File(toPath).mkdirs()
                    for (file in files) res = res and copyAssetFolder(assetManager,
                            "$fromAssetPath/$file",
                            "$toPath/$file")
                }
                res
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }

        private fun copyAsset(assetManager: AssetManager, fromAssetPath: String, toPath: String): Boolean {
            var `in`: InputStream? = null
            var out: OutputStream? = null
            return try {
                `in` = assetManager.open(fromAssetPath)
                File(toPath).createNewFile()
                out = FileOutputStream(toPath)
                copyFile(`in`, out)
                `in`.close()
                `in` = null
                out.flush()
                out.close()
                out = null
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }

        @Throws(IOException::class)
        private fun copyFile(`in`: InputStream?, out: OutputStream) {
            val buffer = ByteArray(1024)
            var read: Int
            while (`in`!!.read(buffer).also { read = it } != -1) {
                out.write(buffer, 0, read)
            }
        }

        external fun startNodeWithArguments(arguments: Array<String>?, nodePath: String?, redirectOutputToLogcat: Boolean): Int
        external fun sendMessageToNodeChannel(channelName: String?, msg: String?)
        external fun registerNodeDataDirPath(dataDir: String?)
        external fun getCurrentABIName(): String

        fun sendMessageToNodeChannelWrap(channelName: String, msg: String) {
            if (nodeIsReadyForAppEvents) {
                sendMessageToNodeChannel(EVENT_CHANNEL, msg)
            } else {
                notReadyMap[channelName] = msg
            }
        }

        init {
            System.loadLibrary("native-lib")
            System.loadLibrary("node")
        }
    }

    @PluginMethod
    fun getPassword(call: PluginCall) {
        val password = SecurePreferences.getStringValue("password", mContext, null)
        if (password != null) {
            val ret = JSObject()
            ret.put("value", password)
            call.success(ret)
        } else {
            call.error("no encryptedPassword saved")
        }
    }

    // TODO not to node also run this way
    @PluginMethod
    fun sendMessageToNode(call: PluginCall) {
        val msgObject = safeHandleMsg(call)
        val event = msgObject.getString("event")
        val payload = msgObject.getString("payload")
        if (event == "autofill") {
//            Gson().fromJson(payload, Note::class.java).let {
//                //EventBus.getDefault().post(it)
//            }
        } else if (event == "fecth-all-notes") {
            call.success()
            val noteRecords = findAllNotes() ?: arrayListOf()
            for (noteRecord in noteRecords) {
                if (!noteRecord.noteScriptHex.isNullOrEmpty()) {
                    if (!noteRecord.decryptedNote.isNullOrEmpty()) {
                        val note = JSObject(noteRecord.decryptedNote)
                        if (!note.has("del") || !note.getBoolean("del")) {
                            val noteStructFront = JSObject()
                            noteStructFront.put("id", noteRecord.index)

                            //删除note里的mem和files，避免内存中数据过多
                            note.remove("mem")
                            note.remove("files")

                            noteStructFront.put("note", note)

                            val noteStatus = JSObject()
                            noteStatus.put("tx_status", noteRecord.tx_status)
                            noteStatus.put("tx_height", noteRecord.tx_height)
                            noteStatus.put("tx_hash", noteRecord.tx_hash)
                            noteStatus.put("addressIndex", noteRecord.addressIndex)
                            if(noteRecord.sharer != null) {
                                noteStatus.put("sharer", noteRecord.sharer)
                            }

                            noteStructFront.put("status", noteStatus)

                            val ret = JSObject()
                            ret.put("value", noteStructFront)
                            notifyListeners("note-changed", ret)
                        }
                    }
                }
            }
        } else {
            sendMessageToNodeChannelWrap(EVENT_CHANNEL, msgObject.toString())
        }
        call.success()
    }

    @PluginMethod
    @Throws(JSONException::class)
    fun sendMessageToNodeSync(call: PluginCall) {
        val msgObject = safeHandleMsg(call)
        val event = msgObject.getString("event")

        if (event == "check-account") {
            val ret = JSObject()
            ret.put("value", Store.seed.doc != null)
            call.success(ret)
        } else if (event == "get-note-by-id") {
            val payload = msgObject.getString("payload")
            val id = NoteRecord.START_WITH + payload

            runRealm {
                val noteRecord = it.where<NoteRecord>().equalTo("_id", id).findFirst()
                if (noteRecord != null) {
                    if (noteRecord.noteScriptHex != null) {
                        if (noteRecord.decryptedNote != null) {
                            val note = JSObject(noteRecord.decryptedNote)
                            if (!note.has("del") || !note.getBoolean("del")) {
                                val noteStructFront = JSObject()
                                noteStructFront.put("id", noteRecord.index)
                                noteStructFront.put("note", note)

                                val noteStatus = JSObject()
                                noteStatus.put("tx_status", noteRecord.tx_status)
                                noteStatus.put("tx_height", noteRecord.tx_height)
                                noteStatus.put("tx_hash", noteRecord.tx_hash)
                                noteStatus.put("addressIndex", noteRecord.addressIndex)
                                if(noteRecord.sharer != null) {
                                    noteStatus.put("sharer", noteRecord.sharer)
                                }
                                noteStructFront.put("status", noteStatus)

                                val ret = JSObject()
                                ret.put("value", noteStructFront)
                                call.success(ret)
                            } else {
                                call.error("note has been deleted")
                            }
                        } else {
                            call.error("no decryptedNote")
                        }
                    } else {
                        call.error("no noteScriptHex")
                    }
                } else {
                    call.error("no noteRecord")
                }
            }
        } else {
            if (syncMap[event] == null) {
                val pcq: Queue<PluginCall> = ArrayDeque()
                pcq.add(call)
                syncMap[event] = pcq
            } else {
                syncMap[event]!!.add(call)
            }
            sendMessageToNodeChannelWrap(EVENT_CHANNEL, msgObject.toString())
        }
    }

    private fun safeHandleMsg(call: PluginCall): JSObject {
        val msg = call.getString("msg")
        val msgObject = JSObject(msg)
        val payload = msgObject.getString("payload")
        if (payload == null) {
            msgObject.put("payload", "null")
        }
        return msgObject
    }

    override fun load() {
        mContext = context
        Kotpref.gson = Gson()
        notifyListenersStatic = ::notifyListeners
        // Sets the TMPDIR environment to the cacheDir, to be used in Node as os.tmpdir
        try {
            Os.setenv("TMPDIR", context.cacheDir.absolutePath, true)
        } catch (e: ErrnoException) {
            e.printStackTrace()
        }
        filesDir = context.filesDir.absolutePath
        libsDir = context.filesDir.parent + "/lib"
        // Register the filesDir as the Node data dir.
        registerNodeDataDirPath(filesDir)
        nodeAppRootAbsolutePath = "$filesDir/$PROJECT_ROOT"
        nodePath = "$nodeAppRootAbsolutePath:$libsDir"
        nativeAssetsPath = BUILTIN_NATIVE_ASSETS_PREFIX + getCurrentABIName()
        startNode(context!!)
    }

    fun startNode(context: Context) {
        if (!startedNodeAlready) {
            startedNodeAlready = true
            Thread(Runnable { //The path where we expect the node project to be at runtime.
                val nodeDir = context.filesDir.absolutePath + "/" + PROJECT_ROOT
                if (wasAPKUpdated(context)) {
                    //Recursively delete any existing nodejs-project.
                    val nodeDirReference = File(nodeDir)
                    if (nodeDirReference.exists()) {
                        deleteFolderRecursively(File(nodeDir))
                    }
                    //Copy the node project from assets into the application's data path.
                    copyAssetFolder(context.assets, PROJECT_ROOT, nodeDir)
                    saveLastUpdateTime(context)
                }
                startNodeWithArguments(arrayOf("node", "$nodeDir/main.js", if (BuildConfig.DEBUG) "-D" else "-P"), nodePath, BuildConfig.DEBUG)
            }).start()
        }
    }

    public override fun handleOnPause() {
        super.handleOnPause()
        if (nodeIsReadyForAppEvents) {
            sendMessageToNodeChannel(SYSTEM_CHANNEL, "pause")
        }
    }

    public override fun handleOnResume() {
        super.handleOnResume()
        startNode(context!!)
        if (nodeIsReadyForAppEvents) {
            sendMessageToNodeChannel(SYSTEM_CHANNEL, "resume")
        }
    }

    private fun wasAPKUpdated(context: Context): Boolean {
        val prefs = context.getSharedPreferences("NODEJS_MOBILE_PREFS", Context.MODE_PRIVATE)
        val previousLastUpdateTime = prefs.getLong("NODEJS_MOBILE_APK_LastUpdateTime", 0)
        var lastUpdateTime: Long = 1
        try {
            val packageInfo = getContext().packageManager.getPackageInfo(getContext().packageName, 0)
            lastUpdateTime = packageInfo.lastUpdateTime
        } catch (e: PackageManager.NameNotFoundException) {
            e.printStackTrace()
        }
        return lastUpdateTime != previousLastUpdateTime
    }

    private fun saveLastUpdateTime(context: Context?) {
        var lastUpdateTime: Long = 1
        try {
            val packageInfo = context!!.packageManager.getPackageInfo(context.packageName, 0)
            lastUpdateTime = packageInfo.lastUpdateTime
        } catch (e: PackageManager.NameNotFoundException) {
            e.printStackTrace()
        }
        val prefs = context!!.getSharedPreferences("NODEJS_MOBILE_PREFS", Context.MODE_PRIVATE)
        val editor = prefs.edit()
        editor.putLong("NODEJS_MOBILE_APK_LastUpdateTime", lastUpdateTime)
        editor.apply()
    }
}
