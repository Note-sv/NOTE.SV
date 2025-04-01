<template>
  <q-page>
    <div class="q-pa-md absolute full-width full-height column">
      <div class="row q-mb-lg">
        <search />
        <sort />
      </div>

      <p v-if="search && !passwordNotes.length">
        {{ $t('NoResults') }}
      </p>

      <q-scroll-area
        ref="scroll"
        class="q-scroll-area-notes"
        :style="{ height: scrollerHeight + 'px' }"
      >
        <no-note
          v-if="
            !passwordNotes.length &&
              !search
          "
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
        :offset="[50, 50]"
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

    <q-dialog v-model="isShowNote">
      <show-note
        :id="payload.id"
        @close="isShowNote = false"
        @edit="showEdit"
      />
    </q-dialog>

    <q-dialog
      v-model="isShowEditNote"
      persistent
    >
      <edit-note
        :id="payload.id"
        @close="isShowEditNote = false"
        @done="editDone"
      />
    </q-dialog>
  </q-page>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'
import config from '../../config'
const console = config.console

export default {
  data () {
    return {
      scrollerHeight: 0,
      isShowNote: false,
      isShowEditNote: false,
      payload: {}
    }
  },
  computed: {
    ...mapGetters('notes', ['passwordNotes']),
    ...mapState('settings', ['userSettings']),
    ...mapState('notes', ['search'])
  },
  components: {
    'edit-note': require('components/Notes/Modals/desktop/EditPasswordNote.vue').default,
    'show-note': require('components/Notes/Modals/desktop/ShowPasswordNote.vue').default,
    notes: require('components/Notes/desktop/PasswordNotes.vue').default,
    'no-note': require('components/Notes/NoNote.vue').default,
    search: require('components/Notes/Tools/desktop/Search.vue').default,
    sort: require('components/Notes/Tools/desktop/Sort.vue').default
  },
  methods: {
    ...mapActions('notes', ['newNote']),
    ...mapActions('settings', ['setFrontPage']),

    addDone (payload) {
      this.payload = payload
      this.isShowNote = true
      this.isShowAddNote = false
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
    },
    async addNote () {
      // 即使vuex没有声明为async函数，也应该使用await
      this.payload = await this.newNote()
      this.isShowEditNote = true
      this.isShowNote = false
    }
  },
  mounted () {
    // 如果全局触发 add 按钮
    this.$root.$on('isShowAddNote', () => {
      this.isShowAddNote = true
    })
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
