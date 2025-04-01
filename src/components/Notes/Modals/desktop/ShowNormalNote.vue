<template>
  <q-layout
    view="Lhh lpR fff"
    container
    class="bg-white"
  >
    <q-header class="bg-primary">
      <q-toolbar>
        <q-toolbar-title>{{ currentNote.note.ttl | removeMd }}</q-toolbar-title>
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
      >
        <div class="row q-mb-sm ">
          <markdown-view
            :content="content"
            class="scroll"
          />
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
        <q-page-scroller
          expand
          position="top"
          :scroll-offset="150"
          :offset="[0, 0]"
        >
          <div
            class="col cursor-pointer q-pa-sm bg-accent text-white text-center"
          >
            {{ $t('ScrollBackUp') }}
          </div>
        </q-page-scroller>
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
    </q-page-container>
  </q-layout>
</template>

<script>
import { copyToClipboard } from 'quasar'
import config from '../../../../config'
const console = config.console
import { mapGetters, mapState, mapActions, mapMutations } from 'vuex'

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
      isShowPwd: true,
      isShowHistories: false,
      histories: [],
      content: '',
      shareCard: false,
      showNoteTx: false,
      txNote: null,
      txContent: ''
    }
  },
  components: {
    'share-card': require('components/Notes/Tools/Share.vue').default,

    'short-menu': require('components/Notes/Tools/ShortMenu.vue').default,
    histories: require('components/Notes/Tools/Histories.vue').default,
    'markdown-view': require('components/Shared/MarkdownView.vue').default
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
      return new Date(item.note.tms).toLocaleString()
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
    async selectedNoteTx (noteTxId) {
      const note = await this.selectNoteTxById(noteTxId)
      console.log(note)
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
      this.txNote = note
      this.showNoteTx = true
    },
    share (id) {
      this.shareCard = true
    },
    closeHistoryPanel (_id) {
      this.isShowHistories = false
    }
  },

  async mounted () {
    console.log('mounted')

    // 更新当前选中的笔记
    await this.selectNote(this.id)

    console.log(this.currentNote)
    const note = Object.assign({}, this.currentNote.note)

    if (!note.ttl) {
      note.ttl = ''
    }
    if (!note.mem) {
      note.mem = ''
    }

    let content = note.ttl + '\n\n' + note.mem + '\n\n'
    if (note.files) {
      for (const file of note.files) {
        const fixedName = config.fixMDName(file.name)
        content = content + `![${fixedName}](${file.content})`
        this.$markdownIt.image_add(fixedName, file.content)
      }
    } else if (note.images) {
      for (const image of note.images) {
        const fixedName = config.fixMDName(image.name)

        this.$markdownIt.image_add(fixedName, image.content)
        // 新版中image均已内嵌入markdown
      }
    }
    this.content = content
  },
  beforeDestroy () {
    this.clearCurrentNote()
  }
}
</script>

<style lang="scss">
.no-badge {
  display: none;
}
</style>
