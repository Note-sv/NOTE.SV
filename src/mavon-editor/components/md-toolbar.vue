<template>
  <div
    class="v-note-op"
  >
    <v-md-toolbar-left
      ref="toolbar_left"
      :editable="editable"
      :transition="transition"
      :d-words="dWords"
      @toolbar-left-click="toolbar_left_click"
      @toolbar-left-addlink="toolbar_left_addlink"
      :toolbars="toolbars"
      @img-manager-open="toggle_imgManager"
      :class="{ transition: transition }"
    >
      <slot
        name="left-toolbar-before"
        slot="left-toolbar-before"
      />
      <slot
        name="left-toolbar-after"
        slot="left-toolbar-after"
      />
    </v-md-toolbar-left>
    <v-md-toolbar-right
      ref="toolbar_right"
      :d-words="dWords"
      @toolbar-right-click="toolbar_right_click"
      :toolbars="toolbars"
      :s-subfield="sSubfield"
      :s-preview-switch="sPreviewSwitch"
      :s-full-screen="sFullScreen"
      :s-html-code="sHtmlCode"
      :s-navigation="sNavigation"
      :class="{ transition: transition }"
      style="max-width:90px"
    >
      <slot
        name="right-toolbar-before"
        slot="right-toolbar-before"
      />
      <slot
        name="right-toolbar-after"
        slot="right-toolbar-after"
      />
    </v-md-toolbar-right>
  </div>
</template>

<script>

import md_toolbar_left from './md-toolbar-left.vue'
import md_toolbar_right from './md-toolbar-right.vue'

export default {
  name: 'MdToolbar',
  props: {
    editable: { // 是否开启编辑
      type: Boolean,
      default: true
    },
    transition: { // TODO: 是否开启动画过渡
      type: Boolean,
      default: true
    },
    toolbars: { // 工具栏
      type: Object,
      required: true
    },
    dWords: {
      type: Object,
      required: true
    },
    imageFilter: {
      type: Function,
      default: null
    },
    // 工具栏
    sSubfield: {
      type: Boolean,
      required: true
    },
    sPreviewSwitch: { type: Boolean, required: true },
    sFullScreen: { type: Boolean, required: true },
    sHtmlCode: { type: Boolean, required: true },
    sNavigation: { type: Boolean, required: true }
  },
  components: {
    'v-md-toolbar-left': md_toolbar_left,
    'v-md-toolbar-right': md_toolbar_right
  },
  methods: {
    toggle_imgManager () {
      // 打开图像管理器
      this.$emit('img-manager-open')
    },
    toolbar_left_click (_type) {
      this.$emit('toolbar-left-click', _type)
    },
    toolbar_left_addlink (_type, text, link) {
      this.$emit('toolbar-left-addlink', _type, text, link)
    },
    toolbar_right_click (_type) {
      this.$emit('toolbar-right-click', _type)
    }

  },
  mounted () {

  }
}
</script>

<style></style>
