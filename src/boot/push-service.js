/**
 * 手机端Capacitor用通知服务
 */

import { Plugins } from '@capacitor/core'
const { PushNotifications } = Plugins
import config from '../config'
const console = config.console

export default ( { app, store, Vue } ) => {
  class PushService {
    constructor () {
      console.log( 'Push Service' )
    }

    pushRegister () {
      console.log( 'Initializing Register' )

      // Register with Apple / Google to receive push via APNS/FCM
      PushNotifications.register()

      // On success, we should be able to receive notifications
      PushNotifications.addListener(
        'registration',
        ( token ) => {
        // PushNotificationToken
          console.log( 'Push registration success, token: ' + token.value )
          // 将Token Value保存入Settings，进而发给服务器
          store.dispatch( 'settings/setPushToken', token.value )
        }
      )

      // Some issue with our setup and push will not work
      PushNotifications.addListener( 'registrationError', ( error ) => {
        console.log( 'Error on registration: ' + JSON.stringify( error ) )
      // 注册通知失败，什么也不做
      } )

      // もしアプリが開いてる状態で通知を受け取ったら
      PushNotifications.addListener(
        'pushNotificationReceived',
        ( notification ) => {
        // PushNotification
          console.log( 'Push received: ' + JSON.stringify( notification ) )
          // Push received: {"id":"0:1591888633917883%8049733280497332","data":{},"title":"Hello NoteSV","body":"就看看是否牛逼"}
        }
      )

      // 通知がタップされた時に発動する
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        ( notification ) => {
        // PushNotificationActionPerformed
          console.log( 'Push action performed: ' + JSON.stringify( notification ) )
          // Push action performed: {"actionId":"tap","notification":{"id":"0:1591888846723107%8049733280497332","data":{"google.delivered_priority":"high","google.sent_time":"1591888846719","google.ttl":"2419200","google.original_priority":"high","from":"104384219408","collapse_key":"io.chainbow.notesv"}}}
        }
      )
    }
  }
  // 创建实例，注册推送服务
  const pushService = new PushService()
  pushService.pushRegister()
}
