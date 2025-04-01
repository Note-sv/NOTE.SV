<template>
  <div class="q-ml-sm">
    <q-select
      filled
      v-model="sortBy"
      emit-value
      map-options
      :options="options"
      :label="$t('SortBy')"
      stack-label
      style="width: 120px"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import config from '../../../../config'
const console = config.console

export default {
  data () {
    return {
      options: [
        {
          label: this.$t('title'),
          value: 'ttl'
        },
        {
          label: this.$t('time'),
          value: 'tms'
        }
      ]
    }
  },
  computed: {
    ...mapState('notes', ['sort']),
    sortBy: {
      get () {
        return this.sort
      },
      set (value) {
        console.log(value)
        this.setSort(value)
      }
    }
  },
  methods: {
    ...mapActions('notes', ['setSort'])
  }
}
</script>

<style scoped>
.q-select {
  flex: 0 0 112px;
}
</style>
