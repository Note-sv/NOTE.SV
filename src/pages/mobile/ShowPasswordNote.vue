<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-primary">
      <q-toolbar class="mobile-header">
        <q-btn
          flat
          round
          icon="arrow_back_ios"
          @click="$router.back()"
        />
        <q-toolbar-title>{{ currentNote.note.ttl }}</q-toolbar-title>
        <q-btn
          flat
          :label="$t('Edit')"
          @click="editNote"
        />
      </q-toolbar>
    </q-header>

    <q-footer class="bg-black text-white">
      <q-toolbar align="right">
        <q-space />
        <short-menu
          :id="id"
          @show-histories="showHistories"
          @share="share"
        />
        <q-space />
      </q-toolbar>
    </q-footer>

    <q-page-container>
      <q-page
        padding
        style="overflow:auto"
      >
        <div class="row q-mb-sm">
          <q-field
            borderless
            :label="$t('title')"
            stack-label
            class="col"
          >
            <template
              #control
            >
              <div
                class="self-center full-width no-outline"
                tabindex="0"
                @click="copy(currentNote.note.ttl)"
              >
                {{ currentNote.note.ttl }}
              </div>
            </template>
            <template
              v-if="currentNote.note.ttl"
              #append
            >
              <q-icon
                name="file_copy"
                @click.stop="copy(currentNote.note.ttl)"
                class="cursor-pointer"
              />
            </template>
          </q-field>
        </div>

        <div class="row q-mb-sm">
          <q-field
            standard
            :label="$t('fid')"
            stack-label
            class="col"
          >
            <template
              #control
            >
              <div
                class="self-center full-width no-outline"
                tabindex="0"
                @click="copy(currentNote.note.fid)"
              >
                {{ currentNote.note.fid }}
              </div>
            </template>

            <template
              v-if="currentNote.note.fid !== ''"
              #append
            >
              <q-icon
                name="file_copy"
                @click.stop="copy(currentNote.note.fid)"
                class="cursor-pointer"
              />
            </template>
          </q-field>
        </div>
        <div class="row q-mb-sm">
          <q-input
            standard
            v-model="currentNote.note.pwd"
            class="col"
            :label="$t('pwd')"
            readonly
            @click="copy(currentNote.note.pwd)"
            :type="isShowPwd ? 'password' : 'text'"
          >
            <template #append>
              <q-icon
                :name="isShowPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isShowPwd = !isShowPwd"
              />
              <q-icon
                name="file_copy"
                @click.stop="copy(currentNote.note.pwd)"
                class="cursor-pointer"
              />
            </template>
          </q-input>
        </div>
        <div class="row q-mb-sm">
          <q-field
            standard
            :label="$t('url')"
            stack-label
            class="col"
          >
            <template #control>
              <markdown-view :content="currentNote.note.url" />
            </template>

            <template
              v-if="currentNote.note.url !== ''"
              #append
            >
              <q-icon
                name="file_copy"
                @click.stop="copy(currentNote.note.url)"
                class="cursor-pointer"
              />
            </template>
          </q-field>
        </div>
        <div
          class="row q-mb-sm"
          v-if="currentNote.note.otp"
        >
          <q-field
            standard
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
                size="40px"
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
          <q-field
            borderless=""
            :label="$t('memo')"
            stack-label
            class="col"
          >
            <template #control>
              <markdown-view :content="currentNote.note.mem" />
            </template>

            <template
              v-if="currentNote.note.mem !== ''"
              #append
            >
              <q-icon
                name="file_copy"
                @click.stop="copy(currentNote.note.mem)"
                class="cursor-pointer"
              />
            </template>
          </q-field>
        </div>
        <hr>
        <div class="row q-mb-sm">
          <div
            v-for="(value, index) in currentNote.note.tags"
            :key="index"
          >
            <q-chip
              dense
              color="primary"
              text-color="white"
            >
              {{ value }}
            </q-chip>
          </div>
        </div>
        <div class="row q-mb-sm">
          <small>
            {{ $t('UpdatedOn') }}: {{ currentNoteDate }}<br>
            {{ currentNoteStatus }}
          </small>
        </div>
      </q-page>
      <q-dialog
        v-model="shareCard"
        persistent
      >
        <share-card
          :id="id"
          @close="shareCard = false"
        />
      </q-dialog>
    </q-page-container>
  </q-layout>
</template>

<script>
import { authenticator } from 'otplib'
import config from '../../config'
const console = config.console
import { mapState, mapActions } from 'vuex'
import { Plugins } from '@capacitor/core'
const { Clipboard } = Plugins
import { KeyURI } from '../../../lib/otp-key-uri.js'

export default {
  data () {
    return {
      id: 0,
      timer: '',
      otpPeriod: 30,
      otpTimeRemaining: 0,
      otpProgressColor: 'teal',
      isShowPwd: true,
      otpToken: '',
      shareCard: false
    }
  },
  components: {
    'share-card': require('components/Notes/Tools/Share.vue').default,
    'short-menu': require('components/Notes/Tools/ShortMenu.vue').default,
    'markdown-view': require('components/Shared/MarkdownView.vue').default
  },
  computed: {
    ...mapState('notes', ['currentNote']),

    currentNoteDate () {
      return this.niceDate(this.currentNote)
    },
    currentNoteStatus () {
      return this.niceStatus(this.currentNote)
    }
  },
  methods: {
    ...mapActions('notes', ['selectNote']),
    niceDate (item) {
      return new Date(this.currentNote.note.tms).toLocaleString()
    },
    niceStatus (item) {
      console.log(item)
      let result = ''
      if (item.status.addressIndex === 0) {
        result += this.$t('SharedFrom')
      } else if (item.status.sharer) {
        result += this.$t('SharedTo')
      }
      if (item.status.sharer) {
        result += ' ' + item.status.sharer
      }
      switch (item.status.tx_status) {
        case 0:
        case 1:
        case 2:
        case 3:
          result += '\n' + this.$t(`status.${item.status.tx_status}`)
          break
        default:
          break
      }
      return result
    },
    editNote () {
      this.$router.push({ name: 'edit_password_note', params: { id: this.id } })
    },
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
    async showHistories (id) {
      this.$router.push({ name: 'show_histories', params: { id: id } })
    },
    share (id) {
      this.shareCard = true
    },
    refreshOtpToken () {
      if (this.currentNote.note.otp) {
        try {
          const otp = new KeyURI(this.currentNote.note.otp)
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
          }
        } catch (err) {
          // Possible errors
          // - options validation
          // - "Invalid input - it is not base32 encoded string" (if thiry-two is used)
          console.warn(err)
        }
      }
      return null
    }
  },

  async mounted () {
    this.$q.loading.show({})

    this.id = parseInt(this.$router.history.current.params.id)
    console.log('show pwd mounted', this.id)

    await this.selectNote(this.id)

    this.$q.loading.hide()

    this.refreshOtpToken()
    this.timer = setInterval(this.refreshOtpToken, 1000)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  }
}
</script>

<style lang="scss">
.no-badge {
  display: none;
}
</style>
