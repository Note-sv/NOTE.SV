<template>
  <q-page>
    <div class="absolute full-width  full-height">
      <p v-if="search && !passwordNotes.length">
        {{ $t('NoResults') }}
      </p>

      <q-scroll-area
        ref="scroll"
        class="q-scroll-area-notes"
        :style="{ height: scrollerHeight + 'vh' }"
      >
        <no-note
          v-if="!passwordNotes.length && !search"
          :message="$t('NoPasswordMessage')"
          @add-note="addNote"
        />

        <notes
          v-if="passwordNotes.length"
          :notes="passwordNotes"
          :title="$t('password')"
        />
      </q-scroll-area>

      <q-page-sticky
        position="bottom-right"
        :offset="[30, 30]"
        class="mobile-footer"
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
      scrollerHeight: 90
    }
  },
  computed: {
    ...mapGetters('notes', ['passwordNotes']),
    ...mapState('settings', ['userSettings']),
    ...mapState('notes', ['search'])
  },
  components: {
    notes: require('components/Notes/mobile/PasswordNotes.vue').default,
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

      this.$router.push({ name: 'add_password_note' })
    }
  },
  mounted () {
    // setTimeout(() => { this.scrollerHeight = this.$refs.scroll.thumbSize }, 1000)
    this.clearCurrentNote()
    this.setFrontPage('/')
  }
}
</script>

<style>
.q-scroll-area-notes {
  display: flex;
  flex-grow: 1;
}
</style>
