// Wallet， 用于维护账号余额以及每个地址的公私钥

import config from '../config'
import Network from './network'

import bsv from 'bsv'
import ecies from './electrum-ecies' // 椭圆曲线加密
import Mnemonic from 'bsv/mnemonic'
import assert from 'assert'
import aes from './aes'
import { Uint64LE } from 'int64-buffer'

import EventEmitter from 'eventemitter3'
import { newAddressIndex, generateNoteAddress, generateWalletAddress } from './address'
import BackService from './back-service'
import _ from 'lodash'
import { PromiseTask } from 'named-promise-task' // 异步任务，顺序处理
const console = config.console
import * as ntp from 'ntp2'

const sleep = ( ms ) => new Promise( ( resolve, reject ) => setTimeout( () => resolve(), ms ) )

// 助记词保存key
const SEED_DOC = 'seed'

// NOTE上链状态
const STATUS = {
  LOCAL: 0,
  SENT: 1,
  MEMPOOL: 2,
  BLOCK: 3
}

// 核心笔记
class Note extends EventEmitter {
  // 初始化
  constructor ( db ) {
    // 支持事件触发
    super()

    // 数据库
    this._db = db

    // 账号余额辅助变量
    this._balanceMaps = new Map()
    this._walletBalance = 0 // satoshi
    this._walletConfirmedBalance = 0 // satoshi
    this._walletUnconfirmedBalance = 0 // satoshi

    this._walletAddress = null
    this._walletAddressString = null

    // 系统设置信息
    this._systemSettings = Object.assign( {}, config.systemSettings )

    // 登录时使用的任务处理器
    this.loginTaskManager = new PromiseTask( this, {
      process: this._processTransaction
    } )

    // 运转后的任务处理器
    this.taskManager = new PromiseTask( this, {
      process: this._processTransaction
    } )

    this.broadcastManager = new PromiseTask( this, {
      broadcast: this._broadcastUncompleteNote
    } )

    // 任务开始
    this.taskManager.on( 'start', () => {
      this._notifyMessage( 'Syncing' )
    } )
    // 任务结束
    this.taskManager.on( 'stop', () => {
      this._notifyMessage( 'SyncFinished' )
    } )

    this.network = new Network()

    this.network.on( 'status-changed', () => {
      // 观察服务器通知
      // 20秒后异步调用，发送未完成的交易
      // 分析统计账号余额
      this._sumBalance()
    } )

    this.network.on( 'transaction-received', async ( txList ) => {
      await sleep(2000).then(async () => {
        // 分析历史记录
        if ( txList.length > 0 ) {
          console.log( 'transaction-received', txList )
          await this._analyseTxHistories( txList, this.taskManager )
        } else {
        // 需要更新状态
        }
      })
      await sleep(3000).then(async () => {
        // 账号余额
        this._sumBalance()
        // 发送未上链的数据
        if ( !this.broadcastManager.isRunning ) {
          this.broadcastManager.addTask( 'broadcast' )
        }
      })
    } )

    // 收到了笔记通知，带有raw数据，可以直接进行分析
    this.network.on( 'note-received', async ( txList ) => {
      // 分析笔记记录
      console.log( 'note-received', txList )
      await this._analyseTxHistories( txList, this.taskManager )
    } )

    this.backService = new BackService()
  }

  /// ////////////////////////////////
  // 保管助记词和登录和删除

  /**
   * 保存钱包信息，使用对称加密，加salt和密码
   */
  async saveWallet ( seedString, password, walletPath = "m/44'/236'/0'", lang = 'ENGLISH' ) {
    console.log( seedString, password, walletPath, lang )
    // 随机生成salt
    const salt = aes.salt()

    // 通过密码和salt生成key
    const key = await aes.generateKey( password, salt )
    // 准备doc
    const doc = { seedString, walletPath, lang }
    const jsonDoc = JSON.stringify( doc )
    // 使用key加密doc
    const encryptedDoc = aes.encrypt( key, jsonDoc )
    console.log( jsonDoc, encryptedDoc )

    const newDoc = {
      _id: SEED_DOC,
      salt: salt,
      doc: encryptedDoc
    }
    let seedDoc
    // 结合新旧文档
    try {
      const existDoc = await this._db.get( SEED_DOC )
      seedDoc = Object.assign( {}, existDoc, newDoc )
    } catch ( e ) {
      console.log( e )
      seedDoc = newDoc
    }
    try {
      // 保存加密doc和salt
      const result = await this._db.put( seedDoc )
      console.log( 'Saved', result )

      // 用密码登录
      await this.loginWithPassword( password ).then( result => {
        console.log( result )
      } )
      return { seedString, password, walletPath, lang }
    } catch ( e ) {
      console.warn( e )
      // 调用出错信息发送函数，通知画面线程
      if ( e.status !== 404 && e.message ) {
        this._notifyError( e.message )
      }
      return null
    }
  }

  /**
   * 检测是否存在账号, 如有返回true， 如无返回false
   */
  async checkAccount () {
    try {
      console.log( SEED_DOC )
      await this._db.get( SEED_DOC )
      return true
    } catch ( e ) {
      console.warn( e, e.status, e.message )
      if ( e.status === 404 ) { return false }
      // 调用出错信息发送函数，通知画面线程
      this._notifyError( e.message )
      return false
    }
  }

  /**
   * 超级密语的获取， 输入密码， 解密
   * @param {*} password
   */
  async fetchSeed ( password ) {
    try {
      const existDoc = await this._db.get( SEED_DOC )
      console.log( existDoc )

      const key = await aes.generateKey( password, existDoc.salt )

      const decryptedText = aes.decrypt( key, existDoc.doc )
      const decryptedDoc = JSON.parse( decryptedText )
      const seedString = decryptedDoc.seedString
      const walletPath = decryptedDoc.walletPath
      const lang = decryptedDoc.lang || 'ENGLISH' // 缺省助记词语言是英语

      return { seedString, walletPath, lang }
    } catch ( e ) {
      // 解码不正确，获取的字符串无法用JSON.parse处理，会发生异常
      console.log( e )
      // 通过login函数调用， 需要处理返回值， 不直接发送出错通知
      return null
    }
  }

  /**
   * login， 通过密码， 获取种子， 然后创建根私钥
   */
  async loginWithPassword ( password ) {
    try {
      // 通过密码， 获取种子
      const seedResult = await this.fetchSeed( password )
      if ( seedResult === null ) {
        // 如果返回null，说明密码不对，解码失败
        return null
      }

      const { seedString, walletPath, lang } = seedResult
      console.log( seedString, walletPath )

      // 根据助记词和语言获取种子
      const mnemonic = Mnemonic.fromString( seedString, Mnemonic.Words[lang] )
      // 从种子获取HD私钥
      this._seedHDPrivateKey = bsv.HDPrivateKey.fromSeed( mnemonic.toSeed() )
      // 通过路径派生根私钥
      this._rootHDPrivateKey = this._seedHDPrivateKey.deriveChild( walletPath )
      // 通过路径派生根公钥
      this._rootHDPublicKey = bsv.HDPublicKey.fromHDPrivateKey( this._rootHDPrivateKey )
      // 获取根地址，以及公私钥
      this._rootPublicKey = this._rootHDPrivateKey.publicKey
      this._rootPrivateKey = this._rootHDPrivateKey.privateKey
      this._rootAddreessString = bsv.Address.fromPublicKey( this._rootPublicKey ).toString()

      console.log( this._rootAddreessString, this._rootPublicKey.toString(), this._rootPrivateKey.toString() )

      // 生成钱包地址
      // TODO：在MVP版使用唯一的地址，同时用于找零地址。只需观察这唯一的地址，和解析此地址发生的所有交易
      // 将来每笔交易使用唯一的地址只交易一次。
      this._walletAddress = generateWalletAddress( this._rootHDPrivateKey, 0 )
      this._walletAddressString = this._walletAddress.addressString
      this._walletBalance = 0 // satoshi
      this._walletConfirmedBalance = 0 // satoshi
      this._walletUnconfirmedBalance = 0 // satoshi

      console.log( this._walletAddress.privateKey.toHex() )

      // 检查后台服务，获取设置信息
      this._checkAccountSettings()

      // 通过钱包地址检索交易记录， 同时确定账户余额和地址索引
      this.checkWallet()

      // 延时，异步调用， 处理本地status === STATUS.SENT的数据
      // 不应该出现这种情况
      // setTimeout(() => {
      //   this._broadcastUnreceivedNote()
      // }, 3000)

      // 延时，异步调用， 处理本地status === STATUS.LOCAL的数据
      setTimeout( () => {
        if ( !this.broadcastManager.isRunning ) {
          this.broadcastManager.addTask( 'broadcast' )
        }
      }, 3000 )

      // 返回种子，路径，以及钱包地址
      return { seedString, walletPath, lang }
    } catch ( e ) {
      console.log( e )
      return null
    }
  }

