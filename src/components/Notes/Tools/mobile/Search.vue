<template>
  <q-input
    v-select-all
    clearable
    v-model="searchField"
    class="col"
    :label="$t('Search')"
    outlined
    @focus="emitFocused(true)"
    @blur="emitFocused(false)"
    autofocus
  >
    <template #append>
      <q-icon name="search" />
    </template>
  </q-input>
</template>

<script>
import { selectAll } from 'src/directives/directive-select-all'
import { mapState, mapActions } from 'vuex'
export default {
  computed: {
    ...mapState('notes', ['search']),
    searchField: {
      get () {
        return this.search
      },
      set (value) {
        this.setSearch(value)
      }
    }
  },
  methods: {
    ...mapActions('notes', ['setSearch']),
    emitFocused (focused) {
      if (this.searchField !== '' && !focused) return
      this.$emit('focused', focused)
    }
  },
  directives: {
    selectAll
  },
  destroyed () {
    this.setSearch('')
  }
}
</script>

<style>
</style>
