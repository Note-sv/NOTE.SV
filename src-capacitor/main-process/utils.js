const cordova = require('cordova-bridge')

function getSettings () {
  cordova.channel.post('settings', null)

  return new Promise( (resolve, reject) => {
    cordova.channel.once('settings', ( data ) => {
      if (data != null) {
        resolve(data.userSettings)
      } else {
        reject({ status: 404, message: 'get error' })
      }
    })
  })
}
export {
  getSettings
}