  // 检查本地时间
  async checkLocalTime () {
    try {
      const n = ntp()
      const time = await n.time()
      const localTimestamp = Math.floor(Date.now() / 1000)
      const transmitTimestamp = Math.floor(time.transmitTimestamp / 1000)
      if (Math.abs(localTimestamp - transmitTimestamp) > 3) {
      // 本地时间同全球时间相差两秒以上
        this._notifyError( 'need-sync-localtime' )
      }
    } catch (e) {

    }
  }

  // 清空所有变量, 删除账号时使用
  _initObjectMembers () {
    this._balanceMaps = new Map()
    this._walletBalance = 0 // satoshi
    this._walletConfirmedBalance = 0 // satoshi
    this._walletUnconfirmedBalance = 0 // satoshi

    this._seedHDPrivateKey = null
    this._rootHDPrivateKey = null
    this._rootPublicKey = null
    this._rootPrivateKey = null
    this._rootAddreessString = null
    this._walletAddress = null
  }

  /**
   * 删除账号
   */
  async removeAccount () {
    try {
      // 删除种子
      const existDoc = await this._db.get( SEED_DOC )
      console.log( existDoc )
      await this._db.remove( existDoc )
      // 删掉数据库
      await this._db.allDocs( { include_docs: true } ).then( allDocs => {
        return allDocs.rows.map( row => {
          console.log( row.id )
          return { _id: row.id, _rev: row.doc._rev, _deleted: true }
        } )
      } ).then( deleteDocs => {
        return this._db.bulkDocs( deleteDocs )
      } )

      await this.network.unsubscribeAllAddress()
    } catch ( e ) {
      console.warn( e )

      // TODO:删除失败的处理
      if ( e.message ) {
        this._notifyError( e.message )
      }
    }

    this._initObjectMembers()

    return true
  }

  /// ////////////////////////////////
  // 交易记录的获取，地址检查

  /**
   * 通过钱包地址检索交易记录， 同时确定账户余额和地址索引
   */
  async checkWallet () {
    if ( this._walletAddress === null ) {
      // 系统重置时地址为null
      return
    }
    // 检查钱包地址， 获取交易记录，更新账号余额
    return this._checkAddress( this._walletAddress )
  }

  // 返回值为true表明含有历史记录，否则表明没有记录的新地址
  async _checkAddress ( addressObj ) {
    // 观察地址
    this.network.subscribeAddress( addressObj.addressString )

    // 观察协议
    this.network.subscribeProtocol( this._rootAddreessString )

    // 分析统计账号余额
    setTimeout( () => {
      // 分析统计账号余额
      this._sumBalance()
    }, 1000 )

    // 分析历史记录
    return await this._analyseAllHistories()
  }

  /// ////////////////////////////////
  // 笔记的增删改

  // 查找指定id的最新记录
  async _findLatestTxById ( id ) {
    assert.isTrue( false, 'must impl in child class' )
  }

  // 删除指定id未广播的笔记
  async _clearUncompleteNoteById ( id ) {
    assert.isTrue( false, 'must impl in child class' )
  }

  /**
   * 更新一个note交易，保存进入数据库
   * 更新笔记同历史记录无关，笔记中的id和tms是重要字段
   */
  async updateNote ( payload ) {
    console.debug( payload )
    // 检查是否还有未广播是版本， 用新的代替
    const clearResult = await this._clearUncompleteNoteById( payload.id )
    console.log( clearResult )
    // 异步调用，构建note脚本
    setTimeout( () => { this._buildNoteScript( payload ) }, 0 )

    return true
  }

  /**
   * 删除一个note
   * @param {*} id
   */
  async deleteNote ( note ) {
    const id = note.id
    // 是否只删除草稿
    const deleteDraft = note.draft
    console.debug( note )

    // 检查是否还有未广播版本， 取消，用新的代替
    const clearResult = await this._clearUncompleteNoteById( id )
    console.debug( clearResult )

    // 检查本地数据
    try {
      const noteId = this._buildNoteId( id )
      const existDoc = await this._db.get( noteId )
      console.debug( 'existDoc', existDoc )
      if ( existDoc.draft ) {
        await this._db.remove( existDoc )
        // 找到和这个note相关的所有的draft并删除掉，恢复已经上链的记录
        console.debug( `tx_${id}` )

        const noteTxRecord = await this._findLatestTxById( id )
        console.debug( noteTxRecord )
        if ( noteTxRecord === null ) {
          return true
        }

        // 分析脚本，组合笔记数据
        const notePayload = await this.noteToFront( noteTxRecord )

        // 保存输出用hex, 放入待发送数据库， 等待发送
        // note对象id使用 note_index的方式，避免pouchdb不认识
        const noteRecord = Object.assign( {
          _id: noteId, // 地址是查询ID， PouchDB根据是keyvalue数据库， 根据id来区分数据
          index: noteTxRecord.index,
          tms: noteTxRecord.tms,
          noteScriptHex: noteTxRecord.noteScriptHex,
          tx_status: ( ( noteTxRecord.tx_height > 0 ) ? STATUS.BLOCK : STATUS.MEMPOOL ),
          tx_height: noteTxRecord.tx_height,
          tx_hash: noteTxRecord._id,
          sharer: notePayload.status.sharer
        }, this._appendNoteInfo( notePayload.note, noteId ) )

        console.debug( noteRecord )
        await this._db.put( noteRecord ).then( result => {
          console.debug( result )
        } ).catch( e => {
          console.log( 'put note error', noteRecord, e )
        } )

        console.debug( 'notePayload', notePayload )
        this.emit( 'note-changed', notePayload )
      } else {
        if ( !deleteDraft ) {
          // 创建一个包含del flag和时间戳的note，提交上链
          const payload = {
            id: id,
            note: {
              del: true,
              tms: Date.now()
            }
          }
          setTimeout( () => { this._buildNoteScript( payload ) }, 0 )
        }
      }
    } catch ( e ) {
      console.warn( e )
    }
    // 异步调用，构建note脚本
    return true
  }

  // 检索数据库获取所有已删除笔记
  async _findDeletedNotes () {
    assert.isTrue( false, 'must impl in child class' )
  }

  /**
   * 获取所有被删除的笔记
   */
  async getDeletedNotes () {
    // 查询数据库， 所有note开始的id
    try {
      // 检索note开头的id，获取所有最新的note
      const docs = await this._findDeletedNotes()
      const results = []
      // 发送每一个未完成的记录
      for ( const noteRecord of docs ) {
        console.log( noteRecord )
        if ( noteRecord.noteScriptHex ) {
          // 从hex构建Script对象
          const noteScript = bsv.Script.fromHex( noteRecord.noteScriptHex )
          const noteResult = await this._analyseNoteScript( noteScript )
          if ( noteResult ) {
            const {
              note,
              addressIndex,
              sharer
            } = noteResult
            // 如果不是已删除数据
            note.draft = noteRecord.draft
            const status = {
              tx_status: noteRecord.tx_status,
              addressIndex
            }
            if ( noteRecord.tx_height ) {
              status.tx_height = noteRecord.tx_height
            }
            if ( noteRecord.tx_hash ) {
              status.tx_hash = noteRecord.tx_hash
            }
            if ( noteRecord.outputIndex ) {
              status.outputIndex = noteRecord.outputIndex
            }
            if ( sharer ) {
              status.sharer = sharer
            } else {
              status.sharer = ''
            }
            // 不通知mem和files，因为比较大
            // delete note.mem
            delete note.files

            const payload = {
              id: noteRecord.index,
              note,
              status
            }
            results.push( payload )
          }
        }
      }
      return results
    } catch ( e ) {
      console.log( e )
    }
  }

