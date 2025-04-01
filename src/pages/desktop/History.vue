<template>
  <q-page>
    <div class="absolute full-width  full-height">
      <q-btn
        v-go-back="'/settings'"
        :label="$t('Return')"
        class="q-ma-sm"
      />
      <no-note
        v-if="!Object.keys(recordsSorted).length"
        :message="$t('NoRecordsMessage')"
        :hidden-button="true"
      />
      <div
        class="q-gutter-py-md"
        style="min-height: inherit;"
      >
        <q-scroll-area
          ref="scroll"
          class="q-scroll-area"
          :style="{ height: scrollerHeight + 'vh' }"
        >
          <records
            :records="recordsSorted"
            :title="$t('RecordHistories')"
          />
        </q-scroll-area>
      </div>
    </div>
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex'
// import config from '../../config'
// const console = config.console

export default {
  data () {
    return {
      scrollerHeight: 85
    }
  },
  computed: {
    ...mapGetters('records', ['recordsSorted'])
  },
  components: {
    'no-note': require('components/Notes/NoNote.vue').default,

    records: require('components/Shared/Records.vue').default
  },
  methods: {},
  mounted () {},
  destroyed () {}
}
</script>

<style></style>

<style lang="scss">
.q-scroll-area {
  display: flex;
  flex-grow: 1;
}
</style>
