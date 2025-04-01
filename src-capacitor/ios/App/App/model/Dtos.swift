//
// Created by 蘇豪 on 2020/04/04.
//

import Foundation
import RealmSwift
import SwiftyJSON

class ID {
    @objc dynamic var _id: String = ""
}

struct Seed {
    public static let SEED = "seed"

    static let _id = "_id"
    static let salt = "salt"
    static let doc = "doc"

    static func remove() {
        UserDefaults.standard.removeObject(forKey: _id)
        UserDefaults.standard.removeObject(forKey: salt)
        UserDefaults.standard.removeObject(forKey: doc)
    }
}

//笔记对象，只保留最新笔记
class NoteRecord: Object {
    public static let START_WITH = "note_"

    @objc dynamic var _id: String = ""
    @objc dynamic var index: Int64 = 0
    @objc dynamic var address: String? = nil
    @objc dynamic var tms: Int64 = 0
    @objc dynamic var noteScriptHex: String? = nil
    @objc dynamic var decryptedNote: String? = nil
    @objc dynamic var tx_status = 0
    @objc dynamic var tx_height = 0
    @objc dynamic var tx_hash: String? = nil
    @objc dynamic var raw: String? = nil
    @objc dynamic var draft = false
    @objc dynamic var del = false
    @objc dynamic var sharer: String? = nil
    @objc dynamic var addressIndex: Int64  = 0
    @objc dynamic var outputIndex: Int64  = 0

    override static func primaryKey() -> String? {
        "_id"
    }
}

//class DecryptedNote: Object {
//    @objc dynamic var _id: String = ""
//    @objc dynamic var ttl: String? = nil
//    @objc dynamic var fid: String? = nil
//    @objc dynamic var pwd: String? = nil
//    @objc dynamic var url: String? = nil
//    @objc dynamic var otp: String? = nil
//    @objc dynamic var mem: String? = nil
//    @objc dynamic var tms = 0
//    @objc dynamic var del = false
//
//    override static func primaryKey() -> String? {
//        "_id"
//    }
//}

//普通交易记录，来自网络浏览器
class TxRecord: Object {
    @objc dynamic var _id: String = ""
    @objc dynamic var height = 0
    @objc dynamic var raw: String? = nil
    @objc dynamic var income: Int64  = 0
    @objc dynamic var outcome: Int64  = 0
    @objc dynamic var type: String? = nil
    @objc dynamic var time: Int64  = 0
    @objc dynamic var tx_hash: String? = nil
    @objc dynamic var address: String? = nil

    override static func primaryKey() -> String? {
        "_id"
    }
}

class NoteTxRecord: Object {
    public static let START_WITH = "tx_"

    @objc dynamic var _id: String = ""
    @objc dynamic var index: Int64 = 0
    @objc dynamic var address: String? = nil
    @objc dynamic var tms: Int64 = 0
    @objc dynamic var noteScriptHex: String? = nil
    @objc dynamic var tx_status = 0
    @objc dynamic var tx_height = 0
    @objc dynamic var tx_hash: String? = nil
    @objc dynamic var outputIndex: Int64  = 0
    @objc dynamic var addressIndex: Int64  = 0
    @objc dynamic var updated: Int64  = 0
    @objc dynamic var raw: String? = nil
    @objc dynamic var sharer: String? = nil
    @objc dynamic var draft = false
    @objc dynamic var del = false

    override static func primaryKey() -> String? {
        "_id"
    }
}