  /**
   * 分享笔记
   * 根据笔记的id生成私钥,将tx和私钥打包进入交易
   * 每个联系人一个输出
   * 每个输出,使用联系人根公钥加密,使用根地址,索引使用0, 添加自己的签名
   *
   * @param {*} payload
   */
  async shareNote ( payload ) {
    try {
      console.debug( payload )
      const addressIndex = payload.addressIndex
      // 根据派生索引生成地址数据, 获取相应地址的私钥
      const addressObj = generateNoteAddress( this._rootHDPrivateKey, addressIndex )
      console.log( addressObj.privateKey.toString( 'hex' ) )
      const data = {
        pay: payload.pay, // 发送者的paymail
        tx: payload.tx, // 数据所在的tx hash
        pub: this._rootPublicKey.toHex(), // 根地址公钥
        key: addressObj.privateKey.toString( 'hex' ) // 解码数据需要的私钥
      }
      console.debug( data )
      // 分享的内容
      const json = JSON.stringify( data )

      const outputs = []

      // 添加分享信息进入一个输出，用于发送者的信息显示

      // 创建一个新的地址索引，用于创建私钥和公钥
      const newIndex = newAddressIndex()
      // 通过地址索引派生创建地址
      const newObject = generateNoteAddress( this._rootHDPrivateKey, newIndex )
      const note = {
        idx: parseInt( payload.id ), // 当前笔记的ID
        tx: payload.tx, // payload.tx
        tms: Date.now(),
        contacts: payload.contacts
      }
      const jsonData = JSON.stringify( note )
      console.log( jsonData )
      console.log( payload.note, note, newIndex )
      // 使用公钥加密
      // 使用当前地址的公钥
      // 如果添加私钥加密, 公钥将泄漏在秘文中
      const encrypedNote = ecies.encrypt( jsonData, newObject.publicKey )//, newObject.privateKey )
      console.log( encrypedNote )

      // 使用根地址私钥对加密数据的sha256进行签名
      const encrypedNoteHash = bsv.crypto.Hash.sha256( encrypedNote )
      const sig = bsv.crypto.ECDSA.sign( encrypedNoteHash, this._rootHDPrivateKey.privateKey )
      console.log( sig.toString( 'hex' ) )

      // 构建信息输出用脚本
      // 输出数据的格式
      // op_return 根节点地址 当前索引 加密数据 加密数据的根节点私钥签名
      const index64LE = new Uint64LE( newObject.index )
      const ouputData = [this._rootAddreessString, index64LE.toBuffer(), encrypedNote, sig.toBuffer()]
      const script = bsv.Script.buildSafeDataOut( ouputData )
      const scriptHex = script.toHex()
      console.log( script, scriptHex )
      // 构建输出
      const output = new bsv.Transaction.Output( {
        satoshis: 0,
        script: script
      } )
      outputs.push( output )

      // 循环每个联系人,使用联系人根地址公钥,加密数据
      for ( const contact of payload.contacts ) {
        const publicKey = new bsv.PublicKey( contact.pubkey )
        const addressString = publicKey.toAddress().toString()
        console.log( publicKey.toString(), addressString )
        // 使用接收方的公钥加密
        const encrypedNote = ecies.encrypt( json, publicKey )
        console.log( encrypedNote )
        // 使用发送方的根地址私钥对加密数据的sha256进行签名
        const encrypedNoteHash = bsv.crypto.Hash.sha256( encrypedNote )
        const sig = bsv.crypto.ECDSA.sign( encrypedNoteHash, this._rootHDPrivateKey.privateKey )
        console.log( sig.toString( 'hex' ) )
        // 构建信息输出用脚本
        // 输出数据的格式
        // op_return 接收方根节点地址 索引0 加密数据 发送方根节点私钥对数据hash的签名
        const index64LE = new Uint64LE( 0 )
        const ouputData = [addressString, index64LE.toBuffer(), encrypedNote, sig.toBuffer()]
        const script = bsv.Script.buildSafeDataOut( ouputData )
        const scriptHex = script.toHex()
        console.log( script, scriptHex )
        // 构建输出
        const output = new bsv.Transaction.Output( {
          satoshis: 0,
          script: script
        } )
        outputs.push( output )
        // 给接收方发送一个546satoshi的通知输出，方便使用普通历史记录api获取
        const p2pkhScriptHex = await this.backService.client.getOutputFor( contact.paymail, {
          senderHandle: payload.pay,
          pubkey: this._walletAddress.publicKey.toHex()
        }, this._walletAddress.privateKey.toHex() )
        console.debug( p2pkhScriptHex )
        const p2pkhOutput = new bsv.Transaction.Output( {
          satoshis: 546,
          script: new bsv.Script( p2pkhScriptHex )
        } )
        outputs.push( p2pkhOutput )
      }

      console.debug( outputs )

      // 发送交易
      await this._buildAndSendTransaction( outputs )
      this._notifyMessage( 'NoteWasShared' )
    } catch ( e ) {
      console.warn( e )
      this._notifyError( e.message )
    }
  }

  async _findAllNotes () {
    assert.isTrue( false, 'must impl in child class' )
  }

  /**
   * 获取本地所有的notes, 画面启动时调用次函数获取所有的笔记缓存
   * 桌面版，在子类中实现，读取数据库，实时分析，返回给UI
   * 手机端，使用native代码，直接从数据库中获取解析后的代码
   */
  async fetchAllNotes () {
    // 查询数据库， 所有note开始的id
    try {
      // 检索note开头的id，获取所有最新的note
      const docs = await this._findAllNotes()
      console.log( 'fetchAllNotes', docs )
      // 发送每一个未完成的记录
      for ( const noteRecord of docs ) {
        console.log( noteRecord )
        if ( noteRecord.noteScriptHex ) {
          // 从hex构建Script对象
          const noteScript = bsv.Script.fromHex( noteRecord.noteScriptHex )
          const noteResult = await this._analyseNoteScript( noteScript )
          if ( noteResult ) {
            const {
              note,
              addressIndex,
              sharer
            } = noteResult
            // 如果不是已删除数据
            if ( !note.del ) {
              note.draft = noteRecord.draft
              const status = {
                tx_status: noteRecord.tx_status,
                addressIndex
              }
              if ( noteRecord.tx_height ) {
                status.tx_height = noteRecord.tx_height
              } else {
                status.tx_height = null
              }
              if ( noteRecord.tx_hash ) {
                status.tx_hash = noteRecord.tx_hash
              } else {
                status.tx_hash = null
              }
              if ( noteRecord.outputIndex ) {
                status.outputIndex = noteRecord.outputIndex
              } else {
                status.outputIndex = null
              }
              if ( sharer ) {
                status.sharer = sharer
              } else {
                status.sharer = ''
              }
              // 不通知mem和files，因为比较大
              // delete note.mem
              delete note.files
              const payload = {
                id: noteRecord.index,
                note,
                status
              }
              this.emit( 'note-changed', payload )
            }
          }
        }
      }
      return
    } catch ( e ) {
      console.log( e )
    }
  }

  /**
   * 返回钱包地址，用于充值
   */
  walletAddressString () {
    console.log( this._walletAddressString )
    return this._walletAddressString
  }

  /**
   * 返回钱包余额
   */
  walletBalance () {
    // 返回钱包余额
    return { walletBalance: this._walletBalance, walletConfirmedBalance: this._walletConfirmedBalance, walletUnconfirmedBalance: this._walletUnconfirmedBalance }
  }

  /**
   * 提现所有的satoshi到指定的地址
   * @param {*} toAddress
   */
  async withdrawAllTo ( toAddress ) {
    try {
      // 查询钱包余额
      // TODO：暂时使用唯一的钱包地址
      const balance = await this.network.getBalance( this._walletAddressString )
      console.log( balance )
      const utxoMaps = await this.network.selectUtxos( [this._walletAddressString], balance.confirmed + balance.unconfirmed )
      // 构建UTXO
      // 循环所有的utxo，构造bsv utxo
      // 获取输入utxo
      const utxos = []
      const privateKeys = []
      let satoshiTotal = 0
      for ( const [addressStr, utxoList] of utxoMaps ) {
        console.log( addressStr, utxoList )
        for ( const utxo of utxoList ) {
          utxos.push( utxo )
          // FIXME:因为钱包只有一个地址，所以用同样的私钥， 今后需要根据地址获取对应的私钥
          privateKeys.push( this._walletAddress.privateKey )

          satoshiTotal += utxo.value
        }
      }
      // 检查余额，费用，是否有效，避免发送失败
      // 账号余额不足，无法完成提现交易
      if ( satoshiTotal < 170 + bsv.Transaction.DUST_AMOUNT ) {
        this._notifyError( 'NoBalance' )
        return
      }

      // 组合文本保存用输出和找零输出
      const transaction = new bsv.Transaction()
      transaction.feePerKb( this._systemSettings.feePerKb ) // 每K字节500 satoshi
      transaction.from( utxos )
      // 提款到目标地址
      transaction.change( toAddress )

      // 对交易签名
      transaction.sign( privateKeys )
      console.log( transaction.getFee() )

      try {
        // 检查交易是否有效, 并且广播
        const transactionHex = transaction.serialize( { message: 'Check Transaction' } )
        console.log( transactionHex, transactionHex.length )

        // 广播
        const result = await this.network.broadcast( transactionHex )
        console.log( result ) // 返回的结果就是tx hash
      } catch ( e ) {
        console.error( e )

        if ( e.name ) {
          switch ( e.name ) {
            case 'bsv.ErrorTransactionInvalidOutputAmountSum':
              console.log( e.message )
              break
            case 'bsv.ErrorTransactionDustOutputs':
              break
            default:
              break
          }
        }
        if ( e.message ) {
          this._notifyError( e.message )
        }
        return false
      }

      return true
    } catch ( e ) {
      // 调用出错信息发送函数，通知画面线程
      if ( e.message ) {
        this._notifyError( 'error' )
      }
      return false
    }
  }

