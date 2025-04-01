<template>
  <q-item
    @click="showNoteModal(note.draft)"
    v-touch-hold:1000.mouse="showNoteModal"
    clickable
    v-ripple
    :class="statusColor"
  >
    <q-item-section side>
      <q-icon
        :name="favicon"
        size="20"
      />
    </q-item-section>
    <q-item-section>
      <q-item-label v-html="$options.filters.searchHighlight(ttl, search)" />
      <q-item-label caption>
        {{ note.url | truncate }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      v-if="note.tms"
      side
    >
      <q-item-label caption>
        {{ note.tms | niceDate }}
      </q-item-label>
      <q-item-label caption>
        {{ note.fid | truncate }}
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
    <q-dialog v-model="isShowNote">
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
      v-model="isShowEditNote"
      persistent
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
import _ from 'lodash'
import config from '../../../config'
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
    'show-note': require('components/Notes/Modals/desktop/ShowPasswordNote.vue')
      .default,
    'edit-note': require('components/Notes/Modals/desktop/EditPasswordNote.vue')
      .default
  },
  computed: {
    ...mapState('notes', ['search']),
    ttl () {
      if (this.note.ttl) {
        return this.note.ttl
      } else {
        return this.$t('Draft')
      }
    },
    favicon () {
      return `img:${config.faviconService}${this.note.url}`
    },
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
          // 被分享的笔记使用浅蓝色
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
    truncate (str) {
      return _.truncate(str)
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
