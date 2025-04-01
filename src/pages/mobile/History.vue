<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-primary">
      <q-toolbar class="mobile-header">
        <q-btn
          flat
          round
          icon="arrow_back_ios"
          @click="$router.back()"
        />
        <q-toolbar-title>{{ $t('RecordHistories') }}</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page>
        <div class="absolute full-width  full-height">
          <no-note
            v-if="!Object.keys(recordsSorted).length"
            :message="$t('NoRecordsMessage')"
            :hidden-button="true"
          />
          <div
            class="q-gutter-py-md"
            style="min-height: inherit;"
            v-else
          >
            <q-list
              separator
              bordered
            >
              <record
                v-for="(record, key) in recordsSorted"
                :record="record"
                :key="key"
                :id="key"
              />
            </q-list>
          </div>
        </div>
        <q-page-scroller
          expand
          position="top"
          :scroll-offset="50"
          :offset="[0, 0]"
        >
          <div
            class="col cursor-pointer q-pa-sm bg-accent text-white text-center"
          >
            {{ $t('ScrollBackUp') }}
          </div>
        </q-page-scroller>
      </q-page>
    </q-page-container>
  </q-layout>
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
    record: require('components/Shared/Record.vue').default
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
