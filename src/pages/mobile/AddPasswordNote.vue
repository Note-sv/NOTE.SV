<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-primary">
      <q-toolbar class="mobile-header">
        <q-btn
          flat
          round
          icon="arrow_back_ios"
          @click="alertClose"
        />
        <q-toolbar-title>{{ $t('AddPassword') }}</q-toolbar-title>
        <q-btn
          flat
          no-caps
          @click="submitForm"
          :label="$t('SaveSubmit')"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page
        padding
        style="overflow:auto;"
      >
        <div class="row q-mb-sm">
          <q-input
            ref="title"
            :rules="[(val) => !!val || $t('RequireVal')]"
            autofocus
            flat
            stack-label
            v-model="noteToSubmit.ttl"
            class="col input-focus"
            :label="$t('title')"
            type="text"
            @keydown.enter.prevent="focusNext"
            @keydown.tab.prevent="focusNext"
          />
        </div>
        <div class="row q-mb-sm">
          <q-input
            flat
            stack-label
            v-model="noteToSubmit.fid"
            class="col input-focus"
            :label="$t('fid')"
            type="text"
            @keydown.enter.prevent="focusNext"
            @keydown.tab.prevent="focusNext"
          />
        </div>
        <div class="row q-mb-sm">
          <q-input
            ref="password"
            flat
            stack-label
            :rules="[(val) => !!val || $t('RequireVal')]"
            v-model="noteToSubmit.pwd"
            class="col input-focus"
            :label="$t('pwd')"
            :type="isShowPwd ? 'text' : 'password'"
            @keydown.enter.prevent="focusNext"
            @keydown.tab.prevent="focusNext"
          >
            <template #append>
              <q-icon
                :name="isShowPwdGen ? 'keyboard_arrow_up' : 'fiber_new'"
                class="text-orange cursor-pointer"
                @click="isShowPwdGen = !isShowPwdGen"
              />
              <q-icon
                :name="isShowPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isShowPwd = !isShowPwd"
              />
              <q-icon
                name="file_copy"
                @click.stop="copy(noteToSubmit.pwd)"
                class="cursor-pointer"
              />
            </template>
          </q-input>
        </div>
        <div class="row q-mb-sm">
          <password-generator
            class="col"
            @password="passwordUpdated"
            v-if="isShowPwdGen"
          />
        </div>
        <div class="row q-mb-sm">
          <q-input
            flat
            stack-label
            v-model="noteToSubmit.url"
            class="col input-focus"
            :label="$t('url')"
            placeholder="https://"
            type="text"
            @keydown.enter.prevent="focusNext"
            @keydown.tab.prevent="focusNext"
          />
        </div>
        <div class="row q-mb-sm">
          <q-input
            flat
            stack-label
            v-model="noteToSubmit.otp"
            class="col input-focus"
            :label="$t('otp')"
            :rules="[(val) => !val || isValidOtp(val) || $t('CheckRule')]"
            type="text"
            @keydown.enter.prevent="focusNext"
            @keydown.tab.prevent="focusNext"
          >
            <template #append>
              <q-icon
                name="qr_code_scanner"
                class="cursor-pointer"
                @click="scanOtp"
              />
            </template>
          </q-input>
        </div>
        <div
          class="row q-mb-sm"
          v-show="otpToken"
        >
          <q-field
            filled
            dense
            :label="$t('otp')"
            stack-label
            class="col"
          >
            <template #control>
              <div
                class="self-center full-width no-outline"
                tabindex="0"
                @click="copy(otpToken)"
              >
                {{ otpToken }}
              </div>
            </template>
            <template #append>
              <q-circular-progress
                ref="otpProgress"
                show-value
                font-size="9px"
                :min="0"
                :max="otpPeriod"
                :value="otpTimeRemaining"
                size="30px"
                :thickness="0.22"
                :color="otpProgressColor"
                track-color="grey-3"
                class="q-ma-md"
              >
                {{ otpTimeRemaining }}s
              </q-circular-progress>
              <q-icon
                name="file_copy"
                @click.stop="copy(otpToken)"
                class="cursor-pointer"
              />
            </template>
          </q-field>
        </div>

        <div class="row q-mb-sm">
          <q-input
            flat
            stack-label
            type="textarea"
            v-model="noteToSubmit.mem"
            class="col input-focus"
            :label="$t('memo')"
          />
        </div>

        <div class="row q-mb-sm">
          <vue-tags-input
            v-model="tag"
            :tags="tags"
            @tags-changed="tagsChanged"
            :placeholder="$t('AddLabel')"
          />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import Vue from 'vue'
