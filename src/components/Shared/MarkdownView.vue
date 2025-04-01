<template>
  <div class="markdown-view v-note-wrapper markdown-body">
    <div class="v-note-panel">
      <div
        class="v-note-show single-show"
      >
        <div
          ref="vShowContent"
          v-html="renderContent"
          class="v-show-content"
          style="padding: 0ch;"
        />
      </div>
    </div>
    <!-- 预览图片 -->
    <transition name="fade">
      <div
        @click="dPreviewImgSrc = null"
        class="v-note-img-wrapper"
        v-if="dPreviewImgSrc"
      >
        <img
          :src="dPreviewImgSrc"
          alt="none"
        >
      </div>
    </transition>
  </div>
</template>
<script>

import {
  ImagePreviewListener
} from '../../mavon-editor/lib/core/extra-function.js'

export default {
  props: {
    content: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      dPreviewImgSrc: null // 图片预览地址
    }
  },
  computed: {
    // FIXME:You may have an infinite update loop in a component render function.
    // 如果在一个页面中两次使用这个控件，可能会出现这个警告
    // 此处必须使用观察到content变化进行描画
    renderContent () {
      return this.$markdownIt.render(this.content)
    }
  },
  mounted () {
    // 图片预览事件监听
    ImagePreviewListener(this)
  }
}
</script>

<style lang="scss">
@import '../../mavon-editor/lib/css/scroll.scss';
@import '../../mavon-editor/lib/css/mavon-editor.scss';
@import '../../mavon-editor/lib/css/markdown.css';
@import '../../mavon-editor/resources/markdown/github-markdown.min.css';

.markdown-view {
  z-index:auto  !important;
  border: 0  !important;
  height: auto  !important;
  min-height: auto  !important;
}

.markdown-view-compact {
  padding: 0ch;
}

</style>
