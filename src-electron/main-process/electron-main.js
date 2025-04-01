import { app, BrowserWindow, nativeTheme, ipcMain, shell, dialog, Menu, crashReporter, nativeImage, Tray } from 'electron'
import contextMenu from './electron-context-menu'
import isDev from 'electron-is-dev'

import Store from 'electron-store'

import { autoUpdater } from 'electron-updater'

import path from 'path'

import config from '../../config'
const console = config.console

import * as platform from './platform'

import {
  newId
} from '../../lib/address'

import { i18n } from './i18n'
import Wallet from './wallet'

// Deep linked url
let deeplinkingUrl

// 出错信息捕捉
// 'http://localhost/v1/crash-report', //
crashReporter.start({
  productName: 'NOTE.SV',
  companyName: 'ChainBow Co. Ltd.',
  submitURL: 'https://submit.backtrace.io/notesv/d100b7e7b814f59be9d56084e66103d38c77f5eeb1d9bd2bd13f5d266368591d/minidump',
  uploadToServer: true,
  compress: true
})
// 不期望的Javascript
import unhandled from 'electron-unhandled'
unhandled({
  showDialog: false,
  logger: console.error
}
)

try {
  if ( platform.isWindows() && nativeTheme.shouldUseDarkColors === true ) {
    require( 'fs' ).unlinkSync( path.join( app.getPath( 'userData' ), 'DevTools Extensions' ) )
  }
} catch ( _ ) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if ( process.env.PROD ) {
  global.__statics = path.join( __dirname, 'statics' ).replace( /\\/g, '\\\\' )
}

let mainWindow
// 只允许一个实例
const gotTheLock = app.requestSingleInstanceLock()
if ( !gotTheLock ) {
  app.quit()
}

// 托盘全局变量
let tray

// 创建存储实例
const store = new Store()
// 钱包实例
// 在mac上将在/Users/lilong/Library/Application Support/MetaNote文件夹保存数据
const appDataFolder = app.getPath( 'appData' )
const wallet = new Wallet( appDataFolder )

console.log('process.argv', process.argv)

async function createWindow () {
  const iconPath = path.resolve(
    __dirname,
    '../icons',
    platform.isWindows() ? 'icon.ico' : platform.isMac() ? 'icon.icns' : 'linux-512x512.png'
  )

  const options = {
    icon: iconPath,
    width: 640,
    height: 800,
    useContentSize: true,
    webPreferences: {
      nativeWindowOpen: true,
      // Change from /quasar.conf.js > electron > nodeIntegration;
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: true, // QUASAR_NODE_INTEGRATION,
      devTools: !process.env.PROD,

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')

      enableRemoteModule: true
    },
    title: 'NOTE.SV'
    // frame: false
    // titleBarStyle: 'default'
  }

  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow( options )

  // 检查是否隐藏窗口
  // let hidden = false
  // if (platform.isMac()) {
  //   const loginSettings = app.getLoginItemSettings()
  //   hidden = loginSettings.wasOpenedAsHidden
  // } else {
  //   hidden = /hidden/.test(process.argv)
  // }
  // if (hidden) {
  //   mainWindow.hide()
  // }

  await mainWindow.loadURL( process.env.APP_URL )
  // Protocol handler for win32
  if (platform.isWindows()) {
  // Keep only command line / deep linked arguments
    deeplinkingUrl = process.argv.slice(1)
  }
  logEverywhere('createWindow# ' + deeplinkingUrl)

  mainWindow.on( 'closed', () => {
    mainWindow = null
  } )

  mainWindow.webContents.on( 'did-finish-load', async () => {

  } )

  mainWindow.webContents.on('new-window', (event, url) => {
    console.log(url)
    if (config.whitelist.test(url)) {
      // 白名单

    } else {
      // 其它缺省打开系统浏览器
      event.preventDefault()

      shell.openExternal(url)
    }
  })

  // 检查是否有安装协议
  // protocol.isProtocolHandled('mx://').then(result => {
  //   console.debug(result)
  // })
  // protocol.isProtocolHandled('http://').then(result => {
  //   console.debug(result)
  // })
  // protocol.isProtocolHandled('https://').then(result => {
  //   console.debug(result)
  // })
  // protocol.isProtocolHandled('file://').then(result => {
  //   console.debug(result)
  // })
  // protocol.isProtocolHandled('notesv://').then(result => {
  //   console.debug(result)
  // })
  // protocol.isProtocolHandled('chrome://').then(result => {
  //   console.debug(result)
  // })

  const settings = store.get('settings')
  console.debug(settings)
  if (settings && settings.userSettings) {
    let autoLaunch = true
    if ( undefined !== settings.userSettings.autoLaunch) {
      autoLaunch = settings.userSettings.autoLaunch
    }
    setAutoLaunch(autoLaunch)

    mainWindow.setSkipTaskbar(false)
    if (platform.isMac()) {
      app.dock.show()
    }
  }

  mainWindow.on('close', (event) => {
    const settings = store.get('settings')
    console.debug(settings)
    let autoLaunch = true
    if ( undefined !== settings.userSettings.autoLaunch) {
      autoLaunch = settings.userSettings.autoLaunch
    }
    if (autoLaunch) {
      mainWindow.hide()
      mainWindow.setSkipTaskbar(true)
      if (!platform.isMac()) {
        event.preventDefault()
      } else {
        app.dock.hide()
      }
    }
  })
}

