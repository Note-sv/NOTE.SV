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
package io.chainbow.notesv.multidatasetservice.model

import android.os.Build
import android.service.autofill.Dataset
import androidx.annotation.RequiresApi
import android.util.Log
import android.view.View
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import io.chainbow.notesv.multidatasetservice.AutofillFieldMetadataCollection
import com.google.gson.annotations.Expose
import timber.log.Timber
import java.util.HashMap


/**
 * FilledAutofillFieldCollection is the model that represents all of the form data on a client app's page, plus the
 * dataset name associated with it.
 */
class FilledAutofillFieldCollection @JvmOverloads constructor(
        @Expose val hintMap: HashMap<String, FilledAutofillField> = HashMap<String,
                FilledAutofillField>()
) {

    /**
     * Sets values for a list of autofillHints.
     */
    fun add(autofillField: FilledAutofillField) {
        autofillField.autofillHints?.forEach { autofillHint ->
            hintMap[autofillHint] = autofillField
        }
    }

    /**
     * Populates a [Dataset.Builder] with appropriate values for each [AutofillId]
     * in a `AutofillFieldMetadataCollection`. In other words, it builds an Autofill dataset
     * by applying saved values (from this `FilledAutofillFieldCollection`) to Views specified
     * in a `AutofillFieldMetadataCollection`, which represents the current page the user is
     * on.
     */
    fun applyToFields(autofillFieldMetadataCollection: AutofillFieldMetadataCollection,
            datasetBuilder: Dataset.Builder): Boolean {
        var setValueAtLeastOnce = false
        for (hint in autofillFieldMetadataCollection.allAutofillHints) {
            val autofillFields = autofillFieldMetadataCollection.getFieldsForHint(hint) ?: continue
            for (autofillField in autofillFields) {
                val autofillId = autofillField.autofillId
                val autofillType = autofillField.autofillType
                val savedAutofillValue = hintMap[hint]
                when (autofillType) {
                    View.AUTOFILL_TYPE_LIST -> {
                        savedAutofillValue?.textValue?.let {
                            val index = autofillField.getAutofillOptionIndex(it)
                            if (index != -1) {
                                datasetBuilder.setValue(autofillId, AutofillValue.forList(index))
                                setValueAtLeastOnce = true
                            }
                        }
                    }
                    View.AUTOFILL_TYPE_DATE -> {
                        savedAutofillValue?.dateValue?.let { date ->
                            datasetBuilder.setValue(autofillId, AutofillValue.forDate(date))
                            setValueAtLeastOnce = true
                        }
                    }
                    View.AUTOFILL_TYPE_TEXT -> {
                        savedAutofillValue?.textValue?.let { text ->
                            datasetBuilder.setValue(autofillId, AutofillValue.forText(text))
                            setValueAtLeastOnce = true
                        }
                    }
                    View.AUTOFILL_TYPE_TOGGLE -> {
                        savedAutofillValue?.toggleValue?.let { toggle ->
                            datasetBuilder.setValue(autofillId, AutofillValue.forToggle(toggle))
                            setValueAtLeastOnce = true
                        }
                    }
                    else -> Timber.w("Invalid autofill type - %s", autofillType)
                }
            }
        }
        return setValueAtLeastOnce
    }

    /**
     * @param autofillHints List of autofill hints, usually associated with a View or set of Views.
     * @return whether any of the filled fields on the page have at least 1 autofillHint that is
     * in the provided autofillHints.
     */
    fun helpsWithHints(autofillHints: List<String>): Boolean {
        for (autofillHint in autofillHints) {
            hintMap[autofillHint]?.let { savedAutofillValue ->
                if (!savedAutofillValue.isNull()) {
                    return true
                }
            }
        }
        return false
    }
}
