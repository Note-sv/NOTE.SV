<template>
  <q-item
    clickable
    v-ripple
    :class="statusColor"
  >
    <q-item-section v-if="record.type === 'charge'">
      <q-item-label class="row justify-left">
        <q-icon
          name="attach_money"
          class="text-primary"
          style="font-size: 18px;"
        />
        {{ $t('ChargeSatoshi', { satoshi: record.income.toLocaleString() }) }}
      </q-item-label>
    </q-item-section>

    <q-item-section v-else-if="record.type === 'withdraw'">
      <q-item-label class="row justify-left">
        <q-icon
          name="send"
          class="text-secondary"
          style="font-size: 18px;"
        />
        {{
          $t('WithdrawSatoshi', { satoshi: record.outcome.toLocaleString() })
        }}
      </q-item-label>
    </q-item-section>

    <q-item-section v-else>
      <q-item-label class="row justify-left">
        <q-icon
          name="receipt"
          class="text-info"
          style="font-size: 18px;"
        />
        {{
          $t('SpendSatoshi', {
            satoshi: (record.outcome - record.income).toLocaleString(),
          })
        }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      v-if="record.time"
      side
    >
      <q-item-label
        class="row justify-end"
        caption
      >
        {{ record.time | niceDate }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="row">
        <q-btn
          @click.stop="showTxOnChain(record._id)"
          flat
          round
          dense
          color="primary"
          label="Tx"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<script>
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
    record: {
      type: Object,
      default: () => { return {} }
    }
  },
  data () {
    return {}
  },
  methods: {
    showTxOnChain (txHash) {
      window.open(`https://whatsonchain.com/tx/${txHash}`, '_blank')
    }
  },
  components: {},
  computed: {
    statusColor () {
      if (this.record.tx_height > 0) {
        return ''
      } else {
        return 'bg-green-1'
      }
    }
  },
  filters: {
    niceDate (val) {
      if (val) {
        return new Date(val).toLocaleString()
      } else {
        return ''
      }
    }
  }
}
</script>

<style></style>
