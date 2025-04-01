<template>
  <q-card class="my-card">
    <q-slide-item v-if="showLangSelect">
      <q-item>
        <q-item-section avatar>
          <div space>
            {{ $t('MnemonicLanguage') }}
          </div>
        </q-item-section>
        <q-item-section>
          <q-select
            style="max-width: 150px"
            label-color="orange"
            v-model="mnLang"
            :options="mnLangOptions"
            @input="changeMnLang()"
          />
        </q-item-section>
      </q-item>
    </q-slide-item>
    <q-card-section ref="card">
      <q-chip
        v-for="(word, index) in words"
        :key="index"
        style="font-size: 1.2em"
      >
        <q-select
          borderless
          v-model="words[index]"
          use-input
          hide-selected
          fill-input
          hide-dropdown-icon
          input-debounce="0"
          :options="wordOptions"
          @filter="filterFn"
          @input="updateValue()"
          style="width: 80px;"
          @keydown="keydown"
        />
        <div
          class="q-badge flex inline items-center no-wrap q-badge--single-line q-badge--floating q-badge--transparent"
          :class="{ 'bg-orange': isOranges[index] }"
        >
          {{ index + 1 }}
        </div>
      </q-chip>
    </q-card-section>
  </q-card>
</template>
<script>
import { mapState } from 'vuex'
import config from '../../../config'
const console = config.console
import Mnemonic from 'bsv/mnemonic'
import _ from 'lodash'

export default {
  props: {
    value: {
      type: Array,
      default: function () {
        return []
      }
    },
    showLangSelect: {
      type: Boolean,
      default: true
    },
    lang: {
      type: Object,
      default: function () {
        return {}
      }
    }
  },
  data () {
    return {
      words: [],
      mnLang: null,
      mnLangOptions: config.mnLangOptions,
      wordOptions: Mnemonic.Words.ENGLISH,
      isOranges: [false, true, true, true, true, true, true, true, true, true, true, true]
    }
  },
  watch: {
    value: function (val, oldVal) {
      this.words = val
    }
  },
  computed: {
    ...mapState('settings', ['userSettings'])
  },
  methods: {
    changeMnLang () {
      this.wordOptions = Mnemonic.Words[this.mnLang.value]
      // 控件语言发生了变更
      this.$emit('changed', this.mnLang)
    },

    afterUpdateSelectNext () {
      var nextIndex
      for (var j = 0; j < this.words.length; j++) {
        if (this.words[j] === '') {
          nextIndex = j
          break
        } else {
          nextIndex = -1
        }
      }

      for (var i = 0; i < this.isOranges.length; i++) {
        this.isOranges[i] = true
      }
      this.isOranges[nextIndex] = false

      setTimeout(() => {
        if (nextIndex !== -1) {
          this.$refs.card.$children[nextIndex].$children[0].focus()
        }
      }, 500)
    },
    updateValue: function () {
      this.afterUpdateSelectNext()

      console.log(this.words)
      this.$emit('input', this.words)
    },
    filterFn (val, update, abort) {
      console.log(val, val.length, this.mnLang.value)
      // 中文最少一个字母，其他语言最少两个字母
      if ( (val.length < 1) || (this.mnLang.value !== 'CHINESE' && val.length < 2)) {
        abort()
        return
      }

      update(() => {
        const needle = _.lowerCase(val).normalize('NFD')
        this.wordOptions = Mnemonic.Words[this.mnLang.value].filter(
          v => _.lowerCase(v).normalize('NFD').includes(needle)
        ).sort((a, b) => _.lowerCase(a).normalize('NFD').indexOf(needle) - _.lowerCase(b).normalize('NFD').indexOf(needle))
      }, (ctl) => {
        // console.log(ctl)
        // selectControl = ctl
        // menu显示后，选中第一个
        ctl.setOptionIndex(0)
      })
    },
    keydown (event) {
      console.log(event)
      if (event.keyCode === 13) {
        // selectControl.

        // var doc = event.target
        // const kEvent = document.createEvent('KeyboardEvent')
        // const fn = kEvent.initKeyEvent || kEvent.initKeyboardEvent
        // fn('Tab', true, true, null, false, false, false, false, 9, 0)
        // console.log(fn, kEvent)

        // // doc.dispatchEvent(kEvent)
      }
    }
  },
  mounted () {
    this.words = this.value
    this.mnLang = Object.assign({}, this.lang)
    this.changeMnLang()
  }
}
</script>