  /**
   * 获取指定交易id的笔记， 从交易记录中获取
   * @param {*} noteTxId
   */
  async getNoteTxById ( noteTxId ) {
    assert.isTrue( false, 'must impl in child class' )
  }

  /**
   * 获取指定id的笔记， 构造笔记id，获取最新的笔记
   * @param {*} id
   */
  async getNoteById ( id ) {
    try {
      const noteId = this._buildNoteId( id )
      // 检索note开头的id，获取所有最新的note
      const noteRecord = await this._db.get( noteId )
      return await this.noteToFront( noteRecord )
    } catch ( e ) {
      console.log( e )
      return null
    }
  }

  /**
   * 分析笔记的脚本，组合结果和状态, 发送给前端
   * @param {*} noteRecord
   */
  async noteToFront ( noteRecord ) {
    const noteScript = bsv.Script.fromHex( noteRecord.noteScriptHex )
    const {
      note,
      addressIndex,
      sharer
    } = await this._analyseNoteScript( noteScript )

    if ( noteRecord.draft ) {
      note.draft = noteRecord.draft
    }
    const status = {
      tx_status: noteRecord.tx_status,
      addressIndex
    }
    if ( noteRecord.tx_height ) {
      status.tx_height = noteRecord.tx_height
    } else {
      status.tx_height = null
    }
    if ( noteRecord.tx_hash ) {
      status.tx_hash = noteRecord.tx_hash
    } else {
      status.tx_hash = null
    }
    if ( sharer ) {
      status.sharer = sharer
    } else {
      status.sharer = ''
    }
    console.log( noteRecord, status )
    return {
      id: note.idx,
      note: note,
      status
    }
  }

  /**
   * 获取所有的指定id的所有历史记录
   * 针对不同平台数据库具体实现
   * @param {*} id
   */
  async getHistoriesById ( id ) {
    assert.isTrue( false, 'must impl in child class' )
  }

  /// ///////////////////////////////////////////
  // 帮助函数, 私有方法

  // 构造note id，所有记录都是note开头， 方便检索所有的note
  _buildNoteId ( idx ) {
    return `note_${idx}`
  }

  // 构造note交易id, 所有记录都是tx开头
  _buildTxId ( idx, tms ) {
    return `tx_${idx}_${tms}`
  }

  // 更新数据库，使用新的doc覆盖既存文档， 如无文档创建新的
  async _createOrUpdateDB ( newDoc ) {
    assert.ok( newDoc )
    let doc
    // 结合新旧文档
    try {
      const existDoc = await this._db.get( newDoc._id )
      doc = Object.assign( {}, existDoc, newDoc )
    } catch ( e ) {
      console.log( e )
      doc = newDoc
    }
    // put函数有可能产生异常，应该在调用处使用catch
    return await this._db.put( doc )
  }

  // 分析普通笔记记录
  _analyseNoteBuffer ( addressIndex, noteBuffer, sigBuffer ) {
    try {
      // 索引地址不为0的笔记，可以从索引获取私钥，然后解密
      // 根据派生索引生成地址数据
      const addressObj = generateNoteAddress( this._rootHDPrivateKey, addressIndex )
      console.log( addressObj.addressString )
      const privateKey = addressObj.privateKey
      // 使用私钥解码
      const decryptedNote = ecies.decrypt( noteBuffer, privateKey )
      console.log( decryptedNote, decryptedNote.toString() )

      // 使用根地址私钥对加密数据的sha256进行签名
      const encrypedNoteHash = bsv.crypto.Hash.sha256( noteBuffer )
      const sig = bsv.crypto.Signature.fromBuffer( sigBuffer )

      const publicKet = bsv.crypto.ECDSA. verify( encrypedNoteHash, sig, this._rootPublicKey )

      // 使用根地址公钥校验签名，确保交易不是伪造的
      const verified = bsv.crypto.ECDSA.verify( encrypedNoteHash, sig, this._rootPublicKey )
      if ( !verified ) {
        console.log( verified )
        return null
      }

      // 解码note
      const note = JSON.parse( decryptedNote )
      // 如果笔记中没有指定idx，那么idx=addressIndex
      if ( !note.idx ) {
        note.idx = addressIndex
      }
      console.log( addressIndex, note.idx, ( new Date( note.tms ) ).toLocaleString(), note.ttl, note.del )

      // 如果是一个分享记录，则组合分享对象的地址
      let sharer
      if ( note.contacts ) {
        sharer = _.map( note.contacts, item => {
          return item.paymail
        } ).join( ',' )
        console.debug( sharer )
      }

      // 返回note和对应的地址索引
      return { note, addressIndex, sharer }
    } catch ( e ) {
      console.warn( e.message )
    }
  }

  // 分析分享记录
  async _analyseShareBuffer ( dataBuffer, sigBuffer ) {
    try {
      // 使用自己的私钥解码
      const decryptedData = ecies.decrypt( dataBuffer, this._rootPrivateKey )
      console.log( decryptedData, decryptedData.toString() )

      // 解码data
      const data = JSON.parse( decryptedData )
      console.log( data )

      // 使用数据提供的根公钥校验签名，确保笔记不是伪造的
      const payerPubkey = new bsv.PublicKey( data.pub )
      // 使用根地址私钥对加密数据的sha256进行签名
      const encrypedNoteHash = bsv.crypto.Hash.sha256( dataBuffer )
      const sig = bsv.crypto.Signature.fromBuffer( sigBuffer )
      // 使用发送方的根地址公钥校验签名
      const verified = bsv.crypto.ECDSA.verify( encrypedNoteHash, sig, payerPubkey )
      if ( !verified ) {
        console.log( verified )
        return null
      }

      // 获取公钥对应的地址
      const payerRootAddressString = payerPubkey.toAddress().toString()
      console.log( payerRootAddressString )

      // 获取笔记中的笔记交易hash以及私钥
      // 通过network获取交易记录
      const txRaw = await this.network.fetchRawTx( data.tx )
      console.log( txRaw )
      const transaction = new bsv.Transaction( txRaw )
      console.log( transaction.toObject() )

      // 分享者的paymail
      const sharer = data.pay

      // 解析交易记录， 循环每一个输出，检查符合条件的一条
      for ( const output of transaction.outputs ) {
        try {
          const script = output.script
          const buffers = script.getData()
          if ( buffers.length !== 4 ) {
            continue
          }

          const prefixAddress = buffers[0]
          console.log( prefixAddress.toString() )
          // 要求交易纪录的根地址等于分享方公钥转换的地址， 分享者只能分享自己的笔记， 不能分享其他人的
          if ( prefixAddress.toString() !== payerRootAddressString ) {
            continue
          }

          // 获取派生索引
          const noteIndexBuffer = buffers[1]
          const index64LE = new Uint64LE( noteIndexBuffer )
          const addressIndex = index64LE.toNumber()
          console.log( addressIndex )
          // 忽略地址索引，地址索引应该不为0，是一个真正的笔记
          if ( addressIndex === 0 ) {
            continue
          }

          const addressObj = generateNoteAddress( this._rootHDPrivateKey, addressIndex )
          console.log( addressObj.privateKey.toString( 'hex' ) )

          // 获取数据区
          const noteBuffer = buffers[2]
          // 获取签名区
          const sigBuffer = buffers[3]

          // 从分享数据获取数据私钥
          const privateKey = new bsv.PrivateKey( data.key )
          console.log( data.key, privateKey.toString( 'hex' ) )
          // 使用私钥解码
          const decryptedNote = ecies.decrypt( noteBuffer, privateKey )
          console.log( decryptedNote, decryptedNote.toString() )

          // 使用根地址私钥对加密数据的sha256进行签名
          const encrypedNoteHash = bsv.crypto.Hash.sha256( noteBuffer )
          const sig = bsv.crypto.Signature.fromBuffer( sigBuffer )

          // 使用发送方的地址公钥校验签名，确保交易不是伪造的
          const verified = bsv.crypto.ECDSA.verify( encrypedNoteHash, sig, payerPubkey )
          if ( !verified ) {
            console.log( verified )
            continue
          }

          // 解码note
          const note = JSON.parse( decryptedNote )
          // 如果笔记中没有指定idx，那么idx=addressIndex
          if ( !note.idx ) {
            note.idx = addressIndex
          }
          console.log( addressIndex, note.idx, ( new Date( note.tms ) ).toLocaleString(), note.ttl, note.del )

          // 返回note和对应的地址索引,以及分享者的paymail地址
          return { note, addressIndex: 0, sharer }
        } catch ( e ) {
          console.warn( e.message )
        }
      }
    } catch ( e ) {
      console.warn( e.message )
    }

    return null
  }

