<template>
  <q-layout view="lHh lpr lFf">
    <q-header elevated>
      <q-toolbar class="mobile-header">
        <q-toolbar-title>
          <div class="text-h3">
            <img
              src="dark - combi - std.svg"
              width="150"
            >
          </div>
        </q-toolbar-title>
        <q-select
          label-color="orange"
          borderless
          class="absolute-right mobile-header"
          v-model="lang"
          :options="langOptions"
        >
          <template #append>
            <q-icon
              name="language"
              color="orange"
            />
          </template>
        </q-select>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import config from '../../config'

export default {
  data () {
    return {
      langOptions: config.langOptions

    }
  },
  computed: {
    ...mapState('settings', ['userSettings']),
    lang: {
      get () {
        return this.userSettings.lang
      },
      set (val) {
        this.setLang(val)
      }
    }
  },
  methods: {
    ...mapActions('settings', ['setLang'])
  }
}
</script>

<style lang="scss">

.q-drawer {
  .q-router-link--exact-active {
    color: white !important;
  }
}

</style>