// 缺省ShowWin参数未定义
app.on( 'ready', createWindow )

app.on( 'window-all-closed', () => {
  logEverywhere('window-all-closed')

  if ( process.platform !== 'darwin' ) {
    const settings = store.get('settings')
    console.debug(settings)
    let autoLaunch = true
    if ( undefined !== settings.userSettings.autoLaunch) {
      autoLaunch = settings.userSettings.autoLaunch
    }
    if (!autoLaunch) {
      app.quit()
    }
  }
} )

app.on( 'activate', () => {
  if ( mainWindow === null ) {
    createWindow()
  }
} )

app.on( 'second-instance', ( event, commandLine, workingDirectory ) => {
  if (process.platform === 'win32') {
    // Keep only command line / deep linked arguments
    deeplinkingUrl = commandLine.slice(1)
  }
  logEverywhere('app.makeSingleInstance# ' + deeplinkingUrl)
  // Someone tried to run a second instance, we should focus our window.
  restoreWindow()
} )

// 右键快捷菜单
contextMenu({
  showSaveImageAs: true
})

// Define custom protocol handler.
// Deep linking works on packaged versions of the application!
app.setAsDefaultProtocolClient('notesv')

// Protocol handler for osx
app.on('open-url', function (event, url) {
  event.preventDefault()
  deeplinkingUrl = url
  logEverywhere('open-url# ' + deeplinkingUrl)
  restoreWindow()
})

function restoreWindow () {
  if ( mainWindow ) {
    mainWindow.show()
    if ( mainWindow.isMinimized() ) mainWindow.restore()
    mainWindow.focus()
    mainWindow.setSkipTaskbar(false)
    if (platform.isMac()) {
      app.dock.show()
    }
  } else {
    createWindow()
  }
}

// Log both at dev console and at running node console instance
function logEverywhere (s) {
  console.log(s)
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`console.log("${s}")`)
  }
}

// 自动更新
// const server = config.updateServer
// const appVersion = require('../../package.json').version
// const feed = `${server}/update/${process.platform}/v${appVersion}`
// console.debug(feed)

function sendMessageToUI (event, message) {
  try {
    if ( mainWindow && mainWindow.webContents ) {
      mainWindow.webContents.send(event, message)
    }
  } catch (e) {
    // 发送消息是可能因为前台UI已经被释放而出错
    console.error(e)
  }
}

function sendStatusToWindow (text) {
  sendMessageToUI('message', text)
}
function sendErrorMsgToWindow (text) {
  if ( text ) {
    sendMessageToUI('error', text)
  }
}

