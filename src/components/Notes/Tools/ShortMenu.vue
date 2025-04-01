<template>
  <q-btn
    flat
    round
    dense
    icon="apps"
    class="q-mr-xs"
  >
    <q-menu
      auto-close
      self="top middle"
    >
      <q-list style="min-width: 100px;text-align:center">
        <q-item>
          <q-item-section>
            <small>{{ niceDate }}<br>{{ status }}</small>
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item
          clickable
          @click="share"
          v-if="allowShare"
        >
          <q-item-section>{{ $t('Share') }}</q-item-section>
        </q-item>
        <q-item
          clickable
          @click="showHistories"
        >
          <q-item-section>{{ $t('HistoryRecord') }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script>

import { mapState } from 'vuex'

export default {
  props: {
    id: {
      type: Number,
      default: function () {
        return 0
      }
    }
  },
  computed: {
    ...mapState('notes', ['currentNote']),
    ...mapState('settings', ['systemSettings']),
    status () {
      const status = this.currentNote.status
      switch (status.tx_status) {
        case 0:
        case 1:
        case 2:
        case 3:
          return this.$t(`status.${status.tx_status}`)
        default:
          return ''
      }
    },
    niceDate () {
      return new Date(this.currentNote.note.tms).toLocaleString()
    },
    allowShare () {
      return this.currentNote.status.tx_status > 1 && this.currentNote.status.addressIndex // 在分享笔记之前要检查addressIndex是有效而且不为零
    }
  },
  methods: {

    showHistories () {
      this.$emit('show-histories', this.id)
    },
    share () {
      if (!this.systemSettings.alias) {
        // 必须注册账号
        this.$q.notify({
          color: 'negative',
          message: this.$t('NeedAnAccount'),
          position: 'center',
          badgeStyle: 'background-color: #ff0000'
        })
        return
      }
      this.$emit('share', this.id)
    }
  }
}
</script>

<style></style>
