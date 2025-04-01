package io.chainbow.notesv

import android.app.Application
import com.chibatching.kotpref.Kotpref
import io.realm.Realm
import io.realm.RealmConfiguration
import timber.log.*

open class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Realm.init(this)
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
        Kotpref.init(this)
    }
}