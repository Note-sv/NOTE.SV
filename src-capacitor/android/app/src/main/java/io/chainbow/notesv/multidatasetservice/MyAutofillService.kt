/*
 * Copyright (C) 2017 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.chainbow.notesv.multidatasetservice

import android.os.Build
import android.os.CancellationSignal
import android.service.autofill.*
import androidx.annotation.RequiresApi
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.Toast
import io.chainbow.notesv.CommonUtil.bundleToString
import io.chainbow.notesv.MainActivity
import io.chainbow.notesv.R
import timber.log.Timber

@RequiresApi(Build.VERSION_CODES.O)
class MyAutofillService : AutofillService() {

    override fun onFillRequest(request: FillRequest, cancellationSignal: CancellationSignal,
                               callback: FillCallback) {
        val structure = request.fillContexts[request.fillContexts.size - 1].structure
        val packageName = structure.activityComponent.packageName
        if (!PackageVerifier.isValidPackage(applicationContext, packageName)) {
            Toast.makeText(applicationContext, R.string.invalid_package_signature,
                    Toast.LENGTH_SHORT).show()
            return
        }
        val data = request.clientState
        Timber.d("onFillRequest(): data=%s", bundleToString(data))
        cancellationSignal.setOnCancelListener { Timber.w("Cancel autofill not implemented in this sample.") }
        // Parse AutoFill data in Activity
        val parser = StructureParser(structure)
        parser.parseForFill()
        val autofillFields = parser.autofillFields

        val autofillIds = autofillFields.autofillIds
        if (autofillIds.size != 0) {
            val responseBuilder = FillResponse.Builder()
            addQueryDataset(autofillIds, responseBuilder)
            callback.onSuccess(responseBuilder.build())
        } else {
            callback.onSuccess(null)
        }
    }

    private fun addQueryDataset(autofillIds: ArrayList<AutofillId>, responseBuilder: FillResponse.Builder) {
        val sender = MainActivity.getAuthIntentSenderForLogin(this)
        val presentation = AutofillHelper.newRemoteViews(this.packageName, getString(R.string.autofill_sign_in_prompt), R.mipmap.ic_launcher);

        val datasetBuilder = Dataset.Builder(presentation)
        datasetBuilder.setAuthentication(sender)
        //need to add placeholders so we can directly fill after ChooseActivity
        for (autofillId in autofillIds) {
            datasetBuilder.setValue(autofillId, AutofillValue.forText("PLACEHOLDER"));
        }

        responseBuilder.addDataset(datasetBuilder.build())
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
        val context = request.fillContexts
        val structure = context[context.size - 1].structure
        val packageName = structure.activityComponent.packageName
        if (!PackageVerifier.isValidPackage(applicationContext, packageName)) {
            Toast.makeText(applicationContext, R.string.invalid_package_signature,
                    Toast.LENGTH_SHORT).show()
            return
        }
        val data = request.clientState
        Timber.d("onSaveRequest(): data=%s", bundleToString(data))
        val parser = StructureParser(structure)
        parser.parseForSave()
    }

    override fun onConnected() {
        Timber.d("onConnected")
    }

    override fun onDisconnected() {
        Timber.d("onDisconnected")
    }
}
