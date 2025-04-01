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
        <q-toolbar-title>{{ currentNote.note.ttl | removeMd }}</q-toolbar-title>
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
      <q-page padding>
        <div class="row q-mb-sm">
          <markdown-view
            :content="content"
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
          :scroll-offset="50"
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
    </q-page-container>
  </q-layout>
</template>

<script>
import config from '../../config'
const console = config.console
import { mapState, mapActions } from 'vuex'
import { Plugins } from '@capacitor/core'
const { Clipboard } = Plugins

export default {
  data () {
    return {
      id: 0,
      isShowPwd: true,
      content: '',
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

    editNote () {
      this.$router.push({ name: 'edit_normal_note', params: { id: this.id } })
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
    }
  },
  async mounted () {
    this.$q.loading.show({})

    this.id = parseInt(this.$router.history.current.params.id)
    console.log('mounted', this.id)

    await this.selectNote(this.id)

    this.$q.loading.hide()

    const note = Object.assign({}, this.currentNote.note)

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
  }
}
</script>

<style lang="scss">
.no-badge {
  display: none;
}
</style>