  // 分析笔记脚本
  async _analyseNoteScript ( script ) {
    try {
      if ( !script.isSafeDataOut() && !!script.isDataOut() ) {
        return null
      }
      // 分析这条记录的script，查看是否符合我们的式样， 要求是safeoutput， rootaddress， extIndex， data, sig
      console.log( script )

      const buffers = script.getData()
      if ( buffers.length !== 4 ) {
        return null
      }
      const prefixAddress = buffers[0]
      console.log( prefixAddress.toString() )
      // 如果前缀地址不是根地址， 忽略
      if ( prefixAddress.toString() !== this._rootAddreessString ) {
        return null
      }

      // 获取派生索引
      const noteIndexBuffer = buffers[1]
      const index64LE = new Uint64LE( noteIndexBuffer )
      const addressIndex = index64LE.toNumber()
      console.log( addressIndex )
      if ( Number.isNaN( addressIndex ) ) {
        return null
      }

      // 获取数据区
      const noteBuffer = buffers[2]
      // 获取签名区
      const sigBuffer = buffers[3]

      // 索引地址为0的笔记，是其他人分享过来的，需要使用根地址私钥解密
      if ( addressIndex === 0 ) {
        return this._analyseShareBuffer( noteBuffer, sigBuffer )
      } else {
        return this._analyseNoteBuffer( addressIndex, noteBuffer, sigBuffer )
      }
    } catch ( e ) {
      // 解码失败， 地址不正确
      console.log( e.message )
      return null
    }
  }

  // 分析交易记录
  async _analyseNoteTransaction ( txRecord ) {
    if ( this._rootAddreessString === null ) {
      // 系统重置时地址为null
      return
    }

    // TODO: 分析交易记录和笔记，以及笔记的交易记录，如果已经存在本地，不需要再次解析，只是更新状态
    // console.debug('Analyse...', txRecord._id)
    // 查找笔记交易记录中是否有此tx_hash
    // 如果存在，则更新状态，然后检查时间戳，决定是否将状态通知画面

    // 如果不存在，则分析raw

    const transaction = new bsv.Transaction( txRecord.raw )
    console.log( transaction.toObject() )
    // 数据索引
    let outputIndex = 0
    for ( const obj of transaction.outputs ) {
      // 分析这一条输出script
      const result = await this._analyseNoteScript( obj.script )
      if ( result ) {
        const { note, addressIndex, sharer } = result

        // FIXME:这里应该先比较本地数据库的状态是否没有不要更新。避免增加无谓的IO操作

        // note对象id使用 note_index_tms的方式
        const noteTxId = this._buildTxId( note.idx, note.tms )
        const noteTxRecord = {
          _id: noteTxId,
          index: note.idx,
          tms: note.tms, // 时间戳来自笔记数据，不同于
          noteScriptHex: obj.script.toHex(),
          tx_status: ( ( txRecord.tx_height > 0 ) ? STATUS.BLOCK : STATUS.MEMPOOL ),
          tx_height: txRecord.tx_height,
          tx_hash: txRecord._id,
          outputIndex,
          addressIndex
        }

        // 笔记的分享者
        if ( sharer ) {
          noteTxRecord.sharer = sharer
        } else {
          noteTxRecord.sharer = ''
        }

        // 异步更新数据库
        this._createOrUpdateDB( noteTxRecord ).then( result => {
          console.log( result )
        } ).catch( e => {
          console.log( e )
        } )

        // 被分享的记录只保存tx数据，不保存进入最新的note
        if ( note.contacts ) {
          // 如果是一个分享记录，则不继续分析，也不更新UI数据
          return
        }

        // 检查数据库中note记录，更新状态
        const noteId = this._buildNoteId( note.idx )
        // 保存输出用hex, 放入待发送数据库， 等待发送
        // note对象id使用 note_index的方式，避免pouchdb不认识
        const noteRecord = Object.assign( {
          _id: noteId, // 地址是查询ID， PouchDB根据是keyvalue数据库， 根据id来区分数据
          index: note.idx,
          tms: note.tms,
          del: note.del, // 设置删除flag
          noteScriptHex: obj.script.toHex(),
          tx_status: ( ( txRecord.tx_height > 0 ) ? STATUS.BLOCK : STATUS.MEMPOOL ),
          tx_height: txRecord.tx_height,
          tx_hash: txRecord._id,
          outputIndex,
          addressIndex
        }, this._appendNoteInfo( note, noteId ) )

        // 笔记的分享者
        if ( sharer ) {
          noteRecord.sharer = sharer
        } else {
          noteRecord.sharer = ''
        }
        // 更新本地note记录
        let doc
        // 检查本地数据
        try {
          const existDoc = await this._db.get( noteId )
          if ( existDoc.tms > note.tms ) {
            // 本地数据时间比新数据时间新，则不做处理
            return
          }

          doc = Object.assign( {}, existDoc, noteRecord )
        } catch ( e ) {
          console.log( e.status, e.message )
          // 说明本地没有， 区块链上有数据
          doc = noteRecord
        }

        await this._db.put( doc ).then( result => {
          console.log( result )
        } ).catch( e => {
          console.log( 'put note error', doc, e )
        } )

        // note状态更新， 通知UI
        // 设置最新的状态
        // 不通知mem和files，因为比较大
        // delete note.mem
        delete note.files
        const notePayload = {
          id: note.idx,
          note: note,
          status: {
            tx_status: noteRecord.tx_status,
            tx_height: noteRecord.tx_height,
            tx_hash: noteRecord.tx_hash,
            outputIndex,
            addressIndex,
            sharer
          }
        }
        console.log( notePayload )
        this.emit( 'note-changed', notePayload )
      }
      // 输出索引+1
      outputIndex++
    }
  }

  // 通过笔记id获取记录
  async _findNotesByTxHash ( recordId ) {
    assert.isTrue( false, 'must impl in chaild class' )
  }

  // 通过id获取交易记录
  async _findNoteTxsByTxHash ( recordId ) {
    assert.isTrue( false, 'must impl in chaild class' )
  }

  // 更新现存笔记的状态
  async _updateNoteStatus ( txRecord ) {
    try {
      const tx_status = ( ( txRecord.tx_height > 0 ) ? STATUS.BLOCK : STATUS.MEMPOOL )

      const txNoteRecords = await this._findNoteTxsByTxHash( txRecord._id )
      for ( const txNote of txNoteRecords ) {
        if ( txNote.tx_status === tx_status ) {
          continue
        }
        txNote.tx_status = tx_status
        await this._createOrUpdateDB( txNote ).then( result => {
          console.log( result )
        } ).catch( e => {
          console.log( e )
        } )
        // 从最新笔记状态里寻找是否这条交易记录属于最新的帖子
        const noteRecords = await this._findNotesByTxHash( txRecord._id )
        for ( const noteRecord of noteRecords ) {
          if ( noteRecord.tx_status !== tx_status ) {
            // 应该只有一条
            // 发送每一个未完成的记录
            noteRecord.tx_status = tx_status
            await this._createOrUpdateDB( noteRecord ).then( result => {
              console.log( result )
            } ).catch( e => {
              console.log( e )
            } )
            // note状态更新， 通知UI
            const notePayload = {
              id: noteRecord.index,
              status: {
                tx_status: noteRecord.tx_status,
                tx_hash: noteRecord.tx_hash,
                tx_height: noteRecord.tx_height,
                outputIndex: noteRecord.outputIndex,
                addressIndex: noteRecord.addressIndex,
                sharer: noteRecord.sharer
              }
            }
            console.log( notePayload )

            this.emit( 'note-changed', notePayload )
          }
        }
      }
      console.log( 'tx notes', txNoteRecords.length, txRecord._id )
      return ( txNoteRecords.length > 0 )
    } catch ( e ) {
      console.warn( e )
      return false
    }
  }

