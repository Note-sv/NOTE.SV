/**
 * 访问比特币网络，同时支持多个provider，包括electrum和woc
 */
import _ from 'lodash'
import config from '../config'
const console = config.console
import EventEmitter from 'eventemitter3'
import { mapAddressToScriptHash } from './address'
import ElectrumPool from './electrum-client'
// import EventSource from 'eventsource'
import Promise from 'bluebird'
import Minercraft from 'minercraft'
import WhatsOnChain from 'whatsonchain'
import Planaria from './planaria'
import { MetaSV } from './metasv'
import { Urchain } from './urchain'

const metasvApiKey =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJpbnRlcm5hbF9tZXRhc3Zfbm90ZXN2IiwiaXNzIjoiTWV0YVNWIiwiZXhwIjoxNjQ3MzM3MTQyfQ.tb-P0IKQ24naIdO4SXBZ9SoeVUSAzxtbapCLsJNClvQ'

class Network extends EventEmitter {
  // 初始化服务器池
  constructor () {
    // 支持事件触发
    super()
    this.init()
  }

  init () {
    this.subscribedAddressMap = new Map()
    this.subscribedProtocolMap = new Map()

    this.electrum = new ElectrumPool()
    this.metasv = new MetaSV( { apiKey: metasvApiKey } )
    this.planaria = new Planaria()
    this.woc = new WhatsOnChain( 'main', { apiKey: config.systemSettings.woc } )

    // 使用urchain跟踪数据
    this.urchain = new Urchain( )
    // 收到通知，通知是单个交易记录，转换为数组进行处理
    this.urchain.on('tx-data', (tx) => this.newTx([tx]), this)

    this.taal = new Minercraft( {
      url: 'https://merchantapi.taal.com'
    } )

    // 观察连接状态
    this.electrum.on( 'connect', ecl => {
      console.debug( 'electrum.on connect' )
      ecl.subscribe.on( 'blockchain.scripthash.subscribe', this._analyseSubscribedData, this )

      // 观察服务器通知
      this._watchAddressByElectrum( ecl )
    } )
    this.electrum.on( 'error', ecl => {
      // 观察服务器通知
      this.emit( 'status-changed' )
    } )

    // 获取一个electrum实例，触发链接事件
    this.electrum.acquire().then( ecl => {
      // 观察节点
    } ).catch( e => {
      console.warn( e )
    } )

    return this
  }

  // 获取矿池的费率
  async poolFeeRate () {
    const verbose = false
    return Promise.props( {
      taal: this.taal.fee.rate( { verbose } )
    } )
  }

  /**
   * 查询指定地址的余额
   * @param {*} walletAddressStr 钱包地址字符串
   */
  async getBalance ( walletAddressStr ) {
    const { scriptHash } = mapAddressToScriptHash( walletAddressStr )
    return this.electrum.acquire()
      .then( ecl => ecl.blockchainScripthash_getBalance( scriptHash ) )
      .catch(e => {
        return this.woc.balance( walletAddressStr )
      })
      .catch( e => {
        return this.metasv.getBalance( walletAddressStr )
      } )
  }

  /**
   * 查询所有的协议数据
   * @param {*} protocolAddress
   */
  async fetchProtocolHistories ( protocolAddress ) {
    console.log( protocolAddress )
    return []
    //   return this.metaSV.fetchProtocolHistories( protocolAddress )
    //     .then( async ( data ) => {
    //       const histories = [data]

    //       // 数据超过50条需要再次读取
    //       if ( data.length === 50 ) {
    //         console.log( data.length, _.last( data ) )
    //         let pageId = _.last( data ).id
    //         // 数据超过50条需要再次读取
    //         while ( true ) {
    //           const newData = await this.metaSV.fetchProtocolHistories( protocolAddress, pageId )
    //           console.log( newData )
    //           histories.push( newData )
    //           if ( newData.length !== 50 ) {
    //             break
    //           }
    //           pageId = _.last( newData ).id
    //         }
    //       }
    //       return _.map( _.flatten( histories ), ( item ) => {
    //         return {
    //           tx_hash: item.txid,
    //           tx_height: item.height,
    //           time: item.time
    //         }
    //       } )
    //     } )
  }

