<template>
  <q-page
    padding
    ref="editor"
  >
    <q-btn
      v-go-back="'/settings'"
      :label="$t('Return')"
      class="q-ma-sm"
    />
    <div
      id="iframe-wrapper"
      :style="iframe.wrapperStyle"
    >
      <iframe
        v-if="loaded"
        :src="iframe.src"
        :style="iframe.style"
        :height="iframe.style.height"
        :width="iframe.style.width"
        frameborder="0"
      />
    </div>
  </q-page>
</template>

<script>

import { mapState } from 'vuex'

export default {
  data () {
    return {
      loaded: false,
      iframe: {
        src: 'https://note.sv/help',
        style: null,
        wrapperStyle: null
      }
    }
  },
  computed: {
    ...mapState('settings', ['userSettings']),
    lang: {
      get () {
        return this.userSettings.lang
      },
      set (val) {
        this.setLang(val)
      }
    }
  },
  mounted () {
    const editor = this.$refs.editor
    this.iframe.style = {
      position: 'absolute',
      width: '99%',
      height: window.innerHeight,
      top: -editor.offsetTop + 'px',
      left: -editor.offsetLeft + 'px'
    }
    this.iframe.wrapperStyle = {
      overflow: 'hidden',
      height: editor.clientHeight + 'px',
      width: editor.clientWidth + 'px'
    }
    this.loaded = true
    this.iframe.src = `https://note.sv/help?lang=${this.lang.value}`
  }
}
</script>

<style></style>