  // 任务：处理交易
  async _processTransaction ( tx ) {
    // 如果已经重置，立即退出
    if ( this._rootPublicKey === null ) {
      return
    }
    console.log( tx.tx_hash )
    // 检查数据库中是否已经有这一条数据， 如有则不分析，但是要更新状态
    let txRecord = {}
    try {
      txRecord = await this._db.get( tx.tx_hash )
      // 如果交易hash已经在数据库中， 不更新raw
    } catch ( e ) {
      // 如果没找到， 获取交易记录
      if ( e.status !== 404 ) {
        // 其它原因出错， 通知画面
        if ( e.message ) {
          this._notifyError( e.message )
        }
        console.warn( e, tx )
        return
      }
    }
    // 将交易记录保存进数据库
    txRecord = Object.assign( txRecord, {
      _id: tx.tx_hash,
      tx_hash: tx.tx_hash,
      address: tx.address !== undefined ? tx.address : txRecord.address,
      tx_height: tx.tx_height !== undefined ? tx.tx_height : -1,
      time: tx.time !== undefined ? tx.time : txRecord.time,
      income: tx.income !== undefined ? tx.income : txRecord.income,
      outcome: tx.outcome !== undefined ? tx.outcome : txRecord.outcome,
      type: tx.type || txRecord.type
    } )
    if ( !txRecord.time ) {
      txRecord.time = Date.now()
    }
    if ( !txRecord.raw ) {
      try {
        const txRaw = await this.network.fetchRawTx( tx.tx_hash )
        txRecord.raw = txRaw
      } catch ( e ) {
        // 获取交易失败
        console.warn( e )
        return
      }
    }
    // 如果没有计算过income和outcome，那么计算一下
    // 要求P2PKH输入或者输出必须包含钱包hash
    if ( txRecord.raw && !txRecord.income && !txRecord.outcome && txRecord.address === this._walletAddressString ) {
      try {
        const transaction = new bsv.Transaction( txRecord.raw )
        // 合计指定地址的输入金额,输出金额和费用
        const { income, outcome } = await this._calcAddressIncomeAndOutcome( transaction, txRecord.address )
        txRecord.income = income
        txRecord.outcome = outcome
        let type
        if ( txRecord.outcome === 0 ) {
          type = 'charge'
        } else if ( txRecord.income === 0 ) {
          type = 'withdraw'
        } else {
          type = 'spend'
        }
        txRecord.type = type
      } catch ( e ) {
        // 计算收支失败
        console.warn( e )
        return
      }
    }

    // 将地址信息保存进入数据库, 不保存任何私钥，需要用的时候都从路径再次生成
    // 更新数据库
    this._createOrUpdateDB( txRecord ).then( result => {
      console.log( result )
    } ).catch( e => {
      console.log( e )
    } )

    // 如果没有交易记录类型， 说明是分享的笔记，没有自己的花费， 不必通知UI
    if ( txRecord.type ) {
      // 交易记录通知UI, 复制一个交易对象，再通知，避免影响异步保存的数据
      const record = Object.assign( {}, txRecord )
      delete record.raw
      this.emit( 'tx-changed', record )
    }

    // 查找对应交易ID的Note记录， 如果存在则更新记录状态
    if ( await this._updateNoteStatus( txRecord ) === false ) {
      // 如果不存在对应的Note，那么分析交易记录，创建新的Note
      // 解析每一个地址的note数据， 保存进入address对应的note数据
      await this._analyseNoteTransaction( txRecord )
    }
  }

  // 分析所有的交易记录
  async _analyseTxHistories ( txList, taskManager ) {
    // 如果有历史记录，保存进入数据库
    for ( const tx of txList ) {
      // 添加一个任务处理
      taskManager.addTask( 'process', tx )
        .then( ( result ) => {
          console.log( result, taskManager.size )
        } )
        .catch( ( e ) => {
          console.warn( 'error:', e )
        } )
        .finally( () => {
          console.debug( 'task size:', taskManager.size )
        } )
    }

    return true
  }

  /**
   * 获取所有的交易记录，并且分析。从钱包收发的交易记录。
   */
  async _analyseAllHistories () {
    try {
      // 查询每一个地址的历史记录, 最终出错，返回空数组
      const transactionHistories = await this.network.fetchHistories( this._walletAddressString ).catch( e => { return [] } )

      // 内存池中的记录, 最终出错，返回空数组
      const transactionMempool = await this.network.fetchMempool( this._walletAddressString ).catch( e => { return [] } )

      // 查询协议地址记录, 最终出错，返回空数组
      const protocolHistories = await this.network.fetchProtocolHistories( this._rootAddreessString ).catch( e => { return [] } )

      const histories = _.unionWith( transactionMempool, transactionHistories, protocolHistories, ( a, b ) => { return a.tx_hash === b.tx_hash } )

      // 如果没有历史记录，那么这是最新的地址，记录当前的索引
      if ( histories.length === 0 ) {
        return false
      }
      console.log( histories )

      return this._analyseTxHistories( histories, this.loginTaskManager )
    } catch ( e ) {
      console.warn( e.message )
      return false
    }
  }

  async _sumBalance () {
    setTimeout( () => {
      this.checkLocalTime()
    }, 1000 )

    if ( this._rootAddreessString === null ) {
      // 系统重置时地址为null
      return
    }
    try {
      // 获取地址余额
      const balance = await this.network.getBalance( this._walletAddressString )
      // 保存地址余额
      this._balanceMaps.set( this._walletAddressString, balance )
      // 钱包金额合计
      let walletBalance = 0
      let walletConfirmedBalance = 0
      let walletUnconfirmedBalance = 0
      for ( const [, value] of this._balanceMaps ) {
        walletBalance += value.confirmed
        walletBalance += value.unconfirmed
        walletConfirmedBalance += value.confirmed
        walletUnconfirmedBalance += value.unconfirmed
      }
      console.debug( 'balance', this._balanceMaps, balance, walletBalance, this._walletBalance )

      if ( walletBalance === this._walletBalance ) {
        // 余额没有变化
        return
      }
      this._walletBalance = walletBalance
      this._walletConfirmedBalance = walletConfirmedBalance
      this._walletUnconfirmedBalance = walletUnconfirmedBalance

      console.debug( 'walletBalance', this._walletBalance, this._walletConfirmedBalance, this._walletUnconfirmedBalance )
      // 发生一个事件，通知观察者
      this.emit( 'wallet-balance', { balance: this._walletBalance, confirmed: this._walletConfirmedBalance, unconfirmed: this._walletUnconfirmedBalance } )
    } catch ( e ) {
      console.warn( e )
      if ( e.message ) {
        this._notifyError( e.message )
      }
    }
  }

  // 出错信息通知画面线程
  _notifyError ( errorMessage ) {
    console.warn( errorMessage )
    // 通知UI
    this.emit( 'error', errorMessage )
  }

  // 文本通知
  _notifyMessage ( message ) {
    // 通知UI
    this.emit( 'message', message )
  }

  // 计算服务费
  _calcDonationFee ( transaction ) {
    return ( bsv.Transaction.DUST_AMOUNT > transaction.getFee() ) ? bsv.Transaction.DUST_AMOUNT : transaction.getFee()
  }

  // 从交易中计算某个地址的的输入数量，输出数量，费用
  // 要求P2PKH输入或者输出必须包含钱包hash
  async _calcAddressIncomeAndOutcome ( transaction, address ) {
    // 合计输入金额
    const inputs = transaction.inputs
    let inputAmount = 0
    for ( const input of inputs ) {
      if ( input.output ) {
        // 地址查询获取的是一个输出脚本，正常P2PKH的脚本，第3项是一个ripemd160 public key hash， 从而可以获取地址
        const script = new bsv.Script( input.output )
        console.log( script )
        if ( script.chunks.length === 5 && script.chunks[2].buf.length === 20 ) {
          const address = bsv.Address.fromPublicKeyHash( script.chunks[2].buf )
          console.log( address.toString() )
          if ( address.toString() === address ) {
            inputAmount += input.output.satoshis
          }
        }
      } else {
        // 无法计算输入金额， 需要查询input里的txhash和output查询区块链
        console.log( input )
        const prevTxId = input.prevTxId.toString( 'hex' )
        const outputIndex = input.outputIndex
        console.log( prevTxId, outputIndex )

        const prevTxRaw = await this.network.fetchRawTx( prevTxId )
        const prexTx = new bsv.Transaction( prevTxRaw )
        console.log( prexTx )
        const output = prexTx.outputs[outputIndex]
        const script = new bsv.Script( output.script )
        console.log( script )
        if ( script.chunks.length === 5 && script.chunks[2].buf.length === 20 ) {
          const outputAddress = bsv.Address.fromPublicKeyHash( script.chunks[2].buf )
          console.log( outputAddress.toString() )
          if ( outputAddress.toString() === address ) {
            // 检查这个地址是否P2PKH，然后计算数量
            inputAmount += output.satoshis
          }
        }
      }
    }
    // 合计输出金额
    const outputs = transaction.outputs
    let outputAmount = 0
    for ( const output of outputs ) {
      const script = new bsv.Script( output.script )
      console.log( script )
      if ( script.chunks.length === 5 && script.chunks[2].buf.length === 20 ) {
        const outputAddress = bsv.Address.fromPublicKeyHash( script.chunks[2].buf )
        console.log( outputAddress.toString() )
        if ( outputAddress.toString() === address ) {
          // 检查这个地址是否P2PKH，然后计算数量
          outputAmount += output.satoshis
        }
      }
    }
    console.log( inputAmount, outputAmount )
    const income = outputAmount
    const outcome = inputAmount
    // 交易中输入的数据是花费的金额，输出中的金额是地址收到的金额
    return { income, outcome }
  }