import { mapActions, mapState, mapMutations } from 'vuex'
import { authenticator } from 'otplib'
import config from '../../config'
const console = config.console
import { Plugins } from '@capacitor/core'
const { Clipboard } = Plugins
import { KeyURI } from '../../../lib/otp-key-uri.js'
import VueTagsInput from '@johmun/vue-tags-input'

import _ from 'lodash'

export default {
  data () {
    return {
      id: null,
      noteToSubmit: {},
      txHash: null,
      isShowPwdGen: false,
      isShowPwd: true,
      timer: '',
      otpPeriod: 30,
      otpTimeRemaining: 0,
      otpProgressColor: 'teal',
      otpToken: null,
      showQRReader: false,
      isSubmitting: false,
      tag: '',
      tags: []
    }
  },
  watch: {
    noteToSubmit: {
      handler (val, oldVal) {
        this.saveDraft()
      },
      deep: true
    }
  },
  components: {
    VueTagsInput,
    'password-generator': require('components/Notes/Tools/PasswordGenerator.vue')
      .default
  },
  computed: {
    ...mapState('notes', ['currentNote'])
  },
  methods: {
    ...mapActions('notes', ['updateNote', 'deleteNote']),
    ...mapMutations('notes', ['updateCurrentNote', 'clearCurrentNote']),

    tagsChanged (newTags) {
      this.tags = newTags
      if (this.tags.length > 0) {
        this.noteToSubmit.tags = _.map(this.tags, (value) => {
          return value.text
        })
      }
    },
    passwordUpdated (newPassword) {
      Vue.set(this.noteToSubmit, 'pwd', newPassword)
    },
    async submitNote () {
      this.noteToSubmit.tms = Date.now()
      this.noteToSubmit.tpl = 0 // 密码文档
      if (this.txHash) {
        // 设置父交易的tx
        this.noteToSubmit.ptx = this.txHash
      }
      // 转化tags到字符串数组
      if (this.tags.length > 0) {
        this.noteToSubmit.tags = _.map(this.tags, (value) => {
          console.log(value)
          return value.text
        })
      } else {
        // 没有tags就删除对应字段
        delete this.noteToSubmit.tags
      }

      const payload = {
        id: this.id,
        note: this.noteToSubmit,
        status: {
          status: 0
        }
      }
      return this.updateNote(payload)
    },
    validCheck () {
      this.$refs.title.validate()
      this.$refs.password.validate()
      if (this.$refs.title.hasError || this.$refs.password.hasError) {
        this.$q.notify({
          color: 'negative',
          message: this.$t('CheckRule'),
          position: 'top'
        })
        return false
      }
      return true
    },
    async submitForm () {
      if (this.validCheck()) {
        this.noteToSubmit.draft = false
        this.isSubmitting = true
        const payload = await this.submitNote()
        console.log(payload)
        this.$q.notify({
          icon: 'done',
          color: 'positive',
          message: this.$t('Submited'),
          position: 'top'
        })
        this.$router.back()
      }
    },
    saveDraft: _.debounce( function () {
      // 在500毫秒之内避免重复调用
      // 检查是否需要保存, 不是因为点击保存而失去的焦点
      if (
        !this.isSubmitting &&
        !_.isEqual(this.noteToSubmit, this.currentNote.note)
      ) {
        // 改变draft属性，让画面立即有变化
        Vue.set(this.noteToSubmit, 'draft', true)
        // 异步保存
        this.isSubmitting = true
        this.submitNote().then((result) => {
          this.isSubmitting = false
        })
      }
    }, 1000),
    async copy (content) {
      await Clipboard.write({
        string: content
      })

      this.$q.notify({
        icon: 'done',
        color: 'positive',
        message: this.$t('Copied'),
        position: 'center',
        badgeClass: 'no-badge',
        timeout: 10
      })
    },
    alertClose () {
      if (
        !this.noteToSubmit.draft &&
        _.isEqual(this.noteToSubmit, this.currentNote.note)
      ) {
        this.clearCurrentNote()
        this.$router.back()
        return
      }
      this.$q
        .dialog({
          title: this.$t('Close'),
          message: this.$t('CloseHintForSaveDraft'),
          ok: {
            label: this.$t('Yes'),
            color: 'primary',
            flat: true
          },
          cancel: {
            label: this.$t('No'),
            color: 'negative',
            flat: true
          },
          persistent: true
        })
        .onOk(() => {
          this.saveDraft()
        })
        .onCancel(() => {
          if (this.noteToSubmit.draft) {
            this.deleteNote({ id: this.id, draft: this.noteToSubmit.draft })
          }
        })
        .onDismiss(() => {
          this.clearCurrentNote()
          this.$router.back()
        })
    },
    focusNext (e) {
      const inputs = Array.from(document.querySelectorAll('.input-focus input'))
      const textareas = Array.from(
        document.querySelectorAll('.input-focus textarea')
      )
      const controls = inputs.concat(textareas)
      const index = controls.indexOf(e.target)

      if (index + 1 < controls.length) {
        controls[index + 1].focus()
      }
    },
    async scanOtp () {
      // 保存当前节点信息, 此处使用draft字段，避免污染note字段，以免退出时不保存
      this.updateCurrentNote({
        draft: this.noteToSubmit
      })

      // 观察扫码结果
      this.$qrEventBus.$on('scan-result', (value) => {
        if (value.result) {
          try {
            // 检查otp是否正确，不正确会抛出异常
            const otp = new KeyURI(value.result)
            console.log(otp)
            this.noteToSubmit.otp = value.result
          } catch (e) {
            this.noteToSubmit.otp = ''
            //
            this.$q.notify({
              color: 'negative',
              message: this.$t('CheckRule'),
              position: 'top'
            })
          }
        }
      })
      this.$router.push('/qrreader')
    },
    isValidOtp (val) {
      try {
        // 检查otp是否正确，不正确会抛出异常
        const otp = new KeyURI(val)
        console.log(otp)
        return true
      } catch (e) {
        return false
      }
    },
    refreshOtpToken () {
      if (this.noteToSubmit.otp) {
        try {
          const otp = new KeyURI(this.noteToSubmit.otp)
          authenticator.options = otp.options
          const token = authenticator.generate(otp.secret)
          console.log(token)
          if (authenticator.check(token, otp.secret)) {
            this.otpTimeRemaining = authenticator.timeRemaining()
            if (this.otpTimeRemaining < 7) {
              this.otpProgressColor = 'negative'
            } else {
              this.otpProgressColor = 'teal'
            }
            this.otpToken = token

            const options = authenticator.options
            this.otpPeriod = options.step || 30
            // 设置缺省的ttl和fid
            if (!this.noteToSubmit.ttl && otp.labelPrefix) {
              this.noteToSubmit.ttl = otp.labelPrefix
            }
            if (!this.noteToSubmit.fid && otp.accountName) {
              this.noteToSubmit.fid = otp.accountName
            }
            return
          }
        } catch (err) {
          // Possible errors
          // - options validation
          // - "Invalid input - it is not base32 encoded string" (if thiry-two is used)
          console.warn(err)
        }
      }
      this.otpToken = null
    }
  },
  async mounted () {
    // 设置body背景颜色为白色
    var body = document.body
    if (body.style) {
      setTimeout(function () {
        body.style.backgroundColor = 'white'
      }, 2)
      if (body.parentNode && body.parentNode.style) {
        body.parentNode.style.backgroundColor = 'white'
      }
    }

    this.id = this.currentNote.id
    // 恢复当前节点信息
    this.noteToSubmit = Object.assign(
      {},
      this.currentNote.draft || this.currentNote.note
    )
    console.log('mounted', this.noteToSubmit, this.currentNote)
    this.tags = []
    if (this.noteToSubmit.tags) {
      // 要求每个tag都是字符串
      this.tags = _.map(
        _.filter(this.noteToSubmit.tags, (value) => {
          return _.isString(value)
        }),
        (value) => {
          console.log(value)
          return { text: value }
        }
      )
      console.log(this.tags)
    }

    this.refreshOtpToken()
    this.timer = setInterval(this.refreshOtpToken, 1000)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  }
}
</script>
