
import config from '../config'
const console = config.console
import { EventEmitter } from 'events'

class Ipc extends EventEmitter {
  constructor ( ) {
    super()
    // 不同的模式使用不同的通信手段
    if ( process.env.MODE === 'electron' ) {
      const { ipcRenderer } = require( 'electron' )
      this.ipc = ipcRenderer
    } else if ( process.env.MODE === 'capacitor' ) {
      this.ipc = require( './capacitor' ).default
    } else {
      this.ipc = require( './mock' ).default
    }
    console.log(this.ipc)
  }

  on (channel, listener) {
    return this.ipc.on(channel, listener)
  }

  async sendSync (channel, args ) {
    return this.ipc.sendSync(channel, args)
  }

  send (channel, args ) {
    return this.ipc.send(channel, args)
  }
}

// 一个单件实例
export default new Ipc()
