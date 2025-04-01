package io.chainbow.note_node.util

import java.io.Serializable

class MessageCodec(
        var event: String,
        var payload: String?
) : Serializable