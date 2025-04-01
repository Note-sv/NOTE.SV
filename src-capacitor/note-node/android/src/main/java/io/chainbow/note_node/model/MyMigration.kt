package io.chainbow.note_node.model

import io.realm.DynamicRealm
import io.realm.RealmMigration

// Example migration adding a new class
class MyMigration : RealmMigration {
    override fun migrate(realm: DynamicRealm, oldVersion: Long, newVersion: Long) {
        var version = oldVersion

        // DynamicRealm exposes an editable schema
        val schema = realm.schema

        if(oldVersion<10) {
            schema.remove("NoteRecord")
            schema.remove("NoteTxRecord")
        }

        // Migrate to version 1: Add a new class.
        // Example:
        // open class Person(
        //     var name: String = "",
        //     var age: Int = 0,
        // ): RealmObject()
//        if (version == 0L) {
//            schema.get("NoteRecord")?.apply {
//                addField("draft", Boolean::class.java).setNullable("draft", true)
//            }
//            version++
//        }

    }
}