import _ from 'lodash'
import config from '../config'
const console = config.console
import EventEmitter from 'eventemitter3'
import EventSource from 'eventsource'

import axios from 'axios'

import { address2HashBase64 } from './address'

const BITSOCKET_URL = 'https://txo.bitsocket.network'
const BITBUS_URL = 'https://txo.bitbus.network'

// https://token.planaria.network/
const TOKEN = 'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiIxS1lLSjlhRE56aHNzaFFCNWJLeEJickdTM29RTlRWS1NZIiwiaXNzdWVyIjoiZ2VuZXJpYy1iaXRhdXRoIn0.SDF5SGRFQlZRNnFmYjdmVjNITHV6WE96d25mc2hCbWg4dzRkckp1VlVsVTFJUzhSRjR5L092b2NZS09SUmV2Z2oxKy9SNkp1NGxPQTZ2NmROMEZtUW53PQ'

class Planaria extends EventEmitter {
  // 初始化服务器池
  // constructor () {
  //   // 支持事件触发
  //   super()
  // }

  /**
    * 获取地址列表中的P2PKH交易hash
    * @param {*} addressList Array 地址数组，字符串
    * @param {*} beginFromBlock 查询的最小区块，缺省是创世区块
    * @param {*} limit //限定输出的数量
    */
  async fetchTransactions (addressList, beginFromBlock = 620539, limit = null) {
    // 只支持主网
    const hashB64List = _.map(addressList, (addressString) => address2HashBase64(addressString, 'livenet'))

    // https://bitquery.planaria.network/#/?id=bitquery
    // 针对P2PKH类型的脚本 OP_DUP OP_HASH160 fe686b9b2ab589a3cb3368d02211ca1a9b88aa42 OP_EQUALVERIFY OP_CHECKSIG
    // 检索地址的hash，将地址转换为公钥hash，然后使用base64编码
    // 'out.b2'，表示输出里第二项的base64编码在后面数组中有的话
    // 'blk.i'表示区块高度应该大于的数值。在本地检索有缓存时，可以查询超过区块范围的交易
    const queryBitbus = {
      q: {
        find: { 'out.b2': { $in: hashB64List }, 'blk.i': { $gt: beginFromBlock } },
        sort: { 'blk.i': 1 },
        project: { tx: 1, blk: 1, i: 1 }
      }
    }

    // 如需要限定返回数量，设置limit参数
    if (limit) {
      queryBitbus.q.limit = limit
    }

    // 查询BitBus
    const fetchBitbus = axios({
      url: `${BITBUS_URL}/block`,
      method: 'post',
      headers: {
        'Content-type': 'application/json; charset=utf-8',
        token: TOKEN,
        format: 'json' // 使用JSON而不是NJSON返回数据
      },
      data: JSON.stringify(queryBitbus)
    })
      .then((res) => {
        const result = _.map(res.data, (o) => {
          return {
            txId: o.tx.h, // 交易Hash
            height: o.blk.i, // 区块高度
            time: o.blk.t, // 区块时间戳
            indexInBlock: o.i, // 交易在区块中的索引号（不包括coinbase）
            blockHash: o.blk.h // 区块的hash(区块可能分叉，重组，因此高度一样，但是block hash会不一样)
          }
        })
        return result
        // 每条数据的tx.h是交易hash
        // {
        //   _id: '5ee36870cbdf9832923ec97f',
        //   tx: {
        //     h: '4e2dddea6c13a088ad2a517d9626280cb64cd2ea44ae87c03978fc67683e29e0' //交易hash
        //   },
        //   i: 345, //交易在区块中的拓扑索引号
        //   blk: {
        //     i: 624746, //区块高度
        //     h: '000000000000000000aae1a49b7f5f4e96f2dca9a08c137defa49247574fb7f2', //区块hash值
        //     t: 1583314898 //区块时间
        //   }
        // }
      })

    return Promise.all([
      fetchBitbus,
      this.fetchMempoolTransactions(addressList)
    ]).then(([result0, result1]) => {
      return _.unionWith(result0, result1, (a, b) => { return a.txId === b.txId })
        .sort((a, b) => {
          if (a.height > b.height) return 1
          else return -1
        })
    })
  }

