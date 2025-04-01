import config from '../config'
import axios from 'axios'
import queryString from 'query-string'
import EventEmitter from 'eventemitter3'
import EventSource from 'eventsource'

const console = config.console

const API_ROOT = 'https://urchain.com/v0'

/**
 * Urchain API Wrapper
 */
export class Urchain extends EventEmitter {
  constructor (
    opts = {}
  ) {
    super()
    this._timeout = opts.timeout || 30000
    this._init()
  }

  _init () {
    // enhance the original axios adapter with throttle and cache enhancer
    const headers = {
      'Cache-Control': 'no-cache'
    }

    this._httpClient = axios.create({
      baseURL: `${API_ROOT}`,
      timeout: this._timeout,
      headers
    })

    return this
  }

  _parseResponse (response) {
    if (response.data.success) {
      return response.data.result
    } else {
      // 没成功则返回错误
      throw new Error(response.data.error)
    }
  }

  _parseError (error) {
    if (error.response) {
      // server return error
      console.debug(error.response.data)
      console.debug(error.response.status)
      console.debug(error.response.headers)
      throw new Error(error.response.data)
    } else if (error.request) {
      console.debug(error.message)
      throw new Error(error.message)
    } else {
      // console.debug('Error', error);
      throw error
    }
  }

  get (command, params) {
    // Create query with given parameters, if applicable
    params = params || {}

    const options = {
      params
    }

    return this._httpClient.get(command, options).then(this._parseResponse).catch(this._parseError)
  }

  post (command, data) {
    const options = {
      headers: {
        'Content-Type': 'application/json'
      }
    }

    return this._httpClient
      .post(command, data, options)
      .then(this._parseResponse)
      .catch(this._parseError)
  }

  /**
   * Get raw transaction data
   *
   * @param {string} hash The hash/txId of the transaction
   */
  getRawTxData (txId) {
    return this.get(`${API_ROOT}/tx/${txId}`)
  }

  /**
   * Get address history
   * This endpoint retrieves confirmed and unconfirmed address transactions.
   * https://urchain.com/#/address/address
   * @param {string} address
   */
  address (address) {
    const url = `${API_ROOT}/address/${address}`
    return this.get(url)
  }

  /**
   * Get address mempool
   * This endpoint retrieves unconfirmed address transactions.
   * https://urchain.com/#/address/address
   * @param {string} address
   */
  mempool (address) {
    const url = `${API_ROOT}/mempool/${address}`
    return this.get(url)
  }

  /**
   * Get protocol history
   * This endpoint retrieves confirmed and unconfirmed address transactions.
   * https://urchain.com/#/protocol/protocol_name
   * @param {string} address
   */
  protocol (name) {
    const url = `${API_ROOT}/protocol/${name}`
    return this.get(url)
  }

  // 订阅地址
  subscribeAddresses (addressList) {
    const addressQueryStr = queryString.stringify({ address: addressList }, { arrayFormat: 'bracket' })
    const url = `${API_ROOT}/stream?${addressQueryStr}`
    const es = new EventSource(url)
    es.onmessage = (message) => {
      const tx = JSON.parse(message.data)
      // 记录最后一次的更新时间
      // TODO:避免服务器端重启后，丢失订阅的交易，应该在重连后发送时间戳
      this._latestTime = tx.time ? tx.time : this._latestTime
      this.emit('tx-data', tx)
    }
    es.addEventListener('open', (event) => {
      console.log('open', event)
    })

    es.addEventListener('close', (event) => {
      console.log('close', event)
    })

    es.addEventListener('error', (event) => {
      console.log(event)
      // if (event.readyState === EventSource.CLOSED) {
      //   console.log('Event was closed');
      // }
    })
    this._es = es
  }

  // 删除订阅
  unsubscribeAddresses () {
    if (this._es) {
      this._es.close()
      this._es = undefined
    }
  }
}
