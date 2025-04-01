import Vue from 'vue'
// import config from '../config'
// const console = config.console
import _ from 'lodash'

const state = {
  records: {

  }
}

const mutations = {
  updateRecord ( state, payload ) {
    if (state.records[payload._id]) {
      Vue.set( state.records, payload._id, Object.assign({}, state.records[payload._id], payload ))
    } else {
      Vue.set( state.records, payload._id, payload )
    }
  },
  removeAll ( state, value ) {
    state.records = {}
  }
}

const actions = {
  updateRecord ( { dispatch, commit }, payload ) {
    // 更新一览
    commit( 'updateRecord', payload )
  },
  removeAll ( { dispatch, commit }, payload ) {
    commit('removeAll')
  }
}

const getters = {
  recordsSorted: ( state ) => {
    const recordsSorted = []
    const keysOrdered = Object.keys( state.records )
    keysOrdered.sort( ( a, b ) => {
      const aValue = state.records[a].time
      const bValue = state.records[b].time
      if (aValue === undefined || bValue === undefined) {
        return 0
      }
      const recordAProp = aValue
      const recordBProp = bValue
      // 时间使用倒序
      if ( recordAProp > recordBProp ) return -1
      else if ( recordAProp < recordBProp ) return 1
      else return 0
    } )
    keysOrdered.forEach( ( key ) => {
      recordsSorted.push(state.records[key])
    } )
    return recordsSorted
  },
  chargeRecords: ( state, getters ) => {
    const recordsSorted = getters.recordsSorted
    return _.filter(recordsSorted, (record, index) => {
      return record.type === 'charge'
    })
  },
  spendRecords: ( state, getters ) => {
    const recordsSorted = getters.recordsSorted
    return _.filter(recordsSorted, (record, index) => {
      return record.type === 'spend'
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
