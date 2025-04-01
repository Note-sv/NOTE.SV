import * as axios from 'axios'
import config from '../config'
const console = config.console
import EventEmitter from 'eventemitter3'
import { mapAddressToScriptHash } from './address'
import bsv from 'bsv'

const API_ROOT = 'https://apiv2.metasv.com'

/**
 * MetaSV API Wrapper
 */
export class MetaSV extends EventEmitter {
  constructor (opts = {}) {
    super()
    this._timeout = opts.timeout || 30000
    this._apiKey = opts.apiKey
    this._init()
  }

  _init () {
    // enhance the original axios adapter with throttle and cache enhancer
    const headers = {
      'Cache-Control': 'no-cache'
    }
    if (this._apiKey) {
      headers.Authorization = `Bearer ${this._apiKey}`
    }
    this._httpClient = axios.default.create({
      baseURL: `${API_ROOT}`,
      timeout: 30000,
      headers
    })
    this._mapAddress2Event = new Map()

    return this
  }

  _parseResponse (response) {
    return response.data
  }

  _parseError (error) {
    if (error.response) {
      // server return error
      console.warn(error.response.data)
      console.warn(error.response.status)
      console.warn(error.response.headers)
      throw new Error(error.response.data)
    } else if (error.request) {
      console.warn(error.message)
      throw new Error(error.message)
    } else {
      console.warn('Error', error)
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

    return this._httpClient.post(command, data, options).then(this._parseResponse)
  }

  /**
   * 获取当前地址的余额
   * @param {*} addressStr
   * @returns
   */
  getBalance (addressStr) {
    return this.get(`/address/${addressStr}/balance`)
  }

  /**
   * 获取当前地址的UTXO一览
   * @param {*} addressStr
   * @returns
   */
  fetchUtxos (addressStr) {
    return this.get(`/address/${addressStr}/utxo`)
  }

  /**
   * 当前最新区块的信息
   * https://metasv.com/#/block/get_block_info
   */
  blockInfo () {
    return this.get('/block/info')
  }

  /**
   * Broadcast transaction
   * https://metasv.com/#/tx/post_tx_broadcast
   * @param {string} txhex Raw transaction data in hex
   */
  broadcast (hex) {
    return this.post('tx/broadcast', {
      hex
    }).catch((error) => {
      if (error.response) {
        // server return error
        // console.warn(error.response.data);
        // console.warn(error.response.status);
        // console.warn(error.response.headers);
        if (error.response.status === 403) {
          const message = JSON.parse(error.response.data.message)
          throw message
        }
        throw new Error(error.response.data)
      } else if (error.request) {
        console.warn(error.message)
        throw error
      } else {
        console.warn('Error', error)
        throw error
      }
    })
  }

  /**
   * Get raw transaction data
   * Get raw transaction data in hex
   * https://metasv.com/#/tx/get_tx__txid__raw
   * @param {string} hash The hash/txId of the transaction
   */
  getRawTxData (hash) {
    return this.get(`tx/${hash}/raw`).then((tx) => tx.hex)
  }

  /**
   * Get history
   * This endpoint retrieves confirmed and unconfirmed address transactions.
   * https://metasv.com/#/address/get_address__address__tx
   * @param {string} address
   */
  history (address) {
    return this.get(`/address/${address}/tx`)
  }

  // 订阅地址
  subscribeAddresses (addressList) {
    const that = this
    const filterList = []
    for (const address of addressList) {
      const { scriptHex } = mapAddressToScriptHash(address, 'livenet')
      filterList.push(scriptHex)
    }

    const filter = filterList.join(',')
    const url = `https://stream.metasv.com/tx?filter=${filter}`
    const es = new EventSource(url, { headers: { Authorization: `Bearer ${this._apiKey}` } })
    es.onmessage = (message) => {
      try {
        if (message.data !== 'HEARTBEAT') {
          const txId = bsv.crypto.Hash.sha256sha256(Buffer.from(message.data, 'hex')).reverse().toString('hex')
          const result = {
            txId,
            hex: message.data,
            height: 0,
            time: Date.now()
          }

          that.emit('tx-data', result)
        }
      } catch (e) {
        console.log(e)
      }
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
    this._mapAddress2Event.set(filter, es)
    return filter
  }

  // 删除订阅
  unsubscribeAddresses (filter) {
    this._mapAddress2Event.delete(filter)
  }
}
