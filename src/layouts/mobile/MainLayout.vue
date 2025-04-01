<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="mobile-header">
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          icon="menu"
          aria-label="Menu"
        />

        <q-toolbar-title>
          <div class="text-h4">
            <img
              src="dark - combi - std.svg"
              width="150"
            >
          </div>
        </q-toolbar-title>

        <q-btn
          flat
          dense
          round
          icon="search"
          aria-label="Search"
          :color="showSearch ? 'orange' : 'white'"
          @click="search()"
        />
        <sort />

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
      <q-scroll-area style="height: calc(100% - 180px); margin-top: 180px; ">
        <q-list dark>
          <q-item-label header />

          <q-item
            class="text-grey-4 disable_context_menu"
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
            class="text-grey-4 disable_context_menu"
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
            class="text-grey-4 disable_context_menu"
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
            class="text-grey-4 disable_context_menu"
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
        style="height: 160px;margin-top: 50px;"
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
      <search
        v-if="showSearch"
        ref="search"
      />
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import _ from 'lodash'

const openURL = (url) => { window.location = url }

export default {
  name: 'MainLayout',

  data () {
    return {
      showSearch: false,
      leftDrawerOpen: false
    }
  },
  components: {
    search: require('components/Notes/Tools/mobile/Search.vue').default,
    sort: require('components/Notes/Tools/mobile/Sort.vue').default
  },
  methods: {
    openURL,
    ...mapActions('account', ['lock']),
    ...mapActions('notes', ['svFetchAllNotes', 'setSearch']),
    search () {
      this.showSearch = !this.showSearch
      if (this.showSearch === false) {
        // 清空搜索
        this.setSearch('')
      }
    }
  },

  computed: {
    ...mapState('account', ['walletBalance']),
    ...mapState('notes', ['notes']),
    ...mapState('settings', ['systemSettings'])
  },
  mounted () {
    // 从后台获取所有的记录
    if (_.isEmpty(this.notes)) {
      this.svFetchAllNotes()
    }
    // 设置body背景颜色为白色
    var body = document.body
    if (body.style) {
      setTimeout(() => {
        body.style.backgroundColor = 'white'
      }, 2)
      if (body.parentNode && body.parentNode.style) {
        body.parentNode.style.backgroundColor = 'white'
      }
    }
  }
}
</script>

<style lang="scss">
.q-drawer {
  .q-router-link--exact-active {
    color: white !important;
  }
}

.text-subtitle {
  font-size: 15px;
}
.disable_context_menu {
  -webkit-user-select: none;
}
</style>
