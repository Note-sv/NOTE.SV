// import { LocalStorage } from 'quasar'
// import { showErrorMessage } from 'src/functions/function-show-error-message'
import config from '../config'
const console = config.console

import ipc from '../communction'

const state = {
  password: '',
  seedString: '',
  walletPath: "m/44'/236'/0'",
  lang: 'ENGLISH',
  hasAccount: false,
  locked: true,
  walletBalance: 0,
  walletConfirmedBalance: 0,
  walletUnconfirmedBalance: 0,
  walletAddress: ''

}

const mutations = {
  setHasAccount ( state, value ) {
    state.hasAccount = value
  },

  setAccount ( state, value ) {
    state.seedString = value.seedString
    state.walletPath = value.walletPath
    state.password = value.password
    state.lang = value.lang
  },

  setBalance ( state, value ) {
    state.walletBalance = value.balance
    state.walletConfirmedBalance = value.confirmed
    state.walletUnconfirmedBalance = value.unconfirmed
  },

  setLocked ( state, value ) {
    state.locked = value
  },

  setWalletAddress ( state, value ) {
    state.walletAddress = value
  }
}
// 时间锁
let lockTimer
const actions = {
  async saveAccount ( { dispatch, commit }, args ) {
    const { seedString, password, walletPath, lang } = args
    console.log( seedString, password, walletPath, lang )
    // 使用一个对象传递参数，避免种子字符串被错误传递
    const result = await ipc.sendSync( 'save-seed-string', args )
    console.log( result )
    commit( 'setAccount', args )
    commit( 'setHasAccount', args !== null )
  },

  unlockAccount ( { commit } ) {
    // 设置锁定账号状态， 画面全体进入代解锁状态
    commit( 'setLocked', false )
  },
  lockAccount ( { commit } ) {
    commit( 'setLocked', true )
    // 设置锁定账号状态， 画面全体进入代解锁状态
  },
  async removeAccount ( { dispatch, commit } ) {
    commit( 'setAccount', { mnemonic: '', walletPath: '' } )
    const result = await ipc.sendSync( 'remove-account' )
    console.log( result )
    if ( result ) {
      // 删除所有的数据
      dispatch('notes/removeAll', {}, { root: true })
      dispatch('settings/removeSettings', {}, { root: true })
      dispatch('records/removeAll', {}, { root: true })

      commit( 'setBalance', { balance: 0, confirmed: 0, unconfirmed: 0 } )
      commit( 'setAccount', { seedString: '', walletPath: '', lang: 'ENGLISH' } )
      commit( 'setHasAccount', false )
      this.$router.replace( '/' ).catch( e => { } )
    } else {
      // error
      console.log( 'error', result )
    }
  },
  async checkAccount ( { commit } ) {
    const result = await ipc.sendSync( 'check-account' )
    console.log( result )
    commit( 'setHasAccount', result )
    // 设置一个定时器， 如果1分钟没有调用检查账号，则删除密码，会导致屏幕锁上
    if ( state.password === '' ) {
      return
    }
    // 清除时间锁， 重新加一个
    clearTimeout( lockTimer )
    lockTimer = setTimeout( () => {
      // 一分钟后， 清除内存中的种子和密码
      commit( 'setAccount', { seedString: '', walletPath: '', password: '', lang: 'ENGLISH' } )
    }, 60 * 1000 )
  },
  async loginWithPassword ( { commit }, password ) {
    const result = await ipc.sendSync( 'login-with-password', password )
    // console.log( result )
    if ( result ) {
      const { seedString, walletPath, lang } = result
      commit( 'setAccount', { seedString, walletPath, password, lang } )
      return true
    } else {
      commit( 'setAccount', { seedString: '', walletPath: '', password: '', lang: 'ENGLISH' } )
      return false
    }
  },
  async getWalletAddress ( { commit } ) {
    const result = await ipc.sendSync( 'wallet-address' )
    console.log( result )
    if ( result ) {
      commit( 'setWalletAddress', result )
    } else {
      commit( 'setWalletAddress', '' )
    }
    return result
  },
  async withdrawAllTo ( { commit }, address ) {
    const result = await ipc.sendSync( 'withdraw-all', address )
    return result
  }
}

const getters = {

}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
