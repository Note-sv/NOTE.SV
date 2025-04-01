/**
 * Created by lilong on 2016/11/26.
 */

// 根据不同的NODE_ENV，输出不同的配置对象，默认输出development的配置对象
import developmentConfig from './development'
import productionConfig from './production'
import testConfig from './test'

const configFn = function () {
  if ( process.env.NODE_ENV === 'production' ) {
    return Object.assign( {}, productionConfig )
  } else if ( process.env.NODE_ENV === 'test' ) {
    return Object.assign( {}, testConfig )
  } else {
    return Object.assign( {}, developmentConfig )
  }
}

export default configFn()
