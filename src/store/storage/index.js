
import config from '../../config'
const console = config.console

class Storage {
  constructor ( ) {
    // 不同的模式使用不同的通信手段
    if ( process.env.MODE === 'electron' ) {
      const Store = require('electron-store')
      class ElectronStore extends Store {
        getItem (key) {
          return this.get(key)
        }
      }
      this.storage = new ElectronStore()
    } else if ( process.env.MODE === 'capacitor' ) {
      this.storage = require( './capacitor' ).default
    } else {
      this.storage = require( './mock' ).default
    }
    console.log(this.storage)
  }

  async set (key, value) {
    return this.storage.set(key, value)
  }

  async getItem (key) {
    return this.storage.getItem(key)
  }
}

// 一个单件实例
export default new Storage()
