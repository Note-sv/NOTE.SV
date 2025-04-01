<template>
  <q-page>
    <div class="q-pa-md absolute full-width full-height column">
      <no-note
        v-if="!Object.keys(noteTags).length"
        :message="$t('NoRecordsMessage')"
        :hidden-button="true"
      />
      <div
        class="row q-mb-lg"
        v-else
      >
        <div
          v-for="(value, tag) in noteTags"
          :key="tag"
        >
          <q-chip
            color="primary"
            text-color="white"
            clickable
            @click="selectTag(tag)"
            v-if="value.length>0"
          >
            {{ tag }}
            <q-badge
              color="orange"
              floating
              transparent
            >
              {{
                value.length
              }}
            </q-badge>
          </q-chip>
        </div>
      </div>
      <div
        class="row q-mb-lg"
        v-if="search"
      >
        <q-scroll-area
          ref="scroll"
          class="q-scroll-area-notes"
          style="min-height: 70vh;"
        >
          <notes
            v-if="notesFiltered.length"
            :notes="notesFiltered"
            :title="search"
          />
        </q-scroll-area>
      </div>

      <q-dialog
        maximized
        v-model="isShowNote"
      >
        <show-note
          :id="payload.id"
          @close="isShowNote = false"
          @edit="showEdit"
        />
      </q-dialog>

      <q-dialog
        maximized
        v-model="isShowEditNote"
        persistent
      >
        <edit-note
          :id="payload.id"
          @close="isShowEditNote = false"
          @done="editDone"
        />
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import config from '../../config'
const console = config.console

export default {
  data () {
    return {
      scrollerHeight: 90,
      isShowNote: false,
      isShowEditNote: false,
      isShowAddNote: false,
      payload: {}
    }
  },
  computed: {
    ...mapGetters('notes', ['noteTags', 'notesFiltered']),
    ...mapState('notes', ['search'])
  },
  components: {
    'edit-note': require('components/Notes/Modals/desktop/EditNormalNote.vue')
      .default,
    'show-note': require('components/Notes/Modals/desktop/ShowNormalNote.vue')
      .default,
    notes: require('components/Notes/desktop/MixNotes.vue').default,
    'no-note': require('components/Notes/NoNote.vue').default
  },
  methods: {
    ...mapActions('notes', ['setSearch']),
    selectTag (tag) {
      console.log(tag)
      this.setSearch(tag)
      console.log(this.notesFiltered)
    },
    editDone (payload) {
      console.log(payload)
      this.payload = payload
      this.isShowNote = true
      this.isShowEditNote = false
    },
    showEdit (payload) {
      console.log(payload)
      this.payload = payload

      this.isShowEditNote = true
      this.isShowNote = false
    }
  },

  mounted () {
    console.log(Object.keys( this.noteTags ))
    if (Object.keys( this.noteTags ).length > 0) {
      this.setSearch(Object.keys( this.noteTags )[0])
    }
  },

  beforeDestroy () {
    this.setSearch('')
  }
}
</script>

<style lang="scss">
.q-scroll-area-notes {
  display: flex;
  flex-grow: 1;
}
</style>
