// import _ from 'lodash'
import config from '../config'
const console = config.console
import { EventEmitter } from 'events'

class Mock extends EventEmitter {
  async set (key, value) {
    console.log(key, value)
  }

  async getItem (key) {
    console.log(key)
  }
}

export default new Mock()
