/**
 * OTP二维码扫描结果处理
 * ref: https://github.com/google/google-authenticator/wiki/Key-Uri-Format
 */
// https://stackoverflow.com/questions/53600848/how-to-check-if-a-string-is-base32-encoded-in-javascript
import _ from 'lodash'
import { parse } from 'uri-js'
import qs from 'qs'
// import config from '../config'
// const console = config.console

function isRfc4648 (str) {
  // A-Z and 2-7 repeated, with optional `=` at the end
  // Crockford's Base32, A-Z0-9
  const rfc4648_regex = /^[A-Za-z0-9\+-_\/]+=*$/

  return str.length % 2 === 0 && rfc4648_regex.test(str)
}

class KeyURI {
  constructor (uri) {
    try {
      this._parse = parse(uri)
      const parts = this._parse.path.split(/\/|\:|%3A/)
      if (parts[1]) {
        this._labelPrefix = decodeURIComponent(parts[1]).trim()
      }
      if (parts[2]) {
        this._accountName = decodeURIComponent(parts[2]).trim()
      }
      this._qs = qs.parse(this._parse.query)
      const secret = this._param('secret')
      if (secret && isRfc4648(secret)) {
        this._secret = secret
      } else {
        // 不是base32, 抛出异常
        throw new Error('No Secret')
      }
    } catch (e) {
      // 无法创造parse，检查uri是否为base32编码的字符串
      const secret = uri.replace(/\s/g, '')
      if (isRfc4648(secret)) {
        this._secret = secret
      } else {
        // 不是base32, 抛出异常
        throw e
      }
    }
  }

  _param (name) {
    if (this._parse && this._qs) {
      const result = this._qs[name]
      if (result) {
        return result
      }
    }
    return undefined
  }

  // 获取密钥
  get secret () {
    return this._secret
  }

  get type () {
    if (this._parse) {
      return this._parse.host
    }
  }

  get labelPrefix () {
    if (this._labelPrefix) {
      return this._labelPrefix
    }
  }

  get accountName () {
    if (this._accountName) {
      return this._accountName
    }
  }

  get counter () {
    if (this._parse) {
      const result = this._param('counter')
      if (result) {
        return parseInt(result )
      }
    }
  }

  get period () {
    if (this._parse) {
      const result = this._param('period')
      if (result) {
        return parseInt(result )
      }
    }
  }

  get digits () {
    if (this._parse) {
      const result = this._param('digits')
      if (result) {
        return parseInt(result )
      }
    }
  }

  get algorithm () {
    if (this._parse) {
      const result = this._param('algorithm')
      if (result) {
        return result.toLowerCase()
      }
    }
  }

  get issuer () {
    if (this._parse) {
      return this._param('issuer')
    }
  }

  // 全部用于OTP初始化的参数
  get options () {
    const result = _.omitBy({
      type: this.type,
      labelPrefix: this.labelPrefix,
      label: this.labelPrefix,
      accountName: this.accountName,
      counter: this.counter,
      step: this.period, // 在otplib内部使用step的名字
      period: this.period,
      digits: this.digits,
      algorithm: this.algorithm,
      issuer: this.issuer,
      secret: this.secret
    }, (value) => {
      // 过滤掉所有无值的field
      return _.isUndefined(value)
    })
    return result
  }
}

export {
  KeyURI,
  isRfc4648
}