  /**
   * 获取24小时内的内存交易记录
   * @param {*} addressList
   */
  async fetchMempoolTransactions (addressList) {
    // 只支持主网
    const hashB64List = _.map(addressList, (addressString) => address2HashBase64(addressString, 'livenet'))

    // https://bitquery.planaria.network/#/?id=bitquery
    // 针对P2PKH类型的脚本 OP_DUP OP_HASH160 fe686b9b2ab589a3cb3368d02211ca1a9b88aa42 OP_EQUALVERIFY OP_CHECKSIG
    // 检索地址的hash，将地址转换为公钥hash，然后使用base64编码
    // 'out.b2'，表示输出里第二项的base64编码在后面数组中有的话
    const queryBitsocket = {
      q: {
        find: { 'out.b2': { $in: hashB64List } },
        project: { tx: 1, blk: 1, i: 1 }
      }
    }

    // 查询内存池中的交易
    return axios({
      url: `${BITSOCKET_URL}/crawl`,
      method: 'post',
      headers: {
        'Content-type': 'application/json; charset=utf-8',
        token: TOKEN,
        format: 'json' // 使用JSON而不是NJSON返回数据
      },
      data: JSON.stringify(queryBitsocket)
    })
      .then((res) => {
        const result = _.map(res.data, (o) => {
          const tx = {
            txId: o.tx.h, // 交易Hash
            height: 0, // 区块高度
            time: Date.now() / 1000 // 区块时间戳
          }
          // Bitsocket中不包含blk和i数据
          // if (o.blk) {
          //   if (o.blk.i) {
          //     tx.height = o.blk.i
          //   }
          //   if (o.blk.t) {
          //     tx.time = o.blk.t
          //   }
          //   if (o.blk.h) {
          //     tx.blockHash = o.blk.h
          //   }
          // }
          // if (o.i) {
          //   tx.indexInBlock = o.i
          // }
          return tx
        })
        return result
      })
  }

  /**
   * 订阅P2PKH地址数据
   * @param {*} addressString
   */
  subscribeAddresses (addressList) {
    const p2pkhAddressMap = new Map()

    // 观察每个地址
    for (const addressString of addressList ) {
      p2pkhAddressMap.set(address2HashBase64(addressString, 'livenet'), addressString)
    }

    // 针对P2PKH类型的脚本 OP_DUP OP_HASH160 fe686b9b2ab589a3cb3368d02211ca1a9b88aa42 OP_EQUALVERIFY OP_CHECKSIG, 检索地址
    const query = {
      v: 3,
      q: {
        find: { 'out.b2': { $in: Array.from(p2pkhAddressMap.keys()) } },
        project: { tx: 1, blk: 1 },
        timestamp: {
          $gt: Date.now() - 10000
        }
      }
    }

    // Base64 encode bitquery
    const b64 = Buffer.from(JSON.stringify(query)).toString('base64')
    if (this.es) {
      this.closeES()
    }

    const that = this
    this.es = new EventSource(`${BITSOCKET_URL}/s/${b64}` )
    this.es.onmessage = function (message) {
      // {"query":{"v":3,"q":{"find":{"out.b2":{"$in":["+656Pa4pGD4fN7vUjf9otMVkdqc="]}},"sort":{"blk.i":1},"project":{"tx":1,"blk.i":1,"blk.t":1},"timestamp":{"$gt":1607070533197}}},"data":[{"_id":"5fc9f4278360960a8cdd2457","tx":{"h":"34a9e705f1cf127287024c86e0d2eb38bc0d693c89871834305ee08e0b6e73fc"}}],"checkpoint":"5fc9f4278360960a8cdd2457","type":"push"}
      // 监听到的数据类似，其中data是数组，每条的 item.tx.h 是交易hash
      console.debug(message)
      try {
        const object = JSON.parse(message.data)
        if (object.type !== 'push') return
        const transactions = _.map(object.data, (o) => {
          console.log(o)
          const tx = {
            txId: o.tx.h, // 交易Hash
            height: 0, // 高度为0，在内存池中
            time: parseInt(Date.now() / 1000) // 接收到交易的时间戳
          }
          return tx
        })

        that.emit('transactions', transactions)
      } catch (e) {
        console.warn(e)
      }
    }
    this.es.addEventListener('open', event => {
      console.log('open', event)
    }, false)

    this.es.addEventListener('close', event => {
      console.log('close', event)
    }, false)

    this.es.addEventListener('error', event => {
      console.log(event)
      if (event.readyState === EventSource.CLOSED) {
        console.log('Event was closed')
      }
    }, false)

    return this.es
  }

  /**
   * 关闭服务器流通知
   * @param {*} es
   */
  closeES () {
    if (this.es) {
      try {
        this.es.close()
      } catch (e) {
        console.log(e)
      } finally {
        this.es = null
      }
    }
  }
}

export default Planaria
