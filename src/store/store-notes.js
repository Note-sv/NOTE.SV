import Vue from 'vue'
import config from '../config'
const console = config.console
import _ from 'lodash'
import ipc from '../communction'

const state = {
  notes: {

  },
  status: {

  },
  tags: {

  },
  /** currentNote: {} 当前笔记，包括note和status，note里包含mem和files
   * {
   * id:1234567890
   * note:{
   * ttl:
   * mem:
   * files:[]
   * },
   * status:{
   * status:0,
   * tx_hash:
   * tx_height:
   * }
   * }
   */
  currentNote: { note: {}, status: {} },
  search: '',
  sort: 'ttl',
  autofill: false
}

const mutations = {
  // 更新标签
  updateTags ( state, payload ) {
    if (!payload.note || !payload.note.tags || payload.note.tags.length === 0) {
      return
    }
    const nId = parseInt( payload.id )
    // 从所有标签中删除payload的id,然后重新追加
    _.forEach(state.tags, function (value, key) {
      const ids = _.without(value, nId)
      state.tags[key] = ids
    })
    for (const index in payload.note.tags) {
      const tag = payload.note.tags[index]
      if ( state.tags[tag] ) {
        const ids = _.union(state.tags[tag], [nId])
        Vue.set( state.tags, tag, ids)
      } else {
        // 每个tags，key是tag，value是一个Set对象
        const ids = [nId]
        Vue.set( state.tags, tag, ids)
      }
    }
  },
  updateNote ( state, payload ) {
    const nId = parseInt( payload.id )

    if ( payload.note ) {
      const note = Object.assign( {}, payload.note )
      // 如果属于当前的笔记，更新当前笔记内容
      if ( nId === parseInt( state.currentNote.id ) ) {
        state.currentNote.note = note
      }
      Vue.set( state.notes, nId, note )
    }
    if ( payload.status ) {
      // 如果属于当前的笔记，更新当前笔记的状态
      if ( nId === parseInt( state.currentNote.id ) ) {
        state.currentNote.status = Object.assign( {}, state.currentNote.status || {}, payload.status )
      }

      if ( state.status[nId] ) {
        Vue.set( state.status, nId, Object.assign( {}, state.status[nId], payload.status ) )
      } else {
        Vue.set( state.status, nId, payload.status )
      }
    }
  },
  updateCurrentNote ( state, payload ) {
    state.currentNote = Object.assign( {}, state.currentNote, payload )
  },
  clearCurrentNote ( state ) {
    state.currentNote = { note: {}, status: {} }
  },
  deleteNote ( state, id ) {
    const note = state.notes[id]
    if (note && note.tags && note.tags.length > 0) {
      for (const index in note.tags) {
        const tag = note.tags[index]

        if ( state.tags[tag] ) {
          const ids = _.without( state.tags[tag], id)
          if (ids.length === 0) {
            Vue.delete(state.tags, tag)
          } else {
            Vue.set( state.tags, tag, ids)
          }
        }
      }
    }
    Vue.delete( state.notes, id )
    Vue.delete( state.status, id )
    console.log( 'deleteNote', id, parseInt( state.currentNote.id ) )
    if ( parseInt( id ) === parseInt( state.currentNote.id ) ) {
      state.currentNote = { note: {}, status: {} }
    }
  },
  addNote ( state, payload ) {
    const nId = parseInt( payload.id )

    if ( payload.note ) {
      // 复制对象
      const note = Object.assign( {}, payload.note )
      Vue.set( state.notes, nId, note )
    }
    if ( payload.status ) {
      if ( state.status[nId] ) {
        Vue.set( state.status, nId, Object.assign( state.status[nId], payload.status ) )
      } else {
        Vue.set( state.status, nId, payload.status )
      }
    }
  },
  setSearch ( state, value ) {
    state.search = value
  },
  setSort ( state, value ) {
    state.sort = value
  },
  setAutofill ( state, value ) {
    state.autofill = value
  },
  removeAll ( state, value ) {
    state.notes = {}
    state.status = {}
    state.tags = {}
    state.currentNote = { note: {}, status: {} }
    state.search = ''
    state.sort = 'ttl'
  }
}

