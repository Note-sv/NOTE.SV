// import _ from 'lodash'
// import config from '../config'
// const console = config.console
import { EventEmitter } from 'events'
import { Plugins } from '@capacitor/core'
const { NoteNode, StatusBar } = Plugins
import _ from 'lodash'
import { colors } from 'quasar'

StatusBar.setBackgroundColor({ color: colors.getBrand('primary') })

class Capacitor extends EventEmitter {
  on (event, listener) {
    NoteNode.addListener(event, (info) => {
      listener(this, info.value)
    })
  }

  async sendSync (event, args) {
    var result = await NoteNode.sendMessageToNodeSync({ msg: MessageCodec.serialize(event, args) })
    if (_.isEmpty(result)) return null
    return result.value
  }

  send (event, args) {
    NoteNode.sendMessageToNode({ msg: MessageCodec.serialize(event, args) })
  }
}

export default new Capacitor()

class MessageCodec {
  // This is a 'private' constructor, should only be used by this class
  // static methods.
  constructor (_event, _payload) {
    this.event = _event
    this.payload = JSON.stringify(_payload)
  };

  // Serialize the message payload and the message.
  static serialize (event, payload) {
    const envelope = new MessageCodec(event, payload)
    // Return the serialized message, that can be sent through a channel.
    return JSON.stringify(envelope)
  };

  // Deserialize the message and the message payload.
  static deserialize (message) {
    var envelope = JSON.parse(message)
    if (typeof envelope.payload !== 'undefined') {
      envelope.payload = JSON.parse(envelope.payload)
    }
    return envelope
  };
};
