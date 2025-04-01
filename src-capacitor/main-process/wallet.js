// Wallet， 用于维护账号余额以及每个地址的公私钥

import config from '../../config'
const console = config.console

import { Note, STATUS } from '../../lib/note'

import RealmDB from './realmdb'

// 钱包类
class Wallet extends Note {
  // 初始化钱包
  constructor ( ) {
    // 支持事件触发

    // 创建数据库
    const db = new RealmDB()

    super(db)
  }

  // 删除账号
  async removeAccount () {
    try {
      // 删除数据库
      await this._db.removeDB()

      await this.network.unsubscribeAllAddress()
    } catch ( e ) {
      console.error( e )

      // TODO:删除失败的处理
      if ( e.message ) {
        this._notifyError( e.message )
      }
    }

    this._initObjectMembers()
    return true
  }

  // 获取本地所有的notes
  async _findAllNotes () {
    // 查询数据库， 所有note开始的id
    // 检索note开头的id，获取所有最新的note
    return this._db.find({
      selector: { _id: 'note_' }
    })
  }

  // 检索数据库获取所有已删除笔记
  async _findDeletedNotes () {
    // 检索note开头的id，获取所有最新的note
    return this._db.find({
      selector: { _id: 'note_', del: true }
    })
  }

  /**
   * 获取指定交易id的笔记， 从交易记录中获取
   * @param {*} noteTxId
   */
  async getNoteTxById (noteTxId) {
    try {
      // 检索note开头的id，获取所有最新的note
      const noteTXRecord = await this._db.get( noteTxId )
      console.debug(noteTXRecord)
      return await this.noteToFront(noteTXRecord)
    } catch (e) {
      console.log(e)
      return null
    }
  }

  async getHistoriesById (id) {
    try {
      // 检索note开头的id，获取所有最新的note
      const result = await this._db.find({
        selector: { _id: `tx_${id}` },
        fields: ['_id', 'index', 'tx_status', 'tx_height', 'tms', 'tx_hash', 'addressIndex', 'sharer'],
        sort: ['_id']
      })
      console.debug(result)
      return result
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async _findNotesByTxHash (tx_hash) {
    return this._db.find({ selector: { _id: 'note_' }, tx_hash: tx_hash }
    )
  }

  async _findNoteTxsByTxHash (recordId) {
    return this._db.find({
      selector: { _id: 'tx_' }, tx_hash: recordId
    })
  }

  // 查找指定id的最新记录
  async _findLatestTxById (id) {
    // 检索note开头的id，获取所有最新的note
    const result = await this._db.find({
      selector: { _id: `tx_${id}` },
      sort: ['_id'] // 倒序，最后一条最新的记录
    })
    if (result.length === 0) return null
    for (let i = result.length - 1; i >= 0; i--) {
      // 第一个没有分享对象的笔记是最新笔记
      const noteTxRecord = result[i]
      if (noteTxRecord.addressIndex === 0 || !noteTxRecord.sharer) {
        return noteTxRecord
      }
    }
    return null
  }

  // 手机版额外增加解密后的笔记
  _appendNoteInfo (note, noteId) {
    return { decryptedNote: JSON.stringify( Object.assign({}, note, { _id: noteId })) }
  }

  // 删除指定id未广播的笔记
  async _clearUncompleteNoteById (id) {
    try {
      // 检索note开头的id，获取所有最新的note
      const result = await this._db.find({
        selector: { _id: `tx_${id}`, tx_status: STATUS.LOCAL }
      })
      console.debug(result)
      for (const record of result) {
        const result = await this._db.remove(record)
        console.debug(result)
      }

      return true
    } catch (e) {
      console.debug(e)
      return false
    }
  }

  // 获取所有未完成的笔记
  async _findUncompleteNotes () {
    // 检索笔记交易记录
    return this._db.find({
      selector: { tx_status: STATUS.LOCAL, draft: false }
    }).then(async (result) => {
      return result
    })
  }
}

export default Wallet