const actions = {
  updateNote ( { dispatch, commit }, payload ) {
    // 更新数据库
    ipc.send( 'update-note', payload )

    // 设置为当前笔记数据
    commit( 'updateCurrentNote', payload )
    // 更新一览
    commit( 'updateNote', payload )

    // 更新标签
    commit('updateTags', payload)
    return payload
  },
  deleteNote ( { dispatch, commit }, payload ) {
    ipc.send( 'delete-note', payload )
    // 改变本地状态
    commit( 'deleteNote', payload.id )
  },
  // 新建一个空笔记，使用新的ID
  async newNote ( { commit } ) {
    // 新建一个基于创世时间戳的笔记ID
    const noteId = await ipc.sendSync( 'new-id' )

    // 创建空笔记
    const payload = {
      id: noteId,
      note: {},
      status: {
        tx_status: 0
      }
    }

    console.log( noteId, payload )

    // 设置为当前笔记数据
    commit( 'updateCurrentNote', payload )

    // 保存在本地
    commit( 'addNote', payload )

    return payload
  },
  setSearch ( { commit }, value ) {
    commit( 'setSearch', value )
  },
  setAutofill ( { commit }, value ) {
    commit( 'setAutofill', value )
  },
  setSort ( { commit }, value ) {
    commit( 'setSort', value )
  },
  svFetchAllNotes ( { dispatch, commit } ) {
    // 异步调用获取所有的notes
    ipc.send( 'fecth-all-notes' )
  },
  async svChanged ( { dispatch, commit }, payload ) {
    const nId = parseInt( payload.id )

    if ( state.notes[nId] ) {
      // 如果改变的数据比现有数据的时间戳更新，则更新
      if ( payload.note && payload.note.tms && payload.note.tms > state.notes[nId].tms ) {
        if ( payload.note.del ) {
          commit( 'deleteNote', nId )
        } else {
          commit( 'updateNote', payload )
          // 更新标签
          commit('updateTags', payload)
        }
      } else {
        // 如果没设置tms，当前数据的状态更新
        commit( 'updateNote', payload )
        // 更新标签
        commit('updateTags', payload)
      }

      // 后台更新是当前笔记的话，重新获取
      // FIXME:前台UI要考虑同期数据导致变化的情况
      if ( state.currentNote.id === nId ) {
        const payload = await ipc.sendSync( 'get-note-by-id', nId )
        if ( payload ) {
          // 当新建note的时候，后台取不到数据
          commit( 'updateCurrentNote', payload )
        }
      }
    } else if ( payload.note && payload.note.tms && !payload.note.del ) {
      // 如果有时间戳则追加
      commit( 'addNote', payload )
      // 更新标签
      commit('updateTags', payload)
    }
  },
  removeAll ( { dispatch, commit }, payload ) {
    commit( 'removeAll' )
  },
  async shareNote ({ dispatch, commit, state }, payload) {
    console.log( payload)
    // 异步分享
    ipc.send( 'share-note', payload )
  },
  async selectNote ( { dispatch, commit, state }, id ) {
    console.log( 'selectNote', state.currentNote.id, parseInt( id ) )
    if ( parseInt( state.currentNote.id ) !== parseInt( id ) ) {
      const payload = await ipc.sendSync( 'get-note-by-id', id )
      if ( payload ) {
        console.log('get-note-by-id', payload)
        // 当新建note的时候，后台取不到数据
        commit( 'updateCurrentNote', payload )
      }
    }
  },
  async selectNoteTxById ( { dispatch, commit, state }, noteTxId ) {
    return await ipc.sendSync( 'get-note-tx-by-id', noteTxId )
  },
  async getDeletedNotes ( { dispatch, commit, state } ) {
    return await ipc.sendSync( 'get-deleted-notes' )
  }
}

