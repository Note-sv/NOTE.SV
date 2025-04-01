// import _ from 'lodash'
import config from '../../config'
const console = config.console
import { Plugins } from '@capacitor/core'
const { Storage } = Plugins

class Capacitor {
  async set (key, value) {
    await Storage.set({
      key: key,
      value: JSON.stringify(value)
    })
  }

  async getItem (key) {
    const ret = await Storage.get({ key: key })
    console.log('Got item: ', ret)
    return JSON.parse(ret.value)
  }
}

export default new Capacitor()