if (isDev) {
  console.log('Running in development')
} else {
  console.log('Running in production')

  autoUpdater.setFeedURL(config.updateFeed)

  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('checking-for-update')
  })
  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('update-available')
  })
  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('update-not-available')
  })

  // autoUpdater.on('download-progress', (progressObj) => {
  //   let logMessage = 'Download speed: ' + progressObj.bytesPerSecond
  //   logMessage = logMessage + ' - Downloaded ' + progressObj.percent + '%'
  //   logMessage = logMessage + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
  //   sendStatusToWindow(logMessage)
  // })

  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    console.debug(event, releaseNotes, releaseName)
    sendStatusToWindow('update-downloaded')

    const dialogOpts = {
      type: 'info',
      buttons: [i18n.t('Restart'), i18n.t('Later')],
      title: i18n.t('UpdateTitle'),
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail: i18n.t('UpdateMessage')
    }

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        setAutoLaunch(false)
        autoUpdater.quitAndInstall()
      }
    })
  })

  autoUpdater.on('error', message => {
    console.error(message)
    // if (message && message !== 'undefined') {
    sendErrorMsgToWindow('update-error')
    // }
  })

  // 一分钟之后检查是否有更新， 只检查这一次
  setTimeout(() => {
    autoUpdater.checkForUpdates()
  }, 60000)
}