  /**
   * 查询交易数据记录
   * @param {*} walletAddressStr 钱包地址
   * @param {*} rootAddressStr 根地址
   */
  async fetchHistories ( walletAddressStr ) {
    // 查询woc
    return this.woc.history( walletAddressStr )
      .then( data => {
        // 反转数组，让新的记录先解析
        // 从woc返回的数据不包含income，outcome，和time，需要调用API分析详情
        return _.map( data.reverse(), ( item ) => {
          return {
            tx_hash: item.tx_hash,
            tx_height: item.height,
            address: walletAddressStr
          }
        } )
      } )
      .catch( e => {
        console.debug( e )
        return this.metasv.history( walletAddressStr )
          .then( data => {
            return _.map( data.reverse(), ( item ) => {
              return {
                tx_hash: item.txid,
                tx_height: item.height,
                address: walletAddressStr
              }
            } )
          } )
      } )
      .catch( e => {
        console.debug( e )
        const { scriptHash } = mapAddressToScriptHash( walletAddressStr )

        return this.electrum
          .acquire()
          .then( ecl => ecl.blockchainScripthash_getHistory( scriptHash ) )
          .then( data => {
            // 反转数组，让新的记录先解析
            // 从electrum返回的数据不包含income，outcome，和time，需要调用API分析详情
            return _.map( data.reverse(), ( item ) => {
              return {
                tx_hash: item.tx_hash,
                tx_height: item.height,
                address: walletAddressStr
              }
            } )
          } )
      } )
      .catch( e => {
        // 查询planaria
        console.debug( e )
        return this.planaria.fetchTransactions( [walletAddressStr] )
          .then( data => {
          // 反转数组，让新的记录先解析
          // 从woc返回的数据不包含income，outcome，和time，需要调用API分析详情
            return _.map( data.reverse(), ( item ) => {
              return {
                tx_hash: item.txId,
                tx_height: item.height,
                address: walletAddressStr,
                time: item.time * 1000
              }
            } )
          } )
      } )
  }

  /**
   * 查询在内存池中的交易数据记录
   * @param {*} walletAddressStr 钱包地址
   * @param {*} rootAddressStr 根地址
   */
  async fetchMempool ( walletAddressStr ) {
    const { scriptHash } = mapAddressToScriptHash( walletAddressStr )
    return this.electrum.acquire()
      .then( ecl => ecl.blockchainScripthash_getMempool( scriptHash ) ).then( data => {
        // 反转数组，让新的记录先解析
        // 从electrum返回的数据不包含income，outcome，和time，需要调用API分析详情
        return _.map( data.reverse(), ( item ) => {
          return {
            tx_hash: item.tx_hash,
            tx_height: item.height,
            address: walletAddressStr
          }
        } )
      } )
  }

  /**
   * 获取交易数据
   * @param {*} txid 交易ID
   */
  async fetchRawTx ( txid ) {
    return this.woc.getRawTxData( txid )
      .catch( e => {
        return this.metasv.getRawTxData( txid )
      } )
      .catch( e => {
        return this.electrum.acquire().then( ecl => ecl.blockchainTransaction_get( txid ) )
      } )
  }

