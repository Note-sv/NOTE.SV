import config from '../src/config'
const console = config.console

import { PaymailClient } from 'paymail-client'

// import bsv from 'bsv'
import axios from 'axios'

import { ApiError } from './error'

class BackService {
  constructor () {
    this.client = new PaymailClient()

    this.init()
  }

  init () {
    this.httpClient = axios.create({
      // 60 sec timeout
      timeout: 60000,
      headers: {
        // FIXME:在桌面端修改UserAgent可能会导致一个错误 Refused to set unsafe header "User-Agent"
        // 'User-Agent': this.userAgent
      }
    })
    return this
  }

  /**
   * 通过本地根公钥获取账号信息，包括设置信息
   * @param {*} pubkey 根HD公钥
   */
  async checkAccount (xpubkey) {
    return this.httpClient.get(config.backServer + 'v1/account', {
      params: {
        xpubkey
      }
    }).then(res => {
      console.log(res.data)
      if (res.data.success) {
        return res.data.result
      }

      return Promise.reject( new ApiError(res.data.error) )
    })
  }

  // 检查是否存在指定的alias
  async checkAlias (alias) {
    return this.httpClient.get(config.backServer + 'v1/alias', {
      params: {
        alias
      }
    }).then(res => {
      console.log(res.data)
      if (res.data.success) {
        // 存在这个alias
        return true
      } else if (res.data.error.status === 404) {
        // 不存在这个alias
        return false
      }
      return Promise.reject( new ApiError(res.data.error) )
    })
  }

  // 为指定账号创建一个alias
  async createAccount (xpubkey, alias, name = '', email = '', photo = null) {
    return this.httpClient.post(config.backServer + 'v1/account', {
      xpubkey, alias, email, name, photo
    } ).then(res => {
      console.log(res.data)
      if (res.data.success) {
        return res.data.result
      }
      return Promise.reject( new ApiError(res.data.error) )
    })
  }

  // 为指定账号设置推送token, 包括当前的平台和版本
  async pushToken (xpubkey, token, platform, version, lang) {
    return this.httpClient.post(config.backServer + 'v1/notification', {
      xpubkey, token, platform, version, lang
    } ).then(res => {
      console.log(res.data)
      if (res.data.success) {
        return res.data.result
      }
      return Promise.reject( new ApiError(res.data.error) )
    })
  }

  getRootPublicKey (paymailAddress) {
    return this.client.getPublicKey(paymailAddress)
    // .then(pubkey => {
    //   // console.log(`Current public key for ${paymailAddress} is ${pubkey}`)
    //   // const publicKey = new bsv.PublicKey(pubkey)
    //   // console.log(publicKey.toAddress().toString())
    //   return pubkey
    // })
  }

  // 获取指定地址的profile
  getPublicProfile (paymailAddress) {
    return this.client.getPublicProfile(paymailAddress)
    // .then(profile => {
    //   console.log(profile)
    //   return profile
    // })
  }
}

export default BackService
