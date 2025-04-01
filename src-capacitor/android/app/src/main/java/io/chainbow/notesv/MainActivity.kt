package io.chainbow.notesv

import android.app.PendingIntent
import android.app.assist.AssistStructure
import android.content.Context
import android.content.Intent
import android.content.IntentSender
import android.os.Build
import android.os.Bundle
import android.service.autofill.Dataset
import androidx.annotation.RequiresApi
import android.view.autofill.AutofillManager
import com.ahm.capacitor.biometric.BiometricAuth
import com.getcapacitor.BridgeActivity
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import io.chainbow.note_node.NoteNode
import io.chainbow.note_node.model.Note
import io.chainbow.notesv.CommonUtil.EXTRA_FOR_RESPONSE
import io.chainbow.notesv.multidatasetservice.AutofillFieldMetadataCollection
import io.chainbow.notesv.multidatasetservice.AutofillHelper
import io.chainbow.notesv.multidatasetservice.StructureParser
import io.chainbow.notesv.multidatasetservice.model.FilledAutofillField
import io.chainbow.notesv.multidatasetservice.model.FilledAutofillFieldCollection
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.greenrobot.eventbus.EventBus
import org.greenrobot.eventbus.Subscribe
import org.greenrobot.eventbus.ThreadMode
import java.util.*

class MainActivity : BridgeActivity(), CoroutineScope by MainScope() {

    private var replyIntent: Intent? = null

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Initializes the Bridge
        init(savedInstanceState, object : ArrayList<Class<out Plugin?>?>() {
            init {
                // Ex: add(TotallyAwesomePlugin.class);
                add(NoteNode::class.java)
                add(BiometricAuth::class.java)
            }
        })

        if (!EventBus.getDefault().isRegistered(this)) {
            EventBus.getDefault().register(this)
        }
    }

    override fun onResume() {
        super.onResume()

        val forResponse = intent.getBooleanExtra(EXTRA_FOR_RESPONSE, false)
        if (forResponse) {
            // Send Event to Capacitor
            launch {
                delay(3000)
                NoteNode.notifyListenersStatic?.invoke("autofill", JSObject())
            }
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    @Subscribe(threadMode = ThreadMode.MAIN)
    fun onAutofillReturn(note: Note) {
        onSuccess(note)
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun onSuccess(note: Note) {
        val structure = intent.getParcelableExtra<AssistStructure>(AutofillManager.EXTRA_ASSIST_STRUCTURE) as AssistStructure
        val parser = StructureParser(structure)
        parser.parseForFill()
        val autofillFields: AutofillFieldMetadataCollection = parser.autofillFields
        replyIntent = Intent()
        val hintMap: HashMap<String, FilledAutofillField> = HashMap<String, FilledAutofillField>()
        hintMap.put(autofillFields.allAutofillHints[0], FilledAutofillField(null).apply {
            textValue = note.fid
        })
        hintMap.put(autofillFields.allAutofillHints[1], FilledAutofillField(null).apply {
            textValue = note.pwd
        })
        val fieldMetadataCollection = FilledAutofillFieldCollection(hintMap)
        AutofillHelper.newDataset(this, autofillFields, fieldMetadataCollection)?.let(this::setDatasetIntent)
        setResult(RESULT_OK, replyIntent)

        finish()
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun setDatasetIntent(dataset: Dataset) {
        replyIntent?.putExtra(AutofillManager.EXTRA_AUTHENTICATION_RESULT, dataset)
    }

    override fun onDestroy() {
        super.onDestroy()
        EventBus.getDefault().unregister(this)
    }

    companion object {
        internal fun getAuthIntentSenderForLogin(context: Context): IntentSender {
            val intent = Intent(context, MainActivity::class.java)
            intent.putExtra(EXTRA_FOR_RESPONSE, true)
            return PendingIntent.getActivity(context, 0, intent,
                    PendingIntent.FLAG_CANCEL_CURRENT).intentSender
        }
    }
}