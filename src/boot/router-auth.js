import _ from 'lodash'
import config from '../config'
const console = config.console

export default async ( { Vue, router, store } ) => {
  await store.dispatch( 'account/checkAccount' )
  router.beforeEach( ( to, from, next ) => {
    const hasAccount = store.state.account.hasAccount
    const password = store.state.account.password
    if ( hasAccount ) {
      if ( password === '' && !_.startsWith( to.path, '/locking' ) ) {
        // 如果是login状态，不能进入创建账号页面
        next( '/locking' )
        return
      }
      if ( _.startsWith( to.path, '/account' ) ) {
        // 如果是login状态，不能进入创建账号页面, 进入缺省页面
        const frontPage = store.state.settings.userSettings.frontPage

        next( frontPage || '/' )
        return
      }
    } else {
      if ( !_.startsWith( to.path, '/account' ) ) {
        next( '/account' )
        console.log( 'not logged in yet' )
      }
    }
    next()
  } )
}
