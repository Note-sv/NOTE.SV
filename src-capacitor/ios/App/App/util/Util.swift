//
// Created by 蘇豪 on 2020/04/04.
//

import Foundation
import RealmSwift
import SwiftyJSON
import CommonCrypto
import CryptoKit

extension String {
    subscript(bounds: CountableClosedRange<Int>) -> String {
        let start = index(startIndex, offsetBy: bounds.lowerBound)
        let end = index(startIndex, offsetBy: bounds.upperBound)
        return String(self[start...end])
    }

    subscript(bounds: CountableRange<Int>) -> String {
        let start = index(startIndex, offsetBy: bounds.lowerBound)
        let end = index(startIndex, offsetBy: bounds.upperBound)
        return String(self[start..<end])
    }
}

let REALM_GET = "realm-get"
let REALM_PUT = "realm-put"
let REALM_FIND = "realm-find"
let REALM_REMOVE = "realm-remove"

func MessageCodecDictionary(_ event: String, _ payload: String?) -> Dictionary<String, String> {
    var messageCodecDictionary: Dictionary<String, String> = [:]
    messageCodecDictionary["event"] = event
    messageCodecDictionary["payload"] = payload
    return messageCodecDictionary
}

extension Object {
    func toDictionary() -> [String: AnyObject] {
        let properties = self.objectSchema.properties.map {
            $0.name
        }
        var dicProps = [String: AnyObject]()
        for (key, value) in self.dictionaryWithValues(forKeys: properties) {
            //key = key.uppercased()
            if let value = value as? ListBase {
                dicProps[key] = value.toArray1() as AnyObject
            } else if let value = value as? Object {
                dicProps[key] = value.toDictionary() as AnyObject
            } else {
                dicProps[key] = value as AnyObject
            }
        }
        return dicProps
    }
}

extension ListBase {
    func toArray1() -> [AnyObject] {
        var _toArray = [AnyObject]()
        for i in 0..<self._rlmArray.count {
            let obj = unsafeBitCast(self._rlmArray[i], to: Object.self)
            _toArray.append(obj.toDictionary() as AnyObject)
        }
        return _toArray
    }
}

extension Results {
    func toArray<T>(type: T.Type) -> [T] {
        return compactMap { $0 as? T }
    }
}

func getJsonArray<Element: Object>(results: Results<Element>?) -> String {
    var dicArray = [Dictionary<String, AnyObject>]()
    if let resultsLet = results {
        for item in resultsLet {
            dicArray.append(item.toDictionary())
        }
    }
    return JSON(dicArray).rawString([.castNilToNSNull: true])!
}

extension Realm {
    func getResult(_ _id: String, ofType type: Object.Type) -> String {
        let result = self.object(ofType: type, forPrimaryKey: _id)
        if (result != nil) {
            return JSON(result!.toDictionary()).rawString([.castNilToNSNull: true])!
        } else {
            return "null"
        }
    }
}

enum MyError : Error {
    case conversionError
}

private func hexString(_ iterator: Array<UInt8>.Iterator) -> String {
    iterator.map { String(format: "%02x", $0) }.joined()
}

extension Data {

    public var sha256: String {
        if #available(iOS 13.0, *) {
            return hexString(SHA256.hash(data: self).makeIterator())
        } else {
            var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
            self.withUnsafeBytes { bytes in
                _ = CC_SHA256(bytes.baseAddress, CC_LONG(self.count), &digest)
            }
            return hexString(digest.makeIterator())
        }
    }

}

func synced(_ lock: Any, closure: () -> ()) {
    objc_sync_enter(lock)
    closure()
    objc_sync_exit(lock)
}
