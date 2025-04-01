import config from '../config'
const console = config.console
import { i18n } from './i18n'

import ipc from '../communction'

// 状态监听
export default ( { app, store, Vue } ) => {
  // 账号余额变化
  ipc.on( 'balance', ( event, balance ) => {
    console.log( balance )
    store.commit( 'account/updateBalance', balance )
  } )
  // 交易记录状态
  ipc.on( 'transaction', ( event, transaction ) => {
    store.commit( 'notes/updateTransaction', transaction )
  } )

  // 服务器一览
  ipc.on( 'servers', ( event, servers ) => {
    store.commit( 'servers/setServers', servers )
  } )

  ipc.on( 'wallet-balance', ( event, balance ) => {
    if ( balance ) {
      store.commit( 'account/setBalance', balance )
      const message = i18n.t('balanceSatoshi', { walletBalance: store.state.account.walletBalance.toLocaleString() })

      Vue.prototype.$q.notify({
        color: 'positive',
        message,
        position: 'top'
      })
    }
  } )

  ipc.on( 'error', ( event, errorMessage ) => {
    Vue.prototype.$q.notify({
      color: 'negative',
      message: i18n.t(errorMessage),
      position: 'top'
    })
  } )

  ipc.on( 'message', ( event, message ) => {
    Vue.prototype.$q.notify({
      color: 'info',
      message: i18n.t(message),
      position: 'top'
    })
  } )

  ipc.on( 'system-settings', ( event, settings ) => {
    console.log(settings)
    if ( settings ) {
      // 服务端对系统设置发生变更
      store.dispatch( 'settings/svSystemSettings', settings )
    }
  } )

  // 主线程从区块中获取note后，发送通知给UI线程
  ipc.on( 'note-changed', ( event, payload ) => {
    if ( payload ) {
      store.dispatch( 'notes/svChanged', payload )
    }
  } )

  // 主线程从区块中获取note后，发送通知给UI线程
  ipc.on( 'tx-changed', ( event, payload ) => {
    if ( payload ) {
      store.dispatch( 'records/updateRecord', payload )
    }
  } )

  ipc.on('autofill', ( event, payload ) => {
    console.log('autofill')
    store.dispatch( 'notes/setAutofill', true )
  })

  ipc.on('lock-screen', ( event, payload ) => {
    // 如果是未登录状态什么也不做
    const hasAccount = store.state.account.hasAccount
    if ( !hasAccount ) {
      return
    }
    console.log('lock-screen')
    if (Vue.prototype.$q.sessionStorage.getItem('locking') === '0') {
      let path = app.router.history.current.path
      if (path === '/locking') {
        path = '/'
      }
      Vue.prototype.$q.sessionStorage.set('last_page_path', path) // 本地存储锁屏之前打开的页面以便解锁后打开
      console.log(
        app.router.history.current.path,
        Vue.prototype.$q.sessionStorage.getItem('last_page_path')
      )
      Vue.prototype.$q.sessionStorage.set('locking', '1')
    }
    console.log(app.router)
    app.router.replace(
      {
        path: '/locking' // 解锁之后跳转到锁屏之前的页面
      },
      () => {}
    )
  })
}
