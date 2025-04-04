//
// Created by 蘇豪 on 2020/04/04.
//

public struct Queue<T> {
    public var array = [T]()

    public var isEmpty: Bool {
        array.isEmpty
    }

    public var count: Int {
        array.count
    }

    public mutating func enqueue(_ element: T) {
        array.append(element)
    }

    public mutating func dequeue() -> T? {
        if isEmpty {
            return nil
        } else {
            return array.removeFirst()
        }
    }

    public var front: T? {
        array.first
    }
}