const getters = {
  getHistoriesById: ( state ) => async ( id ) => {
    const histories = await ipc.sendSync( 'get-histories-by-id', id )
    return histories
  },
  getStatusById: ( state ) => ( id ) => {
    return state.status[id]
  },
  notesSorted: ( state ) => {
    const notesSorted = []
    const keysOrdered = Object.keys( state.notes )
    keysOrdered.sort( ( a, b ) => {
      const aValue = state.notes[a][state.sort]
      const bValue = state.notes[b][state.sort]
      if ( !aValue || !bValue ) {
        return 0
      }
      if (state.sort === 'ttl') {
        const noteAProp = aValue.toString().toLowerCase()
        const noteBProp = bValue.toString().toLowerCase()
        // 标题使用正序，时间使用倒序
        if ( noteAProp > noteBProp ) return 1
        else if ( noteAProp < noteBProp ) return -1
        else return 0
      } else {
        const noteAProp = new Date(parseInt(aValue))
        const noteBProp = new Date(parseInt(bValue))
        return noteBProp - noteAProp
      }
    } )

    // 草稿排在前面
    keysOrdered.sort( ( a, b ) => {
      const aValue = state.notes[a].draft
      const bValue = state.notes[b].draft
      if ( aValue && bValue == null ) return -1
      else if ( aValue == null && bValue ) return 1
      else return 0
    } )

    keysOrdered.forEach( ( key ) => {
      // 数组，第一个是ID， 第二个是对应笔记, 第三个是对应的状态
      notesSorted.push([parseInt(key), state.notes[key], state.status[key]])
    } )

    return notesSorted
  },
  notesFiltered: ( state, getters ) => {
    const notesSorted = getters.notesSorted
    const notesFiltered = []
    if ( state.search ) {
      // populate empt object
      notesSorted.forEach( function ( item ) {
        const note = item[1] // 第二个元素是笔记
        const search = state.search.toLowerCase()
        const ttl = note.ttl ? note.ttl.toLowerCase() : ''
        const fid = note.fid ? note.fid.toLowerCase() : ''
        const url = note.url ? note.url.toLowerCase() : ''
        const mem = note.mem ? note.mem.toLowerCase() : ''
        const tags = note.tags ? _.map(note.tags, (tag) => { return tag.toLowerCase() }) : []
        if (
          ttl.includes( search ) ||
          fid.includes( search ) ||
          url.includes( search ) ||
          mem.includes( search ) ||
          tags.includes( search )
        ) {
          notesFiltered.push(item)
        }
      } )
      return notesFiltered
    }
    return notesSorted
  },
  normalNotes: ( state, getters ) => {
    const notesFiltered = getters.notesFiltered
    const notes = []
    notesFiltered.forEach( function ( item ) {
      const note = item[1] // 第二个元素是笔记
      if ( note.tpl === 1 ) { // || !note.pwd, 1是笔记
        notes.push(item)
      }
    } )
    return notes
  },
  passwordNotes: ( state, getters ) => {
    const notesFiltered = getters.notesFiltered
    const notes = []
    notesFiltered.forEach( function ( item ) {
      const note = item[1] // 第二个元素是笔记
      if ( note.tpl === 0 ) { // || !note.pwd, 0是密码
        notes.push(item)
      }
    } )
    return notes
  },
  sharedNotes: ( state, getters ) => {
    const notesFiltered = getters.notesFiltered
    const notes = []
    notesFiltered.forEach( function ( item ) {
      const status = item[2] // 第3个元素是状态
      if ( status.addressIndex === 0 ) {
        notes.push(item)
      }
    } )
    return notes
  },
  noteTags: ( state, getters ) => {
    const tags = state.tags
    // console.log('tags', tags)
    // const results = []
    // _.forEach(tags, function (value, key) {
    //   console.log(key, value.length)
    // })
    // console.log(results)
    return tags
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
