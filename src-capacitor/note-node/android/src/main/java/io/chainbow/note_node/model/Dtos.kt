package io.chainbow.note_node.model

import com.chibatching.kotpref.KotprefModel
import com.chibatching.kotpref.gsonpref.gsonPref
import io.realm.RealmObject
import io.realm.annotations.PrimaryKey
import org.json.JSONObject

open class ID {
    var _id: String = ""
}

class Seed {
    var _id: String? = null
    var salt: String? = null
    var doc: String? = null

    companion object {
        const val SEED: String = "seed"
    }
}

object Store : KotprefModel() {
    var seed by gsonPref(Seed())
}

open class NoteRecord : RealmObject() {
    @PrimaryKey
    var _id: String = ""
    var index: Long? = null
    var address: String? = null
    var tms: Long? = null
    var noteScriptHex: String? = null
    var decryptedNote: String? = null
    var tx_status: Int? = null
    var tx_height: Long? = null
    var tx_hash: String? = null
    var raw: String? = null
    var draft: Boolean? = null
    var del: Boolean = false
    var sharer: String? = null
    var addressIndex: Long = 0
    var outputIndex: Long = 0

    companion object {
        const val START_WITH: String = "note_"
    }
}

//open class DecryptedNote : RealmObject() {
//    @PrimaryKey
//    var _id: String = ""
//    var ttl: String? = null
//    var fid: String? = null
//    var pwd: String? = null
//    var url: String? = null
//    var otp: String? = null
//    var mem: String? = null
//    var tms: Long? = null
//    var del: Boolean? = null
//}

open class TxRecord : RealmObject() {
    @PrimaryKey
    var _id: String = ""
    var tx_height: Long? = null
    var raw: String? = null
    var income: Long? = null
    var outcome: Long? = null
    var type: String? = null
    var time: Long? = null
    var tx_hash: String? = null
    var address: String? = null
}

open class NoteTxRecord : RealmObject() {
    @PrimaryKey
    var _id: String = ""
    var index: Long? = null
    var address: String? = null
    var tms: Long? = null
    var noteScriptHex: String? = null
    var tx_status: Int? = null
    var tx_height: Long? = null
    var tx_hash: String? = null
    var updated: Long? = null
    var raw: String? = null
    var draft: Boolean? = null
    var outputIndex: Long = 0
    var addressIndex: Long = 0
    var sharer: String? = null
    var del: Boolean = false

    companion object {
        const val START_WITH: String = "tx_"
    }
}

class Finder {
    var selector: Selector? = null
    var fields: Array<String>? = null
    var sort: Array<String>? = null
    var tx_hash: String? = null
}

class Selector {
    var _id: String? = null
    var tx_status: Int? = null
    var draft: Boolean? = null
    var del: Boolean? = null
}

class Note {
    var ttl: String? = null
    var fid: String? = null
    var pwd: String? = null
    var url: String? = null
    var otp: String? = null
    var mem: String? = null
    var tms: Long? = null
}

class NoteStructFront {
    var id: Long? = null
    var note: JSONObject? = null
    var status: NoteStatus? = null
}

class NoteStatus {
    var tx_status: Int? = null
    var tx_height: Long? = null
    var tx_hash: String? = null
}
