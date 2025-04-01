import config from '../../config'
const console = config.console

console.log(process.argv, process.env)

import Wallet from './wallet'
const cordova = require('cordova-bridge')

import {
  newId
} from '../../lib/address'

import {
  getSettings
} from './utils'

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if ( process.env.PROD ) {
  global.__statics = require( 'path' ).join( __dirname, 'statics' ).replace( /\\/g, '\\\\' )
}

// 钱包实例
const wallet = new Wallet()

const ipcMain = cordova.channel

var start, end

cordova.app.on('pause', (pauseLock) => {
  pauseLock.release()
  start = Date.now()
  console.debug('[node] app paused.', start)
})

cordova.app.on('resume', async () => {
  end = Date.now()
  console.debug('[node] app resumed.', start, end)
  const settings = await getSettings()
  console.log('settings', settings.locktime)
  if (end - start > settings.locktime) {
    ipcMain.post('lock-screen', null)
  }
})

ipcMain.on( 'save-seed-string', async ( args ) => {
  console.log( 'save-seed-string', args )
  const { seedString, password, walletPath, lang } = args
  ipcMain.post('save-seed-string', await wallet.saveWallet( seedString, password, walletPath, lang ))
} )

ipcMain.on( 'language', async ( event, lang ) => {
  // 语言切换
  console.log(event, lang)
} )

ipcMain.on( 'fetch-seed', async ( args ) => {
  console.log( 'fetchSeed', args )
  ipcMain.post('fetch-seed', await wallet.fetchSeed( args ))
} )

ipcMain.on( 'login-with-password', async ( password ) => {
  console.log( 'login-with-password', password )
  ipcMain.post('login-with-password', await wallet.loginWithPassword( password ))
} )

ipcMain.on( 'remove-account', async ( args ) => {
  console.log( 'remove-account', args )
  ipcMain.post('remove-account', await wallet.removeAccount( args ))
} )

// 返回一个新的编号， 画面端使用新的id构建note
ipcMain.on( 'new-id', async ( ) => {
  ipcMain.post('new-id', newId())
} )

// 获取某一个交易id的笔记
ipcMain.on( 'get-note-tx-by-id', async ( noteTxId ) => {
  ipcMain.post('get-note-tx-by-id', await wallet.getNoteTxById(noteTxId))
} )

// 获取某一个id的笔记
ipcMain.on( 'get-note-by-id', async ( id ) => {
  ipcMain.post('get-note-by-id', await wallet.getNoteById(id))
} )

// 获取某一个id的历史记录
ipcMain.on( 'get-histories-by-id', async ( id ) => {
  ipcMain.post('get-histories-by-id', await wallet.getHistoriesById(id))
} )

// 获取所有本删除的历史记录
ipcMain.on( 'get-deleted-notes', async ( ) => {
  ipcMain.post('get-deleted-notes', await wallet.getDeletedNotes())
} )

// 异步调用，更新一个note
ipcMain.on( 'update-note', async ( payload ) => {
  console.log( 'update-note', payload )
  const result = await wallet.updateNote( payload )
  console.log('update-note', result)
} )
// 异步调用，删除一个note
ipcMain.on( 'delete-note', async ( payload ) => {
  console.log( 'delete-note', payload )
  const result = await wallet.deleteNote( payload )
  console.log('delete-note', result)
} )

// 异步调用, 分享笔记
ipcMain.on( 'share-note', async ( payload ) => {
  console.debug( 'shareNote', payload )
  const result = await wallet.shareNote( payload )
  console.log(result)
} )

// 返回钱包地址
ipcMain.on( 'wallet-address', async ( payload ) => {
  ipcMain.post('wallet-address', wallet.walletAddressString())
} )

// 余额查询
ipcMain.on( 'wallet-balance', async ( args ) => {
  ipcMain.post('wallet-balance', wallet.walletBalance())
} )

// 全额提现
ipcMain.on( 'withdraw-all', async ( address ) => {
  ipcMain.post('withdraw-all', await wallet.withdrawAllTo(address))
} )

// 余额变化通知
wallet.on( 'wallet-balance', ( balance ) => {
  ipcMain.post('wallet-balance', balance)
} )

// 出错信息通知
wallet.on( 'error', async ( errorMessage ) => {
  ipcMain.post('error', errorMessage)
} )

wallet.on( 'message', async ( message ) => {
  ipcMain.post('message', message)
} )

wallet.on( 'note-changed', ( payload ) => {
  ipcMain.post('note-changed', payload)
} )

wallet.on( 'tx-changed', ( payload ) => {
  ipcMain.post('tx-changed', payload)
} )

// 系统设置通知
wallet.on( 'system-settings', ( settings ) => {
  console.debug(settings)
  ipcMain.post('system-settings', settings)
} )
