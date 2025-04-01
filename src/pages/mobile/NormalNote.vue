<template>
  <q-page class="">
    <div class="absolute full-width full-height">
      <p v-if="search && !normalNotes.length">
        {{ $t('NoResults') }}
      </p>

      <q-scroll-area
        ref="scroll"
        class="q-scroll-area-notes"
        :style="{ height: scrollerHeight + 'vh' }"
      >
        <no-note
          v-if="!normalNotes.length && !search"
          :message="$t('NoNoteMessage')"
          @add-note="addNote"
        />

        <notes
          v-else
          :notes="normalNotes"
          :title="$t('note')"
        />
      </q-scroll-area>

      <q-page-sticky
        position="bottom-right"
        :offset="[30, 30]"
      >
        <q-btn
          class="all-pointer-events"
          @click="addNote"
          round
          color="primary"
          size="lg"
          icon="add"
        />
      </q-page-sticky>
    </div>
  </q-page>
</template>

<script>
import { mapGetters, mapState, mapActions, mapMutations } from 'vuex'
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
      // timer
    }
  },
  computed: {
    ...mapGetters('notes', ['normalNotes']),
    ...mapState('notes', ['search'])

  },
  components: {
    notes: require('components/Notes/mobile/NormalNotes.vue').default,
    'no-note': require('components/Notes/NoNote.vue').default
  },
  methods: {
    ...mapActions('notes', ['newNote']),
    ...mapMutations('notes', ['clearCurrentNote']),
    ...mapActions('settings', ['setFrontPage']),

    async addNote () {
      // 创建一个新的笔记
      const payload = await this.newNote()
      console.log('newNote', payload)
      this.$router.push({ name: 'add_normal_note' })
    }
  },
  mounted () {
    // this.time = setTimeout(() => { this.scrollerHeight = this.$refs.scroll.thumbSize }, 1000)
    this.$root.$on('isShowAddNote', () => {
      this.isShowAddNote = true
    })
    this.clearCurrentNote()
    this.setFrontPage('/notes')
  },
  beforeDestroy () {
    // clearInterval(this.timer)
  }
}
</script>

<style>
.q-scroll-area-notes {
  display: flex;
  flex-grow: 1;
}
</style>
