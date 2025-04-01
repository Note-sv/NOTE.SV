import Foundation
import Capacitor
import Cordova
import NodeMobile
import UIKit
import RealmSwift
import SwiftyJSON
import KeychainSwift

private var activeInstance: CDVNodeJS? = nil
let SYSTEM_CHANNEL = "_SYSTEM_"
let EVENT_CHANNEL = "_EVENTS_"
let DB_CHANNEL = "_DB_"
let TRUE = "true"
let FALSE = "false"
private var engineAlreadyStarted = false

// The callback id of the Cordova channel listener
var allChannelsListenerCallbackId: String? = nil
// script name to preload and override dlopen to open native modules from the Framework Path.
let NODEJS_DLOPEN_OVERRIDE_FILENAME = "override-dlopen-paths-preload.js"
// path where the nodejs-project is contained inside the Application package.
let NODE_ROOT = "/www/nodejs-project/"
// Flag to indicate if node is ready to receive app events.
var nodeIsReadyForAppEvents = false
// Condition to wait on pause event handling on the node side.
var appEventBeingProcessedCondition = NSCondition()
// Set to keep ids for called pause events, so they can be unlocked later.
var appPauseEventsManagerSet: Set<AnyHashable> = []
// Lock to manipulate the App Pause Events Manager Set.
var appPauseEventsManagerSetLock = NSObject()

typealias BridgeFun = (_ channelName: String, _ msg: String) -> Void
var bridgeFun: BridgeFun?

public struct glfw {
    static func setBridgeCallback(cbFun: @escaping BridgeFun) {
        _g.bridgeFun = cbFun
        RegisterBridgeCallback { channelName, msg in
            let channelName = String(cString: channelName!)
            let msg = String(cString: msg!)
            _g.bridgeFun!(channelName, msg)
        }
    }
    
    var bridgeFun: BridgeFun?
}

var _g = glfw()

@objc(NoteNode)
public class NoteNode: CAPPlugin {
    
    let keychain = KeychainSwift()
    var syncMap: Dictionary<String, Queue<CAPPluginCall>> = [:]
    
    @objc func getPassword(_ call: CAPPluginCall) {
        if (keychain.get("password") != nil) {
            let password = keychain.get("password")
            var ret = [String: Any]()
            ret["value"] = password
            call.success(ret)
        } else {
            call.error("no encryptedPassword saved")
        }
    }
    
    @objc func sendMessageToNode(_ call: CAPPluginCall) {
        sendMessageToNode(call, false)
    }
    
    @objc func sendMessageToNodeSync(_ call: CAPPluginCall) {
        sendMessageToNode(call, true)
    }
    
