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

import android.content.Context
import android.os.Build
import android.service.autofill.Dataset
import androidx.annotation.DrawableRes
import androidx.annotation.RequiresApi
import android.view.View
import android.widget.RemoteViews
import io.chainbow.notesv.R
import io.chainbow.notesv.multidatasetservice.model.FilledAutofillFieldCollection


/**
 * This is a class containing helper methods for building Autofill Datasets and Responses.
 */
@RequiresApi(Build.VERSION_CODES.O)
object AutofillHelper {

    /**
     * Wraps autofill data in a [Dataset] object which can then be sent back to the
     * client View.
     */
    fun newDataset(context: Context, autofillFieldMetadata: AutofillFieldMetadataCollection,
                   filledAutofillFieldCollection: FilledAutofillFieldCollection): Dataset? {
        val datasetBuilder = Dataset.Builder(newRemoteViews(context.packageName, "dataset", R.drawable.ic_person_black_24dp))
        val setValueAtLeastOnce = filledAutofillFieldCollection.applyToFields(autofillFieldMetadata, datasetBuilder)
        if (setValueAtLeastOnce) {
            return datasetBuilder.build()
        }
        return null
    }

    fun newRemoteViews(packageName: String, remoteViewsText: String,
                       @DrawableRes drawableId: Int): RemoteViews {
        val presentation = RemoteViews(packageName, R.layout.multidataset_service_list_item)
        presentation.setTextViewText(R.id.text, remoteViewsText)
        presentation.setImageViewResource(R.id.icon, drawableId)
        return presentation
    }

    fun isValidHint(hint: String): Boolean {
        when (hint) {
            View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DATE,
            View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DAY,
            View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH,
            View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR,
            View.AUTOFILL_HINT_CREDIT_CARD_NUMBER,
            View.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE,
            View.AUTOFILL_HINT_EMAIL_ADDRESS,
            View.AUTOFILL_HINT_PHONE,
            View.AUTOFILL_HINT_NAME,
            View.AUTOFILL_HINT_PASSWORD,
            View.AUTOFILL_HINT_POSTAL_ADDRESS,
            View.AUTOFILL_HINT_POSTAL_CODE,
            View.AUTOFILL_HINT_USERNAME ->
                return true
            else ->
                return false
        }
    }
}