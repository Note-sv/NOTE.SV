// import config from '../../config'
// const console = config.console
const cordova = require('cordova-bridge')

// const AsyncLock = require('async-lock')
// const lock = new AsyncLock()

const REALM_GET = 'realm-get'
const REALM_PUT = 'realm-put'
const REALM_FIND = 'realm-find'
const REALM_REMOVE = 'realm-remove'

class RealmDB {
  constructor () {
    this.getCounter = 0
    this.putCounter = 0
    this.findCounter = 0
    this.removeCounter = 0
  }

  get (_id) {
    const realmDB = this
    let eventStuck = 0
    eventStuck = realmDB.getCounter++

    // lock.acquire(REALM_GET, function (done) {
    //   eventStuck = realmDB.getCounter++
    //   done()
    // })

    cordova.db.post(`${REALM_GET}${eventStuck}`, _id)

    return new Promise( (resolve, reject) => {
      cordova.db.once(`${REALM_GET}${eventStuck}`, ( data ) => {
        if (data != null) {
          resolve(data)
        } else {
          reject({ status: 404, message: 'get error' })
        }
      })
    })
  }

  put (data) {
    const realmDB = this
    let eventStuck = 0
    eventStuck = realmDB.putCounter++

    // lock.acquire(REALM_PUT, function (done) {
    //   eventStuck = realmDB.putCounter++
    //   done()
    // })

    cordova.db.post(`${REALM_PUT}${eventStuck}`, data)

    return new Promise( (resolve, reject) => {
      cordova.db.once(`${REALM_PUT}${eventStuck}`, (data) => {
        if (data != null) {
          resolve(data)
        } else {
          reject({ status: 404, message: 'put error' })
        }
      })
    })
  }

  find (data) {
    const realmDB = this
    let eventStuck = 0
    eventStuck = realmDB.findCounter++

    // lock.acquire(REALM_FIND, function (done) {
    //   eventStuck = realmDB.findCounter++
    //   done()
    // })

    cordova.db.post(`${REALM_FIND}${eventStuck}`, data)

    return new Promise( (resolve, reject) => {
      cordova.db.once(`${REALM_FIND}${eventStuck}`, (data) => {
        if (data != null) {
          resolve(data)
        } else {
          reject({ status: 404, message: 'find error' })
        }
      })
    })
  }

  remove (data) {
    const realmDB = this
    let eventStuck = 0
    eventStuck = realmDB.removeCounter++

    // lock.acquire(REALM_REMOVE, function (done) {
    //   eventStuck = realmDB.removeCounter++
    //   done()
    // })

    cordova.db.post(`${REALM_REMOVE}${eventStuck}`, data)

    return new Promise( (resolve, reject) => {
      cordova.db.once(`${REALM_REMOVE}${eventStuck}`, (data) => {
        if (data != null) {
          resolve(data)
        } else {
          reject({ status: 404, message: 'delete error' })
        }
      })
    })
  }

  removeDB () {
    cordova.db.post(REALM_REMOVE, 'db')

    return new Promise( (resolve, reject) => {
      cordova.db.once(REALM_REMOVE, (data) => {
        resolve(data)
      })
    })
  }
}

export default RealmDB
