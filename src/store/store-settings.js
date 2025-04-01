import Vue from 'vue'
import { i18n } from '../boot/i18n'
import Quasar, { Platform } from 'quasar'

import config from '../config'
const console = config.console
import ipc from '../communction'
import storage from './storage'
import moment from 'moment'
import BackService from '../../lib/back-service'
const backService = new BackService()

const state = {
  userSettings: {
    lang: { value: 'zh', label: '中文' },
    locktime: 2 * 60 * 1000, // 精确到毫秒, 缺省两分钟
    resizeImage: true,
    autoLaunch: true,
    biometricAuth: false,
    wordsConfirmed: false,
    pushToken: '', // FCM Token，使用Firebase Messaging
    frontPage: '/' // 密码管理页面 "/"，或者笔记， "/notes"
  },
  systemSettings: {
    feePerKb: 250,
    chargeServices: {
      alipay: {
        desktop: false,
        mobile: true
      },
      wechatpay: {
        desktop: false,
        mobile: true
      },
      svcafe: {
        desktop: true,
        mobile: true
      },
      buybsv: {
        desktop: true,
        mobile: true
      },
      dotwallet: {
        desktop: true,
        mobile: true
      },
      moneybutton: {
        desktop: true,
        mobile: false
      },
      wallet: {
        desktop: true,
        mobile: true
      }
    },
    bsvServices: {
      metasv: {
        desktop: true,
        mobile: true
      },
      electrum: {
        desktop: true,
        mobile: true
      }
    }
  }
}

const mutations = {
  setLocktime ( state, minute ) {
    // 从分钟转化为毫秒
    Vue.set(state.userSettings, 'locktime', minute * 60 * 1000)
  },
  setLang ( state, lang ) {
    if (lang.value === 'zh') {
      moment.locale('zh-CN')
    } else {
      moment.locale(lang.value)
    }
    Vue.set(state.userSettings, 'lang', lang)
  },
  setPushToken ( state, tokenValue ) {
    Vue.set(state.userSettings, 'pushToken', tokenValue)
  },
  setFrontPage ( state, path ) {
    Vue.set(state.userSettings, 'frontPage', path)
  },
  setWordsConfirmed ( state, wordsConfirmed ) {
    Vue.set(state.userSettings, 'wordsConfirmed', wordsConfirmed)
  },
  setResizeImage ( state, enabled ) {
    Vue.set(state.userSettings, 'resizeImage', enabled)
  },
  setAutoLaunch ( state, enabled ) {
    Vue.set(state.userSettings, 'autoLaunch', enabled)
  },
  setBiometricAuth ( state, enabled ) {
    Vue.set(state.userSettings, 'biometricAuth', enabled)
  },
  removeSettings ( state, settings ) {
    state.userSettings = {
      lang: { value: 'zh', label: '中文' },
      locktime: 2 * 60 * 1000, // 精确到毫秒, 缺省两分钟
      resizeImage: true,
      autoLaunch: true,
      biometricAuth: false,
      wordsConfirmed: false,
      pushToken: '',
      frontPage: '/'
    }
    state.systemSettings = {
      feePerKb: 500,
      chargeServices: {
        alipay: {
          desktop: false,
          mobile: true
        },
        wechatpay: {
          desktop: false,
          mobile: true
        },
        svcafe: {
          desktop: true,
          mobile: true
        },
        dotwallet: {
          desktop: true,
          mobile: true
        },
        moneybutton: {
          desktop: true,
          mobile: false
        },
        wallet: {
          desktop: true,
          mobile: true
        }
      },
      bsvServices: {
        metasv: {
          desktop: true,
          mobile: true
        },
        electrum: {
          desktop: true,
          mobile: true
        }
      }
    }
  },
  setSettings ( state, settings ) {
    state = Object.assign(state, settings)
  },
  setUserSettings ( state, userSettings ) {
    state.userSettings = Object.assign(state.userSettings, userSettings)
  },
  setSystemSettings ( state, systemSettings ) {
    state.systemSettings = Object.assign(state.systemSettings, systemSettings)
  }
}

const actions = {
  setLocktime ( { commit, dispatch }, minute ) {
    commit( 'setLocktime', minute )
    dispatch( 'saveSettings' )
  },
  setResizeImage ( { commit, dispatch }, val ) {
    commit( 'setResizeImage', val )
    dispatch( 'saveSettings' )
  },
  setBiometricAuth ( { commit, dispatch }, val ) {
    commit( 'setBiometricAuth', val )
    dispatch( 'saveSettings' )
  },
  setAutoLaunch ( { commit, dispatch }, val ) {
    commit( 'setAutoLaunch', val )
    dispatch( 'saveSettings' )
    ipc.send( 'autoLaunch', val )
  },
  setLang ( { commit, dispatch }, lang ) {
    i18n.locale = lang.value
    commit( 'setLang', lang )
    dispatch( 'saveSettings' )
    // 通知后台
    ipc.send( 'language', lang.value )
  },
  setPushToken ( { commit, dispatch }, val ) {
    commit( 'setPushToken', val )
    dispatch( 'saveSettings' )
  },
  setFrontPage ( { commit, dispatch }, val ) {
    commit( 'setFrontPage', val )
    dispatch( 'saveSettings' )
  },
  setWordsConfirmed ( { commit, dispatch }, val ) {
    commit( 'setWordsConfirmed', val )
    dispatch( 'saveSettings' )
  },
  svSystemSettings ( { commit, dispatch, state }, settings ) {
    commit( 'setSystemSettings', settings )
    dispatch( 'saveSettings' )
    // 收到服务器通知后，发送PushToken给服务器，用于今后接受系统通知
    if (state.userSettings.pushToken) {
      try {
      // 发送给服务器
        const xpubkey = state.systemSettings.xpubkey
        const pushToken = state.userSettings.pushToken
        const platform = Platform.is
        const version = require('../../package.json').version
        const lang = state.userSettings.lang
        backService.pushToken(xpubkey, pushToken, platform, version, lang)
      } catch (e) {
        // 服务器异常
        console.error(e)
      }
    }
  },
  async removeSettings ( { commit, state } ) {
    commit( 'removeSettings' )
    await storage.set( 'settings', {} )
  },
  async saveSettings ( { state } ) {
    await storage.set( 'settings', state )
  },
  async getSettings ( { dispatch, commit, state } ) {
    const settings = await storage.getItem( 'settings' )
    console.log(settings)
    if ( settings && settings.userSettings) {
      if (undefined === settings.userSettings.resizeImage) {
        // 对于已经安装的app，需要初始化resize属性
        settings.userSettings.resizeImage = true
      }
      if (undefined === settings.userSettings.autoLaunch) {
        // 对于已经安装的app，需要初始化autoLaunch属性
        settings.userSettings.autoLaunch = true
      }
      commit( 'setSettings', settings)
      // 通知后台
      i18n.locale = settings.userSettings.lang.value
      commit( 'setLang', settings.userSettings.lang)
      ipc.send( 'language', settings.userSettings.lang.value )
    } else {
      const lang = Quasar.lang.getLocale().substring(0, 2)
      moment.locale(lang)
      for (const item of config.langOptions) {
        if (item.value === lang) {
          i18n.locale = item.value
          dispatch( 'setLang', item )
          return
        }
      }
    }
  }
}

const getters = {
  locktimeByMinutes (state, getter) {
    // 把毫秒时间转化为分钟
    return state.userSettings.locktime / 60 / 1000
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
