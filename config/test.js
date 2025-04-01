// 缺省的配置文件
import defaultConfig from './default'

// 重载配置文件
const config = Object.assign( {}, defaultConfig, {
  console: require( 'tracer' ).console( {
    level: 'info',
    inspectOpt: {
      showHidden: true, // the object's non-enumerable properties will be shown too
      depth: null
    }
  } ),
  servers: require('./servers_testnet.js').default
} )

export default config
