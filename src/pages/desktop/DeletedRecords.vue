<template>
  <q-page>
    <div class="q-pa-md absolute full-width full-height">
      <q-btn
        v-go-back="'/settings'"
        :label="$t('Return')"
        class="q-ma-sm"
      />
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
            <list-header bg-color="bg-primary">
              {{ $t('DeletedRecords') }}
            </list-header>
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
        <q-dialog
          v-model="isShowNote"
          v-if="noteId"
        >
          <note-history
            :id="noteId"
            @close="isShowNote = false"
          />
        </q-dialog>
      </div>
    </div>
  </q-page>
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
      scrollerHeight: 85
    }
  },
  computed: {},
  components: {
    'no-note': require('components/Notes/NoNote.vue').default,
    'list-header': require('components/Shared/ListHeader.vue').default,
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
    this.$q.loading.show({})

    const records = await this.getDeletedNotes()
    this.records = records.sort((a, b) => {
      if (a.note.tms > b.note.tms) return -1
      if (a.note.tms < b.note.tms) return 1
      return 0
    })
    console.log(this.records)
    this.$q.loading.hide({})
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