  // 计算交易的输入数量，输出数量，费用
  async _calcTransactionIncomeAndOutcome ( transaction ) {
    // 合计输入金额
    const inputs = transaction.inputs
    let inputAmount = 0
    for ( const input of inputs ) {
      if ( input.output ) {
        inputAmount += input.output.satoshis
      } else {
        // 无法计算输入金额， 需要查询input里的txhash和output查询区块链
        console.log( input )
        const prevTxId = input.prevTxId.toString( 'hex' )
        const outputIndex = input.outputIndex
        console.log( prevTxId, outputIndex )

        const prevTxRaw = await this.network.fetchRawTx( prevTxId )
        const prexTx = new bsv.Transaction( prevTxRaw )
        const output = prexTx.outputs[outputIndex]
        inputAmount += output.satoshis
      }
    }
    // 合计输出金额
    const outputs = transaction.outputs
    let outputAmount = 0
    for ( const output of outputs ) {
      outputAmount += output.satoshis
    }
    // 费用金额
    const feeAmount = inputAmount - outputAmount
    console.log( inputAmount, outputAmount, feeAmount )
    return { inputAmount, outputAmount, feeAmount }
  }

  // 构建并发送脚本, 出错则返回false， 成功返回true
  async _buildAndSendTransaction ( outputs ) {
    // 每KB自己的费用，来自服务器设置
    const feePerKb = this._systemSettings.feePerKb

    // 组合文本保存用输出和找零输出
    const transaction = new bsv.Transaction()
    transaction.feePerKb( feePerKb ) // 每K字节500 satoshi
    // 所有的找零都回到钱包地址
    transaction.change( this._walletAddressString )
    for ( const output of outputs ) {
      transaction.addOutput( output )
    }

    // 支付服务费， 服务费等于这笔交易的挖矿费用
    const donationFee = this._calcDonationFee( transaction )
    console.log( feePerKb, this._systemSettings.donationAddress, donationFee )
    transaction.to( this._systemSettings.donationAddress, donationFee )

    // 预估交易费用, 预估挖矿费+服务费
    const feeAmount = transaction.outputAmount + transaction.getFee() + donationFee
    console.debug( feeAmount )
    // 查询钱包余额
    let utxoMaps
    try {
      utxoMaps = await this.network.selectUtxos( [this._walletAddressString], feeAmount )
    } catch ( e ) {
      console.warn( e.message )
      // 系统错误，提示之后再试
      this._notifyError( 'error' )
      return null
    }

    // 构建UTXO
    // 循环所有的utxo，构造bsv utxo
    // 获取输入utxo
    const utxos = []
    const privateKeys = []
    let satoshiTotal = 0
    for ( const [addressStr, utxoList] of utxoMaps ) {
      console.log( addressStr, utxoList )
      for ( const utxo of utxoList ) {
        utxos.push( utxo )
        // FIXME:因为钱包只有一个地址，所以用同样的私钥， 今后需要根据地址获取对应的私钥
        privateKeys.push( this._walletAddress.privateKey )

        satoshiTotal += utxo.satoshis
      }
    }
    console.log( utxos, satoshiTotal )

    transaction.from( utxos )

    // 检查余额，费用，是否有效，避免发送失败
    // 要求费用大于...
    transaction.sign( privateKeys )
    console.log( transaction.toObject() )
    console.log( transaction.getFee() )

    // 检查余额，费用，是否有效，避免发送失败
    // 账号余额不足，无法完成上链
    // 如果不存在找零输出，可以认为余额不足
    // 更精确的计算在得到交易长度后计算
    // if (!transaction.getChangeOutput()) {
    //   console.log( 'NoBalance')
    //   this._notifyError( 'NoBalance' )
    //   return false
    // }

    // 检查交易是否有效, 并且广播
    let transactionHex
    try {
      transactionHex = transaction.serialize( { message: 'Check Transaction' } )
      console.log( transactionHex.length )
      // 需要的最少手续费, HEX长度除以二就是字节长度，字节长度除以1000是长度K，长度K乘以每K费用
      const minFee = Math.ceil( transactionHex.length / 2 / 1000 * ( feePerKb ) )

      // 合计输入金额,输出金额和费用
      const { inputAmount, outputAmount, feeAmount } = await this._calcTransactionIncomeAndOutcome( transaction )
      console.log( minFee, inputAmount, outputAmount, feeAmount - minFee, ( feeAmount - minFee ) >= 0 )
      // 实际费用小于最小所需费用，则余额不足
      if ( feeAmount < minFee ) {
        console.log( 'NoBalance', minFee - feeAmount )
        this._notifyError( 'NoBalance' )//, { insufficiency: minFee - feeAmount } )
        return null
      }
    } catch ( e ) {
      switch ( e.name ) {
        case 'bsv.ErrorTransactionInvalidOutputAmountSum':
          console.log( transaction.getFee(), satoshiTotal, e.message )
          this._notifyError( 'NoBalance' )
          return null
        case 'bsv.ErrorTransactionDustOutputs':
          break
        default:
          break
      }
      console.warn( e )
      if ( e.message ) {
        this._notifyError( e.message )
      }
      return null
    }

    try {
      // 广播
      const txHash = await this.network.broadcast( transactionHex )
      console.trace( txHash ) // 返回的结果就是tx hash
      return { txHash, transactionHex }
      // 输入输出等记录，等待收到通知再计算
    } catch ( e ) {
      console.warn( 'broadcast error', e )

      if ( e && e.name ) {
        switch ( e.name ) {
          case 'bsv.ErrorTransactionInvalidOutputAmountSum':
            console.log( transaction.getFee(), satoshiTotal, e.message )
            this._notifyError( 'NoBalance' )
            return null
          case 'bsv.ErrorTransactionDustOutputs':
            break
          default:
            break
        }
      }
      if ( e && e.message ) {
        // 被服务器拒绝
        if ( e.message.indexOf( 'insufficient priority' ) >= 0 ) {
          this._notifyError( 'NoBalance' )
          return null
        }
        this._notifyError( e.message )
      }
      return null
    }
  }

