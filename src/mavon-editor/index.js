/**
 * Created by zhy on 2017/4/1.
 */
'use strict'

/**
 * mavonEditor
 * @author hinesboy
 */
const mavonEditor = require('./mavon-editor.vue').default

const VueMavonEditor = {
  markdownIt: mavonEditor.mixins[0].data().markdownIt,
  mavonEditor: mavonEditor,
  LeftToolbar: require('./components/md-toolbar-left'),
  RightToolbar: require('./components/md-toolbar-right'),
  install: function (Vue) {
    Vue.component('MavonEditor', mavonEditor)
  }
}

module.exports = VueMavonEditor
