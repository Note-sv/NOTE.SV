// import _ from 'lodash'
import config from '../config'
const console = config.console
import { EventEmitter } from 'events'

class Mock extends EventEmitter {
  on (channel, listener) {
    console.log(channel, listener)
  }

  async sendSync (channel, args) {
    console.log(channel, args)
  }

  send (channel, args) {
    console.log(channel, args)
  }
}

export default new Mock()
