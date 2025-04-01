<template>
  <q-layout
    view="Lhh lpR fff"
    container
    class="bg-white"
  >
    <q-header class="bg-primary">
      <q-toolbar>
        <q-toolbar-title>{{ currentNote.note.ttl }}</q-toolbar-title>
        <q-btn
          flat
          v-close-popup
          round
          dense
          icon="close"
        />
      </q-toolbar>
    </q-header>

    <q-footer class="bg-black text-white">
      <q-toolbar align="right">
        <q-btn
          type="button"
          :label="$t('Edit')"
          color="secondary"
          @click="editNote"
        />
        <q-space />
        <short-menu
          :id="id"
          @show-histories="showHistories"
          @share="share"
        />

        <q-space />
        <q-btn
          type="button"
          :label="$t('Close')"
          color="primary"
          v-close-popup
        />
      </q-toolbar>
    </q-footer>

    <q-page-container>
      <histories
        :histories="histories"
        v-if="isShowHistories"
        @close="closeHistoryPanel"
        @selected="selectedNoteTx"
      />
      <q-page
        padding
        v-else
        style="overflow:auto"
      >
        <div class="row q-mb-sm">
          <q-field
            standard
            :label="$t('fid')"
            stack-label
            class="col"
          >
            <template #control>
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
        <div
          class="row q-mb-sm"
          v-if="currentNote.note.url"
        >
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
            standard
            :label="$t('memo')"
            stack-label
            class="col"
          >
            <template #control>
              <markdown-view :content="currentNote.note.mem" />
            </template>

            <template
              v-if="currentNote.note.mem"
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

      <q-dialog
        v-model="showNoteTx"
        v-if="txNote"
      >
        <q-card>
          <q-card-section>
            <q-field
              standard
              :label="$t('fid')"
              stack-label
              class="col"
              v-if="txNote.note.fid"
            >
              <template #control>
                <div
                  class="self-center full-width no-outline"
                  tabindex="0"
                  @click="copy(txNote.note.fid)"
                >
                  {{ txNote.note.fid }}
                </div>
              </template>

              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(txNote.note.fid)"
                  class="cursor-pointer"
                />
              </template>
            </q-field>

            <q-input
              standard
              v-model="txNote.note.pwd"
              class="col"
              :label="$t('pwd')"
              readonly
              @click="copy(txNote.note.pwd)"
              type="text"
              v-if="txNote.note.pwd"
            >
              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(txNote.note.pwd)"
                  class="cursor-pointer"
                />
              </template>
            </q-input>
            <q-field
              standard
              :label="$t('url')"
              stack-label
              class="col"
              v-if="txNote.note.url"
            >
              <template #control>
                <markdown-view :content="txNote.note.url" />
              </template>

              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(txNote.note.url)"
                  class="cursor-pointer"
                />
              </template>
            </q-field>

            <q-field
              standard
              :label="$t('otp')"
              stack-label
              class="col"
              v-if="txNote.note.otp"
            >
              <template #control>
                <markdown-view :content="txNote.note.otp" />
              </template>

              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(txNote.note.otp)"
                  class="cursor-pointer"
                />
              </template>
            </q-field>

            <q-field
              standard
              :label="$t('memo')"
              stack-label
              class="col"
              v-if="txNote.note.mem"
            >
              <template #control>
                <markdown-view :content="txNote.note.mem" />
              </template>

              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(txNote.note.mem)"
                  class="cursor-pointer"
                />
              </template>
            </q-field>
            <div class="row q-mb-sm">
              <small>
                {{ $t('UpdatedOn') }}: {{ niceDate(txNote) }}<br>
                {{ niceStatus(txNote) }}
              </small>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              v-close-popup
              flat
              color="secondary"
              :label="$t('OK')"
              no-caps
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page-container>
  </q-layout>
</template>

<script>
import { copyToClipboard } from 'quasar'
import { authenticator } from 'otplib'
import config from '../../../../config'
const console = config.console
import { mapGetters, mapState, mapActions, mapMutations } from 'vuex'
import { KeyURI } from '../../../../../lib/otp-key-uri.js'

export default {
  props: {
    id: {
      type: Number,
      default: function () {
        return 0
      }
    }
  },
  data () {
    return {
      timer: '',
      otpPeriod: 30,
      otpTimeRemaining: 0,
      otpProgressColor: 'teal',
      isShowPwd: true,
      isShowHistories: false,
      histories: [],
      otpToken: '',
      shareCard: false,
      showNoteTx: false,
      txNote: null
    }
  },
  components: {
    'share-card': require('components/Notes/Tools/Share.vue').default,

    'short-menu': require('components/Notes/Tools/ShortMenu.vue').default,
    histories: require('components/Notes/Tools/Histories.vue').default,
    'markdown-view': require('components/MarkdownView.vue').default
  },
  computed: {
    ...mapState('notes', ['currentNote']),
    ...mapGetters('notes', ['getHistoriesById']),
    currentNoteDate () {
      return this.niceDate(this.currentNote)
    },
    currentNoteStatus () {
      return this.niceStatus(this.currentNote)
    }
  },
  methods: {
    ...mapActions('notes', ['selectNote', 'selectNoteTxById']),
    ...mapMutations('notes', ['clearCurrentNote']),

    editNote () {
      this.$emit('edit', {
        id: this.id,
        note: this.currentNote.note
      })
    },
    copy (content) {
      copyToClipboard(content)
        .then(() => {
          // success!
          this.$q.notify({
            icon: 'done',
            color: 'positive',
            message: this.$t('Copied'),
            position: 'center',
            badgeClass: 'no-badge',
            timeout: 10
          })
        })
        .catch((e) => {
          // fail
          this.$q.notify({
            color: 'negative',
            message: this.$t('CopyFailed'),
            position: 'center',
            badgeStyle: 'background-color: #ff0000'
          })
        })
    },

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
    async showHistories (id) {
      this.histories = await this.getHistoriesById(id)
      this.isShowHistories = true
    },
    share (id) {
      this.shareCard = true
    },
    closeHistoryPanel (_id) {
      this.isShowHistories = false
    },
    async selectedNoteTx (noteTxId) {
      const note = await this.selectNoteTxById(noteTxId)
      console.log(note)

      this.txNote = note
      this.showNoteTx = true
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
          console.error(err)
        }
      }
      return null
    }
  },

  async mounted () {
    console.log('mounted', this.id)
    // 更新当前选中的笔记
    await this.selectNote(this.id)

    // this.txNote = this.currentNote

    this.refreshOtpToken()
    this.timer = setInterval(this.refreshOtpToken, 1000)
  },
  beforeDestroy () {
    clearInterval(this.timer)

    this.clearCurrentNote()
  }
}
</script>

<style lang="scss">
.no-badge {
  display: none;
}
</style>
