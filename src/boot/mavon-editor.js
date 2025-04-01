import Vue from 'vue'
import VueMavonEditor from '../mavon-editor'
import removeMd from 'remove-markdown'

Vue.use(VueMavonEditor)

Vue.prototype.$markdownIt = VueMavonEditor.markdownIt

Vue.filter('removeMd', function (value) {
  if (!value) return ''
  return removeMd(value)
})
