<template>
  <q-layout view="lHh Lpr lFf">
    <q-header
      elevated
      class="q-electron-drag"
    >
      <q-toolbar>
        <q-toolbar-title>
          <div class="text-h3">
            <img
              src="dark - combi - std.svg"
              width="180"
            >
          </div>
        </q-toolbar-title>
        <q-select
          label-color="orange"
          borderless
          class="absolute-right"
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

        <q-img
          src="bright - combi - full.svg"
          class="header-image absolute-top"
        />
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
.header-image {
  height: 100%;
  z-index: -1;
  opacity: 0.2;
  filter: grayscale(100%);
}
</style>
