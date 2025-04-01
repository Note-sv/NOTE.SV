<template>
  <q-page padding>
    <q-list
      bordered
      separator
      class="q-mb-md"
    >
      <list-header bg-color="bg-primary">
        {{ $t('HistoryRecord') }}
      </list-header>
      <q-separator spaced />

      <q-item
        v-for="(item, index) in histories"
        :key="item._id"
        clickable
        v-ripple
        @click="selectHistory(item._id)"
      >
        <q-item-section side>
          {{ index + 1 }}
        </q-item-section>
        <q-item-section>
          {{ niceDate(item.tms) }}
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ niceStatus(item) }}
          </q-item-label>
          <q-item-label caption>
            {{ niceSharer(item) }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row">
            <q-btn
              @click.stop="showTxOnChain(item.tx_hash)"
              flat
              dense
              icon="open_in_new"
              v-if="item.tx_hash"
              label="TX"
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <q-btn
      @click="close"
      :label="$t('Return')"
      v-if="!hiddenButton"
    />
  </q-page>
</template>

<script>
import config from '../../../config'
const console = config.console
export default {
  props: {
    id: {
      type: Number,
      default: function () {
        return 0
      }
    },
    histories: {
      type: Array,
      default: function () {
        return []
      }
    },
    hiddenButton: Boolean
  },
  components: {
    'list-header': require('components/Shared/ListHeader.vue').default
  },
  computed: {},
  methods: {

    niceStatus (status) {
      console.log(status)
      let result = ''
      switch (status.tx_status) {
        case 0:
        case 1:
        case 2:
        case 3:
          result += this.$t(`status.${status.tx_status}`)
          break
        default:
          break
      }
      return result
    },
    niceSharer (status) {
      console.log(status)
      let result = ''
      if (status.addressIndex === 0) {
        result += this.$t('SharedFrom')
      } else if (status.sharer) {
        result += this.$t('SharedTo')
      }
      if (status.sharer) {
        result += ' ' + status.sharer
      }
      return result
    },
    niceDate (tms) {
      return new Date(tms).toLocaleString()
    },
    close () {
      this.$emit('close')
    },
    showTxOnChain (txHash) {
      window.open(`https://whatsonchain.com/tx/${txHash}`, '_blank')
    },
    selectHistory (id) {
      console.log(id)
      this.$emit('selected', id)
    }
  },
  mounted () {
    console.log(this.hiddenButton)
  }
}
</script>

<style></style>