  /**
   * 挑选Utxo集
   * 给定地址集和金额，挑选大于该金额的Utxo集
   * 对于HD钱包，可以同时传入多个地址地址，给出一个待花费总金额amount，
   * 取出总额大于amount的utxo
   *
   * 注意：此接口选取出来的amount并未计算手续费，
   * 因此调用方在传入amount的时候需要多设置一些金额以保证手续费足够。
   *
   * @param {*} addresses
   * @param {*} amount
   */
  async selectUtxos ( addressList, amount ) {
    const utxoMaps = new Map()
    const MinUTXOCount = 3

    const calcUTXOs = () => {
      const resultMaps = new Map()
      let satoshiTotal = 0, count = 0

      for ( const [addressStr, upspentList] of utxoMaps ) {
        const upspent = _.flatten( upspentList ).sort( ( a, b ) => {
          return b.height - a.height
        } )
        const utxoList = []

        for ( const utxo of upspent ) {
          utxoList.push( utxo )
          resultMaps.set( addressStr, utxoList )

          satoshiTotal += utxo.satoshis
          count++
          // 如果有很多小的utxo，最少集成10个， 避免生成更多的碎片
          // TODO:需要更好的UTXO挑选算法
          if ( satoshiTotal > ( amount + ( 192 * count ) / 1000 ) && count > MinUTXOCount ) {
            return resultMaps
          }
        }
      }
      return null
    }

    try {
      // 优先使用electrumx服务器
      for ( const addressStr of addressList ) {
        const { scriptHex, scriptHash } = mapAddressToScriptHash( addressStr )
        const unspent = await this.electrum.acquire().then( ecl => ecl.blockchainScripthash_listunspent( scriptHash ) )

        console.log( unspent )

        const utxoList = _.map( unspent, ( utxo ) => {
          return {
            txId: utxo.tx_hash,
            outputIndex: utxo.tx_pos,
            address: addressStr,
            script: scriptHex,
            satoshis: utxo.value,
            height: utxo.height // 高度不是必须的，用于挑选算法
          }
        } )

        utxoMaps.set( addressStr, utxoList )
        const calcResult = calcUTXOs()
        if ( calcResult != null ) {
          return calcResult
        }
      }
      // 没有找到符合条件的utxo，全部返回
      return utxoMaps
    } catch ( e ) {
      console.warn( e.message )
      for ( const addressStr of addressList ) {
        const { scriptHex } = mapAddressToScriptHash( addressStr )

        console.log( addressStr )
        const unspent = await this.woc.utxos( addressStr )

        const utxoList = _.map( unspent, ( utxo ) => {
          return {
            txId: utxo.tx_hash,
            outputIndex: utxo.tx_pos,
            address: addressStr,
            script: scriptHex,
            satoshis: utxo.value,
            height: utxo.height // 高度不是必须的，用于挑选算法
          }
        } )

        utxoMaps.set( addressStr, utxoList )
        const calcResult = calcUTXOs()
        if ( calcResult != null ) {
          return calcResult
        }
      }
      console.log( utxoMaps )
      // 没有找到符合条件的utxo，全部返回
      return utxoMaps
    }
  }

  /**
   * 广播交易
   * @param {*} rawHex
   */
  async broadcast ( rawHex ) {
    // 通过MAPI广播
    const broadcastMAPI = async ( txHash ) => {
      let status, taalResult

      // 推送到TAAL矿池
      if ( txHash ) {
        // 查询是否已经在矿池
        status = await this.taal.tx.status( txHash ).then( result => {
          return result.returnResult === 'success'
        } ).catch( e => {
          console.log( e.message )
        } )
        console.log( status )
      }
      if ( !status ) {
        taalResult = await this.taal.tx.push( rawHex ).then( res => {
          console.log( 'TAAL', res )
          if ( res.returnResult === 'failure' ) {
            // 广播失败，忽略异常
            // 这种错误是被比特币节点拒绝了
            // returnResult: 'failure',
            // resultDescription: 'ERROR: 257: txn-already-known',
            // 这种错误是被矿池直接拒绝了
            // returnResult: 'failure',
            // resultDescription: 'Not enough fees',
            return
          }
          // 广播正常，获取交易id
          return res.txid
        } ).catch( e => {
          console.log( e.message )
        } )
      }
      status = null
      return taalResult || txHash
    }

    // 通过electrum发送。 因为electrum不具有挖矿能力，即使广播给它，可能只保存在内存池而无法成功
    return this.woc.broadcast( rawHex )
      .catch( e => {
        return this.metasv.broadcast( rawHex )
      } )
      .catch( e => {
        return this.electrum
          .acquire()
          .then( ecl => {
            return ecl.blockchainTransaction_broadcast( rawHex )
          } )
          .catch( e => {
            // the transaction was rejected by network rules. 66: insufficient priority
            // 从electrum返回的出错信息类似 Transaction already in the mempool [0100000001f0942f0c1ef4b28a344bd6d...]
            // 一个出错信息以及后面很长的交易记录，应该删除后面的部分
            // console.warn( e )
            // const message = e.message
            // if ( _.isString( message ) ) {
            //   throw new Error( message.replace( /\[\S*\]/, '' ).replace( 'the transaction was rejected by network rules.', '' ).trim() )
            // }
            return this.woc.broadcast( rawHex )
          } )
      } )
      .then( txHash => {
        console.debug( txHash )
        // 广播成功, 尝试直接通过MAPI广播一次, 忽略广播结果
        broadcastMAPI( txHash )
        return txHash
      } )
      .catch( async ( e ) => {
        console.debug( e )
        const txHash = await broadcastMAPI()
        if ( txHash ) {
          return txHash
        }
        return Promise.reject( e.message )
      } )
  }

