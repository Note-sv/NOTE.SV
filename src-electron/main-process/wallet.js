// Wallet， 用于维护账号余额以及每个地址的公私钥

import config from '../../config'
const console = config.console

import { Note, STATUS } from '../../lib/note'

import PouchDB from 'pouchdb'
PouchDB.plugin(require('pouchdb-find'))

// 钱包类
class Wallet extends Note {
  // 初始化钱包
  constructor (appDataFolder ) {
    // 支持事件触发

    // 创建数据库， 自动压缩去掉历史数据
    const appDataFilePath = `${appDataFolder}/${config.appName}/Data`
    console.log( appDataFilePath )
    const db = new PouchDB( appDataFilePath, { auto_compaction: true } )
    // 对未发送交易状态建立索引
    db.createIndex({
      index: {
        fields: ['tx_status', 'tx_hash']
      }
    }).catch(e => {
      console.error(e)
    })

    super(db)
  }

  // 获取本地所有的notes
  async _findAllNotes () {
    // 查询数据库， 所有note开始的id
    // 检索note开头的id，获取所有最新的note
    return this._db.find({
      selector: { _id: { $regex: /^note_/ } }
    }).then(result => {
      return result.docs
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
      return await this.noteToFront(noteTXRecord)
    } catch (e) {
      console.log(e)
      return null
    }
  }

  // 获取所有的指定id的所有历史记录
  async getHistoriesById (id) {
    try {
      const regex = new RegExp(`^tx_${id}`)
      // 检索note开头的id，获取所有最新的note
      const result = await this._db.find({
        selector: { _id: { $regex: regex } },
        fields: ['_id', 'index', 'tx_status', 'tx_height', 'tms', 'tx_hash', 'addressIndex', 'sharer'],
        sort: ['_id']
      })
      return result.docs
    } catch (e) {
      console.error(e)
      return []
    }
  }

  // 检索数据库获取所有已删除笔记
  async _findDeletedNotes () {
    // 检索note开头的id，获取所有最新的note
    return this._db.find({
      selector: { _id: { $regex: /^note_/ }, del: true }
    }).then(result => {
      return result.docs
    })
  }

  async _findNotesByTxHash (tx_hash) {
    return this._db.find({
      selector: { _id: { $regex: /^note_/ }, tx_hash: tx_hash },
      fields: ['_id', 'tx_status']
    }).then(async (result) => {
      // handle result
      const records = result.docs
      return records
    })
  }

  // 获取拥有指定txhash的tx记录
  async _findNoteTxsByTxHash (recordId) {
    return this._db.find({
      selector: { _id: { $regex: /^tx_/ }, tx_hash: recordId },
      fields: ['_id', 'tx_status']
    }).then(async (result) => {
      // handle result
      const records = result.docs
      return records
    })
  }

  // 查找指定id的最新记录
  async _findLatestTxById (id) {
    const regex = new RegExp(`^tx_${id}`)
    // 检索note开头的id，获取所有最新的note
    const result = await this._db.find({
      selector: { _id: { $regex: regex } },
      sort: [{ _id: 'desc' }] // 倒序，第一个就是最新的记录
    })
    if (result.docs.length === 0) return null
    for (let i = 0; i < result.docs.length; i++) {
      // 第一个没有分享对象的笔记是最新笔记
      const noteTxRecord = result.docs[i]
      if (noteTxRecord.addressIndex === 0 || !noteTxRecord.sharer) {
        return noteTxRecord
      }
    }
    return null
  }

  // 桌面版不需要增加任何东西
  _appendNoteInfo (note, noteId) {
    return { }
  }

  // 删除指定id未广播的笔记
  async _clearUncompleteNoteById (id) {
    try {
      const regex = new RegExp(`^tx_${id}`)
      // 检索note开头的id，获取所有最新的note
      const result = await this._db.find({
        selector: { _id: { $regex: regex }, tx_status: STATUS.LOCAL }
      })
      console.debug('_clearUncompleteNoteById', result.docs)
      for (const record of result.docs) {
        await this._db.remove(record)
      }

      return true
    } catch (e) {
      console.log(e)
      return false
    }
  }

  // 获取所有未完成的笔记
  async _findUncompleteNotes () {
    const regex = new RegExp('^tx_')

    return await this._db.find({
      selector: { _id: { $regex: regex }, tx_status: STATUS.LOCAL, draft: false }
    }).then(async (result) => {
      return result.docs
    })
  }
}

export default Wallet