    func sendMessageToNode(_ call: CAPPluginCall, _ isSync: Bool) {
        guard var msg = call.getString("msg") else {
            print("msg can not be empty")
            return
        }
        do {
            var msgObject = JSON(parseJSON: msg).dictionaryObject!
            let event = msgObject["event"] as! String
            msgObject["payload"] = msgObject["payload"] ?? "null"
            msg = try String(bytes: JSONSerialization.data(withJSONObject: msgObject), encoding: .utf8)!
            if (event == "check-account") {
                var ret = Dictionary<String, Any>()
                ret["value"] = UserDefaults.standard.string(forKey: Seed.doc) != nil
                call.success(ret)
            } else if (event == "fecth-all-notes") {
                call.success()
                let realm: Realm? = try Realm()
                
                guard let realmLet = realm else {
                    return
                }
                let noteRecords = realmLet.objects(NoteRecord.self).sorted(byKeyPath: "tms")
                for noteRecord in noteRecords {
                    if (noteRecord.noteScriptHex != nil) {
                        if (noteRecord.decryptedNote != nil) {
                            var note = JSON(parseJSON: noteRecord.decryptedNote!).dictionaryObject!
                            if (note["del"] == nil || note["del"] as! Bool == false) {
                                var noteStructFront = Dictionary<String, Any>()
                                noteStructFront["id"] = noteRecord.index
                                //删除note里的mem和files，避免内存中数据过多
                                note.removeValue(forKey: "mem")
                                note.removeValue(forKey: "files")
                                note.removeValue(forKey: "images")
                                
                                noteStructFront["note"] = note
                                
                                var noteStatus = Dictionary<String, Any>()
                                noteStatus["tx_status"] = noteRecord.tx_status
                                noteStatus["tx_height"] = noteRecord.tx_height
                                noteStatus["tx_hash"] = noteRecord.tx_hash
                                noteStatus["addressIndex"] = noteRecord.addressIndex
                                if(noteRecord.sharer != nil) {
                                    noteStatus["sharer"] = noteRecord.sharer
                                }
                                noteStructFront["status"] = noteStatus
                                
                                var ret = Dictionary<String, Any>()
                                ret["value"] = noteStructFront
                                notifyListeners("note-changed", data: ret)
                            }
                        }
                    }
                }
            } else if (event == "get-note-by-id") {
                let realm: Realm? = try Realm()
                
                let payload = (msgObject["payload"] as! String)
                //payload是整数，不是字符串
                let id = NoteRecord.START_WITH + String(payload)
                
                if let noteRecord = realm!.object(ofType: NoteRecord.self, forPrimaryKey: id) {
                    if (noteRecord.noteScriptHex != nil) {
                        if (noteRecord.decryptedNote != nil) {
                            let note = JSON(parseJSON: noteRecord.decryptedNote!).dictionaryObject!
                            if (note["del"] == nil || note["del"] as! Bool == false) {
                                var noteStructFront = Dictionary<String, Any>()
                                noteStructFront["id"] = noteRecord.index
                                
                                noteStructFront["note"] = note
                                
                                var noteStatus = Dictionary<String, Any>()
                                noteStatus["tx_status"] = noteRecord.tx_status
                                noteStatus["tx_height"] = noteRecord.tx_height
                                noteStatus["tx_hash"] = noteRecord.tx_hash
                                noteStatus["addressIndex"] = noteRecord.addressIndex
                                if(noteRecord.sharer != nil) {
                                    noteStatus["sharer"] = noteRecord.sharer
                                }
                                noteStructFront["status"] = noteStatus
                                
                                var ret = Dictionary<String, Any>()
                                ret["value"] = noteStructFront
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
            } else {
                SendMessageToNodeChannel(EVENT_CHANNEL, msg)
                if (isSync) {
                    if (syncMap[event] == nil) {
                        var pcq = Queue<CAPPluginCall>()
                        pcq.enqueue(call)
                        syncMap[event] = pcq
                    } else {
                        syncMap[event]!.enqueue(call)
                    }
                } else {
                    call.success()
                }
            }
        } catch {
            print(error)
        }
    }
    
    //var config: Realm.Configuration? = nil
    
    func configRealm(seedString: String) {
        let documentDirectory = try! FileManager.default.url(for: .documentDirectory, in: .userDomainMask,
                                                             appropriateFor: nil, create: false)
        if (UserDefaults.standard.string(forKey: "notesvRealmPath") == nil) {
            UserDefaults.standard.set("\(UUID().uuidString).realm", forKey: "notesvRealmPath")
        }
        let url = documentDirectory.appendingPathComponent(UserDefaults.standard.string(forKey: "notesvRealmPath")!)
        
        let key = seedString.data(using: .utf8)!.sha256.data(using: .utf8)
        
        //        config = Realm.Configuration(
        //                fileURL: url,
        //                encryptionKey: key,
        //                deleteRealmIfMigrationNeeded: true
        //        )
        //
        let config = Realm.Configuration(
            fileURL: url,
            encryptionKey: key,
            
            // Set the new schema version. This must be greater than the previously used
            // version (if you've never set a schema version before, the version is 0).
            schemaVersion: 12,
            
            // Set the block which will be called automatically when opening a Realm with
            // a schema version lower than the one set above
            migrationBlock: { migration, oldSchemaVersion in
                // We haven’t migrated anything yet, so oldSchemaVersion == 0
                if (oldSchemaVersion < 12) {
                    // Nothing to do!
                    // Realm will automatically detect new properties and removed properties
                    // And will update the schema on disk automatically
                    migration.deleteData(forType: NoteRecord.className());
                    migration.deleteData(forType: NoteTxRecord.className());
                }
        })
        
        // Tell Realm to use this new configuration object for the default Realm
        Realm.Configuration.defaultConfiguration = config
        
    }
    
    func startNode() {
        let srcPath = Bundle.main.path(forResource: "nodejs-project/main.js", ofType: "")
        let nodeArguments = Array(arrayLiteral: "node", srcPath, isDebug ? "-D" : "-P")
        NodeJSRunner.startEngine(withArguments: nodeArguments as [Any])
    }
    
    let NODE_PATH = "NODE_PATH"
    let BUILTIN_MODULES = "/www/nodejs-mobile-cordova-assets/builtin_modules"
    
    override public func load() {
        
        synced(self) {
            glfw.setBridgeCallback(cbFun: {
                channelName, msg in
                do {
                    //                    #if DEBUG
                    //                    print("\(channelName) \(msg)")
                    //                    #endif
                    
                    if (channelName == SYSTEM_CHANNEL) {
                        self.handleAppChannelMessage(msg: msg)
                    } else if (channelName == DB_CHANNEL) {
                        let msgObject = JSON(parseJSON: msg).dictionaryObject!
                        let event = msgObject["event"] as! String
                        let payload = msgObject["payload"] as! String
                        var payloadReturn = payload
                        
                        let _id = payload[1..<payload.count - 1]
                        if (_id == Seed.SEED) {
                            let defaults = UserDefaults.standard
                            let doc = defaults.string(forKey: Seed.doc)
                            if (doc != nil) {
                                var seedDictionary: Dictionary<String, String> = [:]
                                seedDictionary[Seed._id] = defaults.string(forKey: Seed._id)
                                seedDictionary[Seed.salt] = defaults.string(forKey: Seed.salt)
                                seedDictionary[Seed.doc] = defaults.string(forKey: Seed.doc)
                                payloadReturn = JSON(seedDictionary).rawString([.castNilToNSNull: true])!
                            } else {
                                payloadReturn = "null"
                            }
                        }else{
                            //self.configRealm(seedString: JSON(parseJSON: payload).dictionaryObject!["seedString"] as! String)
                            
                            let realm: Realm? = try Realm()
                            
                            if (event.hasPrefix(REALM_GET)) {
                                payloadReturn = self.getRealmData(payload: payload, realm: realm)
                            } else if (event.hasPrefix(REALM_PUT)) {
                                payloadReturn = self.putRealmData(payload: payload, realm: realm)
                            } else if (event.hasPrefix(REALM_FIND)) {
                                payloadReturn = self.findRealmData(payload: payload, realm: realm)
                            } else if (event.hasPrefix(REALM_REMOVE)) {
                                payloadReturn = self.removeRealmData(payload: payload, realm: realm)
                            }
                        }
                        let msgToNode = JSON(MessageCodecDictionary(event, payloadReturn)).rawString([.castNilToNSNull: true])!
                        //                        #if DEBUG
                        //                        print("sendMessageToApplication event out: \(channelName) msg: \(msgToNode)")
                        //                        #endif
                        SendMessageToNodeChannel(DB_CHANNEL, msgToNode)
                    } else if (channelName == EVENT_CHANNEL) {
                        let msgObject = try JSONSerialization.jsonObject(with: msg.data(using: .utf8)!) as! Dictionary<String, Any>
                        let event = msgObject["event"] as! String
                        let payload = msgObject["payload"] as! String
                        if (self.syncMap[event] != nil) {
                            guard let pc = self.syncMap[event]!.dequeue() else {
                                return
                            }
                            if (self.syncMap[event]!.count == 0) {
                                self.syncMap.removeValue(forKey: event)
                            }
                            
                            if (event == "login-with-password") {
                                if (payload != "null") {
                                    self.configRealm(seedString: JSON(parseJSON: payload).dictionaryObject!["seedString"] as! String)
                                }
                            }
                            
                            if (event == "save-seed-string") {
                                let payloadObject = JSON(parseJSON: payload).dictionaryObject!
                                if (payload != "null") {
                                    self.configRealm(seedString: payloadObject["seedString"] as! String)
                                }
                                
                                self.keychain.set(payloadObject["password"] as! String, forKey: "password")
                            }
                            
                            pc.success(self.constructReturnToFront(payload: payload))
                        } else if (event == "settings") {
                            let settings = UserDefaults.standard.string(forKey: "_cap_settings")
                            let msgToNode = JSON(MessageCodecDictionary(event, settings)).rawString([.castNilToNSNull: true])!
                            SendMessageToNodeChannel(EVENT_CHANNEL, msgToNode)
                        } else {
                            self.notifyListeners(event, data: self.constructReturnToFront(payload: payload))
                        }
                    }
                } catch {
                    print(error)
                }
            })
        }
        
        let nodeDataDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].absoluteString
        RegisterNodeDataDirPath(nodeDataDir)
        
        startNode()
    }
    
    private func constructReturnToFront(payload: String) -> Dictionary<String, Any> {
        var ret = Dictionary<String, Any>()
        let json = JSON(parseJSON: payload)
        switch json.type {
        case .array:
            ret["value"] = json.arrayObject
        case .dictionary:
            ret["value"] = json.dictionaryObject
        default:
            do {
                let number = Decimal(string: payload)
                if (number == nil || number!.description.count != payload.count) {
                    throw MyError.conversionError
                }
                ret["value"] = number
            } catch {
                switch payload {
                case "null":
                    ret["value"] = nil
                case TRUE, FALSE:
                    ret["value"] = Bool(payload)
                default:
                    ret["value"] = String(payload[1..<(payload.count - 1)])
                }
            }
        }
        return ret
    }
    
    private func removeRealmData(payload: String, realm: Realm?) -> String {
        var payloadReturn = TRUE
        let removeDB = payload[1..<payload.count - 1] == "db"
        if (removeDB) {
            do {
                let documentDirectory = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask,
                                                                    appropriateFor: nil, create: false)
                let realmURL = documentDirectory.appendingPathComponent(UserDefaults.standard.string(forKey: "notesvRealmPath")!)
                let realmURLs = [
                    realmURL,
                    realmURL.appendingPathExtension("lock"),
                    realmURL.appendingPathExtension("note"),
                    realmURL.appendingPathExtension("management")
                ]
                for URL in realmURLs {
                    try FileManager.default.removeItem(at: URL)
                }
                Seed.remove()
                keychain.delete("password")
                UserDefaults.standard.removeObject(forKey: "notesvRealmPath")
            } catch {
                payloadReturn = error.localizedDescription
            }
        } else {
            let json = JSON(parseJSON: payload).dictionaryObject ?? [:]
            let _id = json["_id"] as! String
            do {
                if (_id == Seed.SEED) {
                } else if (_id.hasPrefix(NoteTxRecord.START_WITH)) {
                    if let noteTxRecord = realm?.object(ofType: NoteTxRecord.self, forPrimaryKey: _id) {
                        try realm?.write {
                            realm?.delete(noteTxRecord)
                        }
                    } else {
                        payloadReturn = FALSE
                    }
                } else if (_id.hasPrefix(NoteRecord.START_WITH)) {
                    if let noteRecord = realm?.object(ofType: NoteRecord.self, forPrimaryKey: _id) {
                        try realm?.write {
                            realm?.delete(noteRecord)
                        }
                    } else {
                        payloadReturn = FALSE
                    }
                } else {
                }
            } catch {
                payloadReturn = error.localizedDescription
            }
        }
        return payloadReturn
    }
    
    private func findRealmData(payload: String, realm: Realm?) -> String {
        var payloadReturn = ""
        let json = JSON(parseJSON: payload).dictionaryObject ?? [:]
        let selector = json["selector"] as? Dictionary<String, Any>
        if (selector != nil) {
            let tx_status = selector!["tx_status"] as? Int
            let _id = selector!["_id"] as? String
            let tx_hash = json["tx_hash"] as? String
            let draft = selector!["draft"] as? Bool
            let del = selector!["del"] as? Bool
            if (tx_status != nil) {
                if (_id != nil) {
                    //根据id和状态查找
                    if (_id!.hasPrefix(NoteTxRecord.START_WITH)) {
                        let predicate = NSPredicate(format: "tx_status = %i AND _id BEGINSWITH %@", tx_status!, _id!)
                        let noteTxRecords = realm?.objects(NoteTxRecord.self).filter(predicate)
                        payloadReturn = getJsonArray(results: noteTxRecords)
                    }
                } else if (draft != nil) {
                    //检测笔记交易，检索未完成的交易记录等情况
                    let predicate = NSPredicate(format: "tx_status = %i AND draft = %@", tx_status!, NSNumber(value: draft!) )
                    let noteTxRecords = realm?.objects(NoteTxRecord.self).filter(predicate)
                    payloadReturn = getJsonArray(results: noteTxRecords)
                }
            } else if (tx_hash != nil) {
                if (_id != nil) {
                    if (_id!.hasPrefix(NoteRecord.START_WITH)) {
                        let predicate = NSPredicate(format: "tx_hash = %@", tx_hash!)
                        let noteRecords = realm?.objects(NoteRecord.self).filter(predicate)
                        payloadReturn = getJsonArray(results: noteRecords)
                    } else if (_id!.hasPrefix(NoteTxRecord.START_WITH)) {
                        let predicate = NSPredicate(format: "tx_hash = %@", tx_hash!)
                        let noteTxRecords = realm?.objects(NoteTxRecord.self).filter(predicate)
                        payloadReturn = getJsonArray(results: noteTxRecords)
                    }
                }
            } else if (_id != nil) {
                if (_id == NoteRecord.START_WITH && del==true) {
                    let predicate = NSPredicate(format: "del = %i", del!)
                    let noteRecords = realm?.objects(NoteRecord.self).filter(predicate)
                    payloadReturn = getJsonArray(results: noteRecords)
                } else if (_id == NoteRecord.START_WITH) {
                    payloadReturn = getJsonArray(results: realm?.objects(NoteRecord.self).sorted(byKeyPath: "tms"))
                } else if (_id!.hasPrefix(NoteTxRecord.START_WITH)) {
                    let predicate = NSPredicate(format: "_id BEGINSWITH %@", _id!)
                    var noteTxRecords = realm?.objects(NoteTxRecord.self).filter(predicate)
                    if (json["sort"] != nil) {
                        noteTxRecords = noteTxRecords?.sorted(byKeyPath: (json["sort"] as! [String]).first!)
                    }
                    payloadReturn = getJsonArray(results: noteTxRecords)
                }
            }
        }
        return payloadReturn
    }
    
    private func putRealmData(payload: String, realm: Realm?) -> String {
        var payloadReturn = TRUE
        let json = JSON(parseJSON: payload).dictionaryObject ?? [:]
        let _id = json["_id"] as! String
        if (_id == Seed.SEED) {
            let defaults = UserDefaults.standard
            defaults.set(json[Seed._id], forKey: Seed._id)
            defaults.set(json[Seed.salt], forKey: Seed.salt)
            defaults.set(json[Seed.doc], forKey: Seed.doc)
        } else {
            do {
                if let realmLet = realm {
                    try realmLet.write {
                        if (_id.hasPrefix(NoteTxRecord.START_WITH)) {
                            realmLet.create(NoteTxRecord.self, value: json, update: .modified)
                        } else if (_id.hasPrefix(NoteRecord.START_WITH)) {
                            realmLet.create(NoteRecord.self, value: json, update: .modified)
                        } else {
                            realmLet.create(TxRecord.self, value: json, update: .modified)
                        }
                    }
                } else {
                    payloadReturn = FALSE
                }
            } catch {
                payloadReturn = error.localizedDescription
            }
        }
        return payloadReturn
    }
    
    private func getRealmData(payload: String, realm: Realm?) -> String {
        var payloadReturn = ""
        let _id = payload[1..<payload.count - 1]
        if (_id.hasPrefix(NoteTxRecord.START_WITH)) {
            payloadReturn = realm?.getResult(_id, ofType: NoteTxRecord.self) ?? "null"
        }else if (_id.hasPrefix(NoteRecord.START_WITH)) {
            payloadReturn = realm?.getResult(_id, ofType: NoteRecord.self) ?? "null"
        } else {
            payloadReturn = realm?.getResult(_id, ofType: TxRecord.self) ?? "null"
        }
        return payloadReturn
    }
    
    func sendMessageToApplication(_ msg: String) {
        let ret = JSON(parseJSON: msg).dictionaryObject!
        self.notifyListeners((ret["event"] as! String), data: JSON(parseJSON: ret["payload"] as! String).dictionaryObject)
    }
    
    func handleAppChannelMessage(msg: String) {
        if (msg == "ready-for-app-events") {
            nodeIsReadyForAppEvents = true;
            self.notifyListeners(msg, data: nil)
            NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: OperationQueue.main) {
                (notification) in
                SendMessageToNodeChannel(SYSTEM_CHANNEL, "resume")
            }
            NotificationCenter.default.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: OperationQueue.main) {
                (notification) in
                SendMessageToNodeChannel(SYSTEM_CHANNEL, "pause")
            }
        }
    }
    
}
