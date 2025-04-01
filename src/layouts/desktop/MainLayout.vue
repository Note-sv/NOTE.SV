<template>
  <q-layout view="lHh Lpr lFf">
    <q-header
      elevated
      class="q-electron-drag"
    >
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          icon="menu"
          aria-label="Menu"
        />

        <q-toolbar-title>
          <div class="logo-image">
            <img
              src="dark - combi - std.svg"
              width="180"
            >
          </div>
        </q-toolbar-title>

        <lockScreen
          class="absolute-right"
          ref="lockScreenRef"
        />

        <q-img
          src="background-img.png"
          class="header-image absolute-top"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      :width="250"
      bordered
      content-class="bg-primary"
    >
      <q-scroll-area style="height: calc(100% - 160px); margin-top: 160px; ">
        <q-list dark>
          <q-item-label header />

          <q-item
            class="text-grey-4"
            exact
            clickable
            to="/"
          >
            <q-item-section avatar>
              <q-icon name="vpn_key" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('password') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            class="text-grey-4"
            exact
            clickable
            to="/notes"
          >
            <q-item-section avatar>
              <q-icon name="notes" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('note') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            class="text-grey-4"
            exact
            clickable
            to="/shared"
          >
            <q-item-section avatar>
              <q-icon name="share" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('shared') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            class="text-grey-4"
            exact
            clickable
            to="/labels"
          >
            <q-item-section avatar>
              <q-icon name="label" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('label') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            class="text-grey-4"
            exact
          >
            <q-item-section>
              <q-item-label>
                <q-chip
                  color="teal"
                  text-color="white"
                >
                  {{
                    $t('balanceSatoshi', {
                      walletBalance: walletBalance.toLocaleString(),
                    })
                  }}
                </q-chip>
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            class="text-grey-4"
            exact
            clickable
            to="/charge"
          >
            <q-item-section avatar>
              <q-icon name="add_circle" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('charge') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            class="text-grey-4"
            exact
            clickable
            to="/settings"
          >
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('settings') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <div
        class="absolute-top"
        style="height: 160px"
      >
        <div class="absolute-center bg-transparent text-grey-4">
          <q-btn
            flat
            to="/alias"
            no-caps
          >
            <q-avatar
              size="100px"
              class="q-mb-sm"
            >
              <img
                v-if="systemSettings.alias && systemSettings.photo"
                :src="systemSettings.photo.content"
              >
              <img
                v-else
                src="add-user.png"
              >
            </q-avatar>
            <div v-if="systemSettings.name">
              {{ systemSettings.name }}
            </div>
            <div v-else>
              {{ $t('RegisterAccount') }}
            </div>
          </q-btn>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { openURL } from 'quasar'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'MainLayout',

  data () {
    return {
      leftDrawerOpen: false
    }
  },
  methods: {
    openURL,
    ...mapActions('account', ['lock']),
    ...mapActions('notes', ['svFetchAllNotes'])
  },
  components: {
    lockScreen: require('components/LockScreen.vue').default
  },

  computed: {
    ...mapState('account', ['walletBalance']),
    ...mapState('settings', ['systemSettings'])
  },
  mounted () {
    // 从后台获取所有的记录
    this.svFetchAllNotes()
  }
}
</script>

<style lang="scss">
.q-drawer {
  .q-router-link--exact-active {
    color: white !important;
  }
}
.logo-image {
padding-top: 0.5em;
}
.header-image {
  height: 100%;
  z-index: -1;
  opacity: 0.2;
  filter: grayscale(100%);
}
.text-subtitle {
  font-size: 15px;
}
</style>
