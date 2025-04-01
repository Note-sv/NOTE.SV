<template>
  <q-page>
    <div class="absolute full-width full-height">
      <no-note
        v-if="!sharedNotes.length"
        :message="$t('NoSharedRecordsMessage')"
        :hidden-button="true"
      />

      <div
        class="row q-mb-lg"
        v-else
      >
        <q-scroll-area
          ref="scroll"
          class="q-scroll-area-notes"
          style="min-height: 70vh;"
        >
          <notes
            v-if="sharedNotes.length"
            :notes="sharedNotes"
            :title="$t('SharedNote')"
          />
        </q-scroll-area>
      </div>
    </div>
  </q-page>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
// import config from '../../config'
// const console = config.console

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
    ...mapGetters('notes', ['sharedNotes']),
    ...mapState('notes', ['search'])
  },
  components: {
    notes: require('components/Notes/mobile/MixNotes.vue').default,
    'no-note': require('components/Notes/NoNote.vue').default
  },
  methods: {},

  mounted () {},

  beforeDestroy () {}
}
</script>

<style lang="scss">
.q-scroll-area-notes {
  display: flex;
  flex-grow: 1;
}
</style>
