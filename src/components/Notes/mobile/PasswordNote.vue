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
      <q-item-label v-html="$options.filters.searchHighlight(note.ttl, search)" />
      <q-item-label caption>
        {{ note.url | truncate }}
      </q-item-label>
      <q-item-label caption>
        {{ note.fid | truncate }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      side
      v-if="note.draft"
    >
      <q-icon
        color="orange"
        name="drafts"
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

    <q-item-section side>
      <div class="row">
        <q-btn
          flat
          round
          dense
          icon="keyboard_arrow_right"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import _ from 'lodash'
import config from '../../../config'
import moment from 'moment'

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
    }
  },
  methods: {
    ...mapActions('notes', ['updateNote']),
    showNoteModal (draft) {
      if (draft) {
        this.$router.push({ name: 'edit_password_note', params: { id: this.id } })
      } else {
        this.$router.push({ name: 'show_password_note', params: { id: this.id } })
      }
    }
  },
  computed: {
    ...mapState('notes', ['search', 'autofill']),
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
          if (status.addressIndex === 0) {
            return 'bg-blue-1'
          }
          return ''
      }
    }
  },
  filters: {
    niceDate (val) {
      return moment(val).fromNow()
    },
    truncate (str) {
      return _.truncate(str)
    },
    searchHighlight (val, search) {
      if (search) {
        const searchRegExp = new RegExp(search, 'ig')
        return val.replace(searchRegExp, match => {
          return '<span class="bg-yellow-6">' + match + '</span>'
        })
      }
      return val
    }
  }
}
</script>

<style></style>