  // 构建note输出脚本， 将交易放入数据库， 等待下一个始终发送， 返回输出脚本
  async _buildNoteScript ( payload ) {
    // 创建一个新的地址索引，用于创建私钥和公钥
    const addressIndex = newAddressIndex()
    // 通过地址索引派生创建地址
    const addressObject = generateNoteAddress( this._rootHDPrivateKey, addressIndex )
    // 转化note为json字符串
    // 复制note
    const note = Object.assign( {}, payload.note )
    note.idx = parseInt( payload.id ) // 笔记索引编号
    delete note.tx_status
    delete note.status // note中不需要包含status字段
    delete note.draft // note中不需要包含draft字段
    assert.ok( note.tms )
    assert.ok( !note.status )
    const jsonData = JSON.stringify( note )
    // console.debug( jsonData )
    console.log( payload.note, note, addressIndex )

    // TODO:对内容压缩
    // const zipedResult = zlib.gzipSync(jsonData)
    // console.trace('try zip', jsonData.length, zipedResult.length, zipedResult.length / jsonData.length * 100 )

    // 使用公钥加密
    // 使用当前地址的公钥
    // 如果添加私钥加密, 公钥将泄漏在秘文中
    // 但是 如我们在【6.5.4 ECDSA数学】中所看到的，签名生成算法使用随机密钥k作为临时私有公钥对的基础。 k 的值不重要，只要它是随机的。如果使用相同的k值用在不同的消息（交易）上生成两个签名，则任何人都可以计算签名私钥。在签名算法中使用相同的 k 值会导致私钥泄露！
    const encrypedNote = ecies.encrypt( jsonData, addressObject.publicKey ) //, addressObject.privateKey
    console.log( encrypedNote )

    // if ( process.env.NODE_ENV !== 'production' ) {
    //   // 使用当前节点的私钥和根节点的公钥一起解密
    //   const decryptedNote = new IES().privateKey( addressObject.privateKey ).decrypt( encrypedNote )
    //   console.log( decryptedNote, decryptedNote.toString() )
    //   assert.strictEqual( jsonData, decryptedNote.toString(), '' )
    // }

    // 使用根地址私钥对加密数据的sha256进行签名
    const encrypedNoteHash = bsv.crypto.Hash.sha256( encrypedNote )
    const sig = bsv.crypto.ECDSA.sign( encrypedNoteHash, this._rootHDPrivateKey.privateKey )
    console.log( sig.toString( 'hex' ) )

    // if ( process.env.NODE_ENV !== 'production' ) {
    //   // 使用根地址公钥校验签名
    //   const verified = bsv.crypto.ECDSA.verify( encrypedNoteHash, sig, this._rootHDPrivateKey.publicKey )
    //   console.log( verified )
    //   assert.ok( verified )
    // }

    // 构建信息输出用脚本
    // 输出数据的格式
    // op_return 根节点地址 当前索引 加密数据 加密数据的根节点私钥签名
    const index64LE = new Uint64LE( addressIndex )
    const ouputData = [this._rootAddreessString, index64LE.toBuffer(), encrypedNote, sig.toBuffer()]
    const noteScript = bsv.Script.buildSafeDataOut( ouputData )
    const noteScriptHex = noteScript.toHex()
    console.log( noteScript, noteScriptHex )

    // 保存输出用hex, 放入待发送TX数据库， 等待发送
    // note对象id使用 note_index_tms的方式
    const txNoteId = this._buildTxId( note.idx, note.tms )

    note.draft = payload.note.draft || false
    const noteTxRecord = {
      _id: txNoteId,
      index: parseInt( note.idx ),
      draft: note.draft, // 使用复制之前的note，检查draft状态
      tms: note.tms,
      noteScriptHex: noteScriptHex,
      tx_hash: '',
      tx_height: -2,
      tx_status: STATUS.LOCAL, // note在本地数据库
      addressIndex // 地址索引
    }
    console.log( noteTxRecord )

    // 异步更新数据库, 等待发送
    try {
      await this._db.put( noteTxRecord )
    } catch ( e ) {
      // 不应该出现重复一样的记录
      console.warn( e )
      if ( e.message ) {
        this._notifyError( e.message )
      }
      return
    }

    // 检查数据库中note记录，更新状态
    const noteId = this._buildNoteId( note.idx )
    // 保存输出用hex, 放入待发送数据库， 等待发送
    // note对象id使用 note_index的方式，避免pouchdb不认识
    const noteRecord = Object.assign( {
      _id: noteId, // 地址是查询ID， PouchDB根据是keyvalue数据库， 根据id来区分数据
      index: parseInt( note.idx ), // 笔记索引就是笔记的号码
      tms: note.tms,
      draft: note.draft, // 使用复制之前的note，检查draft状态
      noteScriptHex: noteScriptHex,
      tx_hash: '', // 清空txHash
      tx_height: -2, // 高度设置为-2，表示还没在本地
      tx_status: STATUS.LOCAL, // note在本地数据库
      addressIndex, // 地址索引
      sharer: ''
    }, this._appendNoteInfo( note, noteId ) ) // 将含有draft的note字段保存

    console.log( noteRecord )

    let doc
    // 检查本地数据
    try {
      const existDoc = await this._db.get( noteId )
      if ( existDoc.tms > note.tms ) {
        // 本地数据比要提交的数据新， 不应该出现这种情况
        console.log( 'existDoc.tms > note.tms', existDoc.tms, note.tms )

        return
      }

      doc = Object.assign( {}, existDoc, noteRecord )
    } catch ( e ) {
      console.log( e )
      // 本地没有记录， 添加新记录
      doc = noteRecord
    }

    console.log( 'put note record', doc )
    await this._db.put( doc ).then( result => {
    } ).catch( e => {
      console.warn( 'put error', e, doc )
    } )
    // note状态更新， 通知UI
    const notePayload = {
      id: parseInt( note.idx ),
      status: { tx_status: noteRecord.tx_status, addressIndex, sharer: '' }
    }
    console.log( notePayload )
    this.emit( 'note-changed', notePayload )

    if ( !note.draft ) {
      // 异步调用， 处理本地status === STATUS.LOCAL的数据
      if ( !this.broadcastManager.isRunning ) {
        this.broadcastManager.addTask( 'broadcast' )
      }
    }
  }

  // 在手机端额外增加解码后的信息，避免每次解码导致的卡顿
  _appendNoteInfo ( note, noteId ) {
    assert.isTrue( false, 'must impl in child class' )
  }

  // 获取所有未完成的笔记
  async _findUncompleteNotes () {
    assert.isTrue( false, 'must impl in child class' )
  }

  // 检查未发送的交易记录
  async _broadcastUncompleteNote () {
    // 检索数据库， 获取所有status === STATUS.LOCAL的数据， 尝试顺序广播
    // 将待广播交易放入等待池，允许离线广播
    try {
      const docs = await this._findUncompleteNotes()

      // 发送每一个未完成的记录
      for ( const noteTxRecord of docs ) {
        // 从hex构建Script对象
        const noteScript = bsv.Script.fromHex( noteTxRecord.noteScriptHex )
        // 构建输出
        const noteOutput = new bsv.Transaction.Output( {
          satoshis: 0,
          script: noteScript
        } )

        // 发送
        const result = await this._buildAndSendTransaction( [noteOutput] )

        if ( !result ) {
          // 发送没成功， 等待下一次再发
          break
        }

        console.log( 'broadcas', result )

        // tx hash可能被重组，而改变， 从区块链返回数据后， 要重置txhash
        // 更新数据库，交易已经发送
        noteTxRecord.tx_status = STATUS.SENT // note已经发送到区块链
        noteTxRecord.tx_hash = result.txHash
        noteTxRecord.updated = Date.now() // 最后状态变化的更新时间

        const txRecord = {}

        // 保存交易记录
        txRecord._id = result.txHash
        txRecord.tx_hash = result.txHash
        txRecord.raw = result.transactionHex
        txRecord.time = noteTxRecord.updated | Date.now()

        // 异步更新数据库
        await this._createOrUpdateDB( txRecord ).then( result => {
          console.log( result )
        } ).catch( e => {
          console.warn( e )
          if ( e.status === 404 ) { return }
          if ( e.message ) {
            this._notifyError( e.message )
          }
        } )

        console.log( noteTxRecord )
        // 异步更新数据库
        await this._createOrUpdateDB( noteTxRecord ).then( result => {
          console.log( result )
        } ).catch( e => {
          console.warn( e )
          if ( e.status === 404 ) { return }
          if ( e.message ) {
            this._notifyError( e.message )
          }
        } )

        // 检查数据库中note记录，更新状态
        const noteId = this._buildNoteId( noteTxRecord.index )
        // 检查本地数据
        try {
          const existDoc = await this._db.get( noteId )
          if ( existDoc.tms > noteTxRecord.tms ) {
            // 本地数据比要提交的数据更新， 不应该出现这种情况
            continue
          }

          existDoc.tx_status = noteTxRecord.tx_status
          existDoc.tx_hash = noteTxRecord.tx_hash

          await this._db.put( existDoc ).then( result => {
          } )
          // note状态更新， 通知UI
          const notePayload = {
            id: parseInt( existDoc.index ),
            status: {
              tx_status: existDoc.tx_status,
              tx_hash: existDoc.tx_hash
            }
          }
          console.log( notePayload )

          this.emit( 'note-changed', notePayload )
        } catch ( e ) {
          console.log( e )
        }
      }
    } catch ( err ) {
      console.log( 'uncomplete', err )
    }
  }

  // 检查未发送的交易记录
  // _broadcastUnreceivedNote () {
  //   // 检索数据库， 获取所有status === STATUS.SENT的数据， 尝试重新发送
  //   this._db.find({
  //     selector: { tx_status: STATUS.SENT, draft: false }
  //   }).then(async (result) => {
  //     // handle result
  //     console.log('Sent & Unreceived notes', result.length)
  //     // 发送每一个未完成的记录
  //     for (const noteTxRecord of result.docs) {
  //       // console.log(noteTxRecord)
  //       // 更新每一条记录的状态为LOCAL，等待下一次发送
  //       noteTxRecord.tx_status = STATUS.LOCAL
  //       noteTxRecord.updated = Date.now() // 最后状态变化的更新时间
  //       // 更新数据库
  //       await this._createOrUpdateDB( noteTxRecord ).then(result => {
  //         console.log(result)
  //       }).catch(e => {
  //         console.log(e)
  //       })
  //     }
  //   }).catch((err) => {
  //     console.log(err)
  //   })
  // }

  // 使用根HD公钥获取账号设置
  async _checkAccountSettings () {
    return this.backService
      .checkAccount( this._rootHDPublicKey.toString() )
      .then( result => {
        console.log( result )
        this._systemSettings = Object.assign( {}, config.systemSettings, result )
        // 通知系统设置
        this.emit( 'system-settings', this._systemSettings )
      } )
      .catch( error => {
        if ( error.response ) {
          // 服务器返回错误
          console.warn( error.response.data )
          console.warn( error.response.status )
          console.warn( error.response.headers )
        } else if ( error.request ) {
          // 服务器连不上
          console.warn( error.message )
        } else {
          // 返回200，API返回详细错误信息
          console.warn( 'Error', error )
        }
      } )
  }
}

export {
  Note,
  STATUS
}
