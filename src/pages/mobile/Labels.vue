<template>
  <q-page class="">
    <div class="absolute full-width full-height">
      <no-note
        v-if="!Object.keys(noteTags).length"
        :message="$t('NoRecordsMessage')"
        :hidden-button="true"
      />
      <div
        class="row"
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
            v-if="value.length > 0"
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
        class="row"
        v-if="search"
      >
        <q-scroll-area
          ref="scroll"
          class="q-scroll-area-notes"
          style="min-height: 90vh;"
        >
          <notes
            v-if="notesFiltered.length"
            :notes="notesFiltered"
            :title="search"
          />
        </q-scroll-area>
      </div>
    </div>
  </q-page>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import config from '../../config'
const console = config.console

import { SessionStorage } from 'quasar'
const TAG = 'TAG'
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
    'no-note': require('components/Notes/NoNote.vue').default,
    notes: require('components/Notes/mobile/MixNotes.vue').default
  },
  methods: {
    ...mapActions('notes', ['setSearch']),
    selectTag (tag) {
      console.log(tag)
      this.setSearch(tag)
      console.log(this.notesFiltered)
      SessionStorage.set(TAG, tag)
    }
  },

  mounted () {
    let tag = SessionStorage.getItem(TAG)
    console.log(tag)
    if (tag) {
      this.setSearch(tag)
    } else if (Object.keys(this.noteTags).length > 0) {
      tag = Object.keys(this.noteTags)[0]
      this.setSearch(tag)
      SessionStorage.set(TAG, tag)
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
