package io.chainbow.note_node.util

import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import io.realm.Realm
import io.realm.RealmModel
import io.realm.kotlin.where
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import timber.log.Timber
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.security.NoSuchProviderException
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import kotlin.experimental.and


object JsonUtil {
    fun isJSONValid(json: String?): Boolean {
        try {
            JSONObject(json)
        } catch (ex: JSONException) {
            // edited, to include @Arthur's comment
            // e.g. in case JSONArray is valid as well...
            try {
                JSONArray(json)
            } catch (ex1: JSONException) {
                return false
            }
        }
        return true
    }

    fun isJSONObjectValid(json: String?): Boolean {
        try {
            JSONObject(json)
        } catch (ex: JSONException) {
            return false
        }
        return true
    }

    fun isJSONArrayValid(json: String?): Boolean {
        try {
            JSONArray(json)
        } catch (ex1: JSONException) {
            return false
        }
        return true
    }
}

fun <E> E.toJson(): String {
    return Gson().toJson(this)
}

inline fun <reified E> toJsonObject(json: String?): E {
    return Gson().fromJson(json, E::class.java)
}

inline fun <reified E> toJsonArrayObject(json: String?): E {
    return Gson().fromJson(json, E::class.java)
}


const val REALM_GET = "realm-get"
const val REALM_PUT = "realm-put"
const val REALM_FIND = "realm-find"
const val REALM_REMOVE = "realm-remove"

inline fun <reified E : RealmModel> Realm.getResult(_id: String): String {
    val result = where<E>().equalTo("_id", _id).findFirst()
    return if (result != null) {
        copyFromRealm(result).toJson()
    } else {
        "null"
    }
}

object HashUtil {
    fun sha512(input: String) = hashString("SHA-512", input)

    fun sha256(input: String) = hashString("SHA-256", input)

    fun sha1(input: String) = hashString("SHA-1", input)

    /**
     * Supported algorithms on Android:
     *
     * Algorithm	Supported API Levels
     * MD5          1+
     * SHA-1	    1+
     * SHA-224	    1-8,22+
     * SHA-256	    1+
     * SHA-384	    1+
     * SHA-512	    1+
     */
    private fun hashString(type: String, input: String): String {
        val HEX_CHARS = "0123456789ABCDEF"
        val bytes = MessageDigest
                .getInstance(type)
                .digest(input.toByteArray())
        val result = StringBuilder(bytes.size * 2)

        bytes.forEach {
            val i = it.toInt()
            result.append(HEX_CHARS[i shr 4 and 0x0f])
            result.append(HEX_CHARS[i and 0x0f])
        }

        return result.toString()
    }
}