// 初始化菜单
const initMenu = (lang) => {
  i18n.locale = lang

  const template = [
    // { role: 'appMenu' },
    ...(platform.isMac() ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: i18n.t('File'),
      submenu: [
        {
          label: i18n.t('Check for Updates'),
          click: () => {
            autoUpdater.checkForUpdates()
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    // { role: 'editMenu' },
    {
      label: i18n.t('Edit'),
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(platform.isMac() ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'windowMenu' }
    {
      label: i18n.t('Window'),
      submenu: [
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'zoom' },
        ...(platform.isMac() ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      label: i18n.t('Help'),
      submenu: [
        {
          label: i18n.t('Learn More'),
          click: async () => {
            await shell.openExternal('https://note.sv')
          }
        }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

initMenu(i18n.defaultLocale)

function setAutoLaunch (flag) {
  // 设置为自动启动
  app.setLoginItemSettings({
    openAtLogin: flag,
    openAsHidden: true,
    args: [
      '--hidden'
    ]
  })
  if (flag) {
    let iconName
    if (isDev) {
      iconName = '../../public/tray.png'
    } else {
      iconName = platform.isMac() ? './tray.png' : './icon.png'
    }
    const iconPath = path.join(__dirname, iconName)

    const trayImage = nativeImage.createFromPath(iconPath).resize({
      width: 20,
      height: 20
    })
    trayImage.isMacTemplateImage = true

    if (!tray) {
      tray = new Tray(trayImage)
    }
    tray.setToolTip('NOTE.SV')

    const contextMenu = Menu.buildFromTemplate([
    // { label: '新建一个密码', click: function () { } },
    // { label: '新建一个笔记', click: function () {} },
    // { type: 'separator' },
      {
        label: i18n.t('Open'),
        click: function () {
          restoreWindow()
        }
      },
      { type: 'separator' },
      {
        label: i18n.t('Quit'),
        click: function () {
          app.exit()
        }
      }
    ])
    if (platform.isLinux()) {
      // Call this again for Linux because we modified the context menu
      tray.setContextMenu(contextMenu)
    }

    tray.on('click', () => { // 我们这里模拟桌面程序点击通知区图标实现打开关闭应用的功能
      restoreWindow()
    })
    tray.on('right-click', () => {
      tray.popUpContextMenu(contextMenu)
    })
  } else if (tray) {
    try {
      tray.destroy()
    } catch (e) {
      console.warn(e)
    }

    tray = null
  }
}

ipcMain.on( 'language', async ( event, lang ) => {
  // 语言切换
  initMenu(lang)
} )

ipcMain.on( 'save-seed-string', async ( event, args ) => {
  // console.log( 'save-seed-string', args )
  const { seedString, password, walletPath, lang } = args
  event.returnValue = await wallet.saveWallet( seedString, password, walletPath, lang )
} )

ipcMain.on( 'fetch-seed', async ( event, args ) => {
  // console.log( 'fetchSeed', args )
  event.returnValue = await wallet.fetchSeed( args )
} )

ipcMain.on( 'check-account', async ( event, args ) => {
  // console.log('check-account', args)
  event.returnValue = await wallet.checkAccount()
} )

ipcMain.on( 'login-with-password', async ( event, password ) => {
  // console.log( 'loginWithPassword', password )
  event.returnValue = await wallet.loginWithPassword( password )
} )

ipcMain.on( 'remove-account', async ( event, args ) => {
  // console.log( 'removeAccount', args )
  event.returnValue = await wallet.removeAccount( args )
} )

// ipcMain.on( 'current-address-string', async ( event, args ) => {
//   event.returnValue = wallet.currentAddress.addressString
// } )
// 返回一个新的编号， 画面端使用新的id构建note
ipcMain.on( 'new-id', async ( event, args ) => {
  event.returnValue = newId()
} )

// 获取某一个交易id的笔记
ipcMain.on( 'get-note-tx-by-id', async ( event, args ) => {
  const noteTxId = args
  event.returnValue = await wallet.getNoteTxById(noteTxId)
} )

// 获取某一个id的笔记
ipcMain.on( 'get-note-by-id', async ( event, args ) => {
  const id = args
  event.returnValue = await wallet.getNoteById(id)
} )

// 获取某一个id的历史记录
ipcMain.on( 'get-histories-by-id', async ( event, args ) => {
  const id = args
  event.returnValue = await wallet.getHistoriesById(id)
} )

// 获取所有本删除的历史记录
ipcMain.on( 'get-deleted-notes', async ( event, args ) => {
  event.returnValue = await wallet.getDeletedNotes()
} )

// 异步调用，更新一个note
ipcMain.on( 'update-note', async ( event, payload ) => {
  console.log( 'updateNote', payload )
  // event.returnValue = await wallet.updateNote( payload )
  const result = await wallet.updateNote( payload )
  // console.log(result)
  event.reply('update-note-reply', result)
} )
// 异步调用，删除一个note
ipcMain.on( 'delete-note', async ( event, payload ) => {
  console.log( 'deleteNote', payload )
  // event.returnValue = await wallet.deleteNote( payload )
  const result = await wallet.deleteNote( payload )
  // console.log(result)
  event.reply('update-note-reply', result)
} )

// 异步调用, 分享笔记
ipcMain.on( 'share-note', async ( event, payload ) => {
  console.log( 'shareNote', payload )
  const result = await wallet.shareNote( payload )
  // console.log(result)
  event.reply('share-note-reply', result)
} )

// 返回钱包地址
ipcMain.on( 'wallet-address', async ( event, payload ) => {
  event.returnValue = wallet.walletAddressString()
} )

// 余额查询
ipcMain.on( 'wallet-balance', async ( event, args ) => {
  event.returnValue = wallet.walletBalance()
} )

// 全额提现
ipcMain.on( 'withdraw-all', async ( event, address ) => {
  event.returnValue = await wallet.withdrawAllTo(address)
} )

// 获取本地所有的notes
ipcMain.on( 'fecth-all-notes', async ( event ) => {
  // event.returnValue =
  await wallet.fetchAllNotes()
} )

// 自动运行
ipcMain.on( 'autoLaunch', async ( event, args ) => {
  const autoLaunch = !!args
  // 设置自动启动开关
  setAutoLaunch(autoLaunch)
} )

//
// 余额变化通知
wallet.on( 'wallet-balance', ( balance ) => {
  sendMessageToUI('wallet-balance', balance)
} )

// 出错信息通知
wallet.on( 'error', async ( errorMessage ) => {
  sendErrorMsgToWindow(errorMessage)
} )

wallet.on( 'message', async ( message ) => {
  sendStatusToWindow(message)
} )

wallet.on( 'note-changed', ( payload ) => {
  sendMessageToUI('note-changed', payload)
} )

wallet.on( 'tx-changed', ( payload ) => {
  sendMessageToUI('tx-changed', payload)
} )

// 系统设置通知
wallet.on( 'system-settings', ( settings ) => {
  sendMessageToUI('system-settings', settings)
} )
