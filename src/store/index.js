import Vue from 'vue'
import Vuex from 'vuex'

import notes from './store-notes'
import records from './store-records'
import settings from './store-settings'
import account from './store-account'
Vue.use( Vuex )

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation
 */

const store = new Vuex.Store( {
  modules: {
    notes,
    records,
    settings,
    account
  },

  // enable strict mode (adds overhead!)
  // for dev mode only
  strict: process.env.DEV
} )
export default store