  /**
   * 订阅地址
   * @param {*} addressString
   */
  subscribeAddress ( addressString ) {
    const es = this.planaria.subscribeAddresses( [addressString] )
    this.planaria.on( 'transactions', this.newTx, this )

    this.es = es

    this.electrum.acquire().then( ecl => {
      console.log( ecl.host, ecl.port, ecl.protocol, ecl.status )
      this._watchAddressByElectrum( ecl )
    } )

    this.urchain.subscribeAddresses([addressString])
  }

  newTx ( transactions ) {
    console.debug( 'new transactions', transactions )
    const txs = _.map( transactions, ( item ) => {
      return {
        tx_hash: item.txId,
        tx_height: item.height
      }
    } )

    this.emit( 'transaction-received', txs )
  }

  /**
   * 订阅指定协议的数据
   * @param {*} protocolString
   */
  subscribeProtocol ( protocolString ) {
  }

  /**
   * 取消订阅
   * @param {*} addressString
   */
  async unsubscribeAddress ( addressStr ) {
    const item = this.subscribedAddressMap.get( addressStr )
    if ( item ) {
      // 关闭electrum信息流
      await this.electrum.acquire().then( ecl => {
        return ecl.blockchainScripthash_unsubscribe( item.scriptHash )
      } ).catch( e => {
        console.warn( e )
      } )
      this.subscribedAddressMap.delete( addressStr )
    }
  }

  // 收到定要信息
  async _analyseSubscribedData ( data ) {
    if ( data ) {
      // 收到一个scriptHash数组, 无法直接对应交易数组
      // 查找对应的地址
      let transactions = []
      for ( const hash of data ) {
        for ( const [addressStr, item] of this.subscribedAddressMap ) {
          if ( hash === item.scriptHash ) {
            console.log( addressStr, hash )
            // 从内存池中获取交易记录
            const histories = await this.fetchHistories( addressStr )
            const txs = _.map( histories, ( item ) => {
              return {
                tx_hash: item.tx_hash,
                tx_height: item.height,
                address: addressStr
              }
            } )
            transactions = transactions.concat( txs )
          }
        }
      }
      console.log( transactions )
      this.emit( 'transaction-received', transactions )
    }
  }

  /**
   * 对观察中的所有地址进行观察
   */
  _watchAddressByElectrum ( electrumClient ) {
    for ( const [, item] of this.subscribedAddressMap ) {
      electrumClient.blockchainScripthash_subscribe( item.scriptHash ).then( result => {
        console.log( result )
      } ).catch( e => {
        // 当记录特别多时，会出现 history too large 错误，无法观察余额
        //     Error: the string "history too large" was thrown, throw an Error :)
        // at processTicksAndRejections (internal/process/task_queues.js:97:5)
        console.log( e )
      } )
    }
  }

  /**
   * 取消订阅所有的地址
   */
  async unsubscribeAllAddress () {
    // 取消地址订阅
    for ( const [addressStr, item] of this.subscribedAddressMap ) {
      if ( item ) {
        console.log( item )
        this.subscribedAddressMap.delete( addressStr )

        // 从electrum中取消
        const { scriptHash } = mapAddressToScriptHash( addressStr )

        await this.electrum.acquire().then( ecl => {
          return ecl.blockchainScripthash_unsubscribe( scriptHash )
        } ).catch( e => {
          console.warn( e )
        } )
      }
    }
    // 取消协议
    for ( const [addressStr, item] of this.subscribedProtocolMap ) {
      if ( item ) {
        this.subscribedProtocolMap.delete( addressStr )
      }
    }
  }
}

export default Network
