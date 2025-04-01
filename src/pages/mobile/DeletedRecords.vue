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
        <q-toolbar-title>{{ $t('DeletedRecords') }}</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page>
        <div class="absolute full-width  full-height">
          <no-note
            v-if="records.length === 0"
            :message="$t('NoRecordsMessage')"
            :hidden-button="true"
          />
          <div
            style="min-height: inherit;"
            v-else
          >
            <q-scroll-area
              ref="scroll"
              class="q-scroll-area"
              :style="{ height: scrollerHeight + 'vh' }"
            >
              <q-list
                bordered
                separator
                class="q-mb-md"
              >
                <q-item
                  v-for="(item, index) in records"
                  :key="index"
                  @click="showNoteModal(item.id)"
                  clickable
                  v-ripple
                >
                  <q-item-section side>
                    {{ index + 1 }}
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      {{ $t('OneRecordWasDeleted') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    {{ niceDate(item.note.tms) }}
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      @click.stop="showTxOnChain(item.status.tx_hash)"
                      flat
                      dense
                      icon="open_in_new"
                      v-if="item.status.tx_hash"
                      label="TX"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-scroll-area>
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
          </div>
        </div>
      </q-page>
      <q-dialog
        v-model="isShowNote"
        v-if="noteId"
        maximized
      >
        <note-history
          :id="noteId"
          @close="isShowNote = false"
        />
      </q-dialog>
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapActions } from 'vuex'
import config from '../../config'
const console = config.console

export default {
  data () {
    return {
      records: [],
      isShowNote: false,
      noteId: null,
      scrollerHeight: 90
    }
  },
  computed: {},
  components: {
    'no-note': require('components/Notes/NoNote.vue').default,
    'note-history': require('components/Notes/Modals/desktop/NoteHistory.vue')
      .default
  },
  methods: {
    ...mapActions('notes', ['getDeletedNotes']),
    niceDate (tms) {
      return new Date(tms).toLocaleString()
    },
    showTxOnChain (txHash) {
      window.open(`https://whatsonchain.com/tx/${txHash}`, '_blank')
    },
    showNoteModal (id) {
      console.log(id)
      this.noteId = id
      this.isShowNote = true
    }
  },
  async mounted () {
    try {
      this.$q.loading.show({})

      const records = await this.getDeletedNotes()
      this.records = records.sort((a, b) => {
        if (a.note.tms > b.note.tms) return -1
        if (a.note.tms < b.note.tms) return 1
        return 0
      })
      console.log(this.records)
    } finally {
      this.$q.loading.hide()
    }
  },
  destroyed () {}
}
</script>

<style></style>

<style lang="scss">
.q-scroll-area {
  display: flex;
  flex-grow: 1;
}
</style>
