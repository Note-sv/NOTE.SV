<template>
  <q-layout
    view="Lhh lpR fff"
    container
    class="bg-white"
  >
    <q-footer class="bg-black text-white">
      <q-toolbar align="right">
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
        @selected="selectedNoteTx"
        :hidden-button="true"
      />

      <q-dialog
        v-model="showNormalNoteTx"
        v-if="txNote"
      >
        <q-card>
          <q-card-section>
            <div
              class="row q-mb-sm"
              v-if="txNote.note.del"
            >
              {{ $t('Deleted') }}
            </div>
            <markdown-view
              :content="txContent"
              class="scroll"
            />
            <q-separator />
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

      <q-dialog
        v-model="showPasswordNoteTx"
        v-if="txNote"
      >
        <q-card>
          <q-card-section>
            <div
              class="row q-mb-sm"
              v-if="txNote.note.del"
            >
              {{ $t('Deleted') }}
            </div>

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
import config from '../../../../config'
const console = config.console
import { mapGetters, mapState, mapActions } from 'vuex'

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
      histories: [],
      showNormalNoteTx: false,
      showPasswordNoteTx: false,
      txNote: null,
      txContent: ''
    }
  },
  components: {
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
    ...mapActions('notes', ['selectNoteTxById']),
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
      return new Date(item.note.tms).toLocaleString()
    },
    niceStatus (item) {
      console.log(item)
      if (item.status.addressIndex === 0) {
        return `${this.$t('shared')} ${item.status.sharer}`
      }
      switch (item.status.tx_status) {
        case 0:
        case 1:
        case 2:
        case 3:
          return this.$t(`status.${item.status.tx_status}`)
        default:
          return ''
      }
    },
    async showHistories (id) {
      this.histories = await this.getHistoriesById(id)
      this.isShowHistories = true
    },
    async selectedNormalNoteTx (note) {
      if (!note.note.ttl) {
        note.note.ttl = ''
      }
      if (!note.note.mem) {
        note.note.mem = ''
      }
      let content = note.note.ttl + '\n\n' + note.note.mem + '\n\n'
      if (note.files) {
        for (const file of note.note.files) {
          const fixedName = config.fixMDName(file.name)
          content = content + `![${fixedName}](${file.content})`
          this.$markdownIt.image_add(fixedName, file.content)
        }
      } else if (note.note.images) {
        for (const image of note.note.images) {
          const fixedName = config.fixMDName(image.name)

          this.$markdownIt.image_add(fixedName, image.content)
          // 新版中image均已内嵌入markdown
        }
      }

      this.txContent = content
      this.showNormalNoteTx = true
    },
    async selectedNoteTx (noteTxId) {
      const note = await this.selectNoteTxById(noteTxId)
      console.log(note)

      this.txNote = note

      if (note.note.tpl === 1) {
        this.selectedNormalNoteTx(note)
      } else {
        this.showPasswordNoteTx = true
      }
    }
  },
  async mounted () {
    console.log('mounted')

    this.histories = await this.getHistoriesById(this.id)
  }
}
</script>

<style lang="scss">
.no-badge {
  display: none;
}
</style>
