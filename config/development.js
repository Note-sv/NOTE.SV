// 缺省的配置文件
import defaultConfig from './default'
import axios from 'axios'
const appVersion = require('../package.json').version

const tracer = require( 'tracer' ).colorConsole( {
  format:
    '{{timestamp}} <{{title}}> {{path}}:{{line}} ({{method}}) {{message}}',
  level: 'debug',
  inspectOpt: {
    showHidden: true, // the object's non-enumerable properties will be shown too
    depth: null
  },
  transport: function (data) {
    if ( process.env.NODE_ENV === 'development' && console) {
      // eslint-disable-next-line no-console
      console.log(data.output)
    }
    if (data.title === 'error') {
      data.platform = process.platform
      data.appVersion = appVersion
      // 出错信息发送到后台服务器
      axios.post('https://back.note.sv/v1/error-report', data).catch(e => {
        // 无视出错信息
      })
    }
  }

} )
// 重载配置文件
const config = Object.assign( {}, defaultConfig, {
  // backServer: 'http://localhost/',
  console: tracer
  // servers: require('./servers_testnet.js').default

} )

export default config
