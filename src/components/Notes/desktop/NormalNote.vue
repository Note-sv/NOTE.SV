<template>
  <q-item
    @click="showNoteModal(note.draft)"
    v-touch-hold:1000.mouse="showNoteModal"
    clickable
    v-ripple
    :class="statusColor"
  >
    <q-item-section>
      <q-item-label
        v-html="
          $options.filters.searchHighlight(
            $options.filters.removeMd(note.ttl),
            search
          )
        "
      />
    </q-item-section>

    <q-item-section
      v-if="note.tms"
      side
    >
      <q-item-label
        class="row justify-end"
        caption
      >
        {{ note.tms | niceDate }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      side
      v-if="note.draft"
    >
      <div class="row">
        <q-btn
          flat
          round
          dense
          color="orange"
          icon="drafts"
        />
      </div>
    </q-item-section>
    <q-item-section
      side
      v-else
    >
      <div class="row">
        <q-btn
          @click.stop="showEditNoteModal"
          flat
          round
          dense
          color="primary"
          icon="edit"
        />
      </div>
    </q-item-section>
    <q-dialog
      maximized
      v-model="isShowNote"
    >
      <show-note
        :id="id"
        @close="isShowNote = false"
        @edit="
          isShowEditNote = true
          isShowNote = false
        "
      />
    </q-dialog>

    <q-dialog
      maximized
      v-model="isShowEditNote"
    >
      <edit-note
        :id="id"
        @close="isShowEditNote = false"
        @done="
          isShowNote = true
          isShowEditNote = false
        "
      />
    </q-dialog>
  </q-item>
</template>

<script>
import { mapActions, mapState } from 'vuex'
// import config from '../../../config'
// const console = config.console

export default {
  props: {
    id: {
      type: Number,
      default: function () {
        return 0
      }
    },
    note: {
      type: Object,
      default: function () {
        return {}
      }
    },
    status: {
      type: Object,
      default: function () {
        return {}
      }
    }
  },
  data () {
    return {
      isShowNote: false,
      isShowEditNote: false
    }
  },
  methods: {
    ...mapActions('notes', ['updateNote']),
    showNoteModal (draft) {
      if (draft) {
        this.isShowEditNote = true
      } else {
        this.isShowNote = true
      }
    },
    showEditNoteModal () {
      this.isShowEditNote = true
    }
  },
  components: {
    'show-note': require('components/Notes/Modals/desktop/ShowNormalNote.vue')
      .default,
    'edit-note': require('components/Notes/Modals/desktop/EditNormalNote.vue')
      .default
  },
  computed: {
    ...mapState('notes', ['search']),
    ...mapState('settings', ['userSettings']),
    statusColor () {
      const status = this.status
      switch (status.tx_status) {
        case 0:
          return 'bg-orange-1'
        case 1:
          return 'bg-green-1'
        case 2:
        case 3:
        default:
          if (status.addressIndex === 0) {
            return 'bg-blue-1'
          }
          return ''
      }
    }
  },
  filters: {
    niceDate (val) {
      return new Date(val).toLocaleString()
    },
    searchHighlight (val, search) {
      if (search) {
        const searchRegExp = new RegExp(search, 'ig')
        return val.replace(searchRegExp, (match) => {
          return '<span class="bg-yellow-6">' + match + '</span>'
        })
      }
      return val
    }
  }
}
</script>

<style></style>
