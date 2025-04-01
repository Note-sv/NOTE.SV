<template>
  <q-page padding>
    <q-list
      class="q-mb-md"
      bordered
      padding
    >
      <q-item-label header>
        {{ $t('Settings') }}
      </q-item-label>
      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>{{ $t('AutoLockScreen') }}</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-slider
            v-model="minute"
            :min="0"
            :max="10"
            :step="1"
            label
            label-always
            :label-value="
              minute === 0
                ? $t('NoLock')
                : minute === 1
                  ? $t('minute', { minute })
                  : $t('minutes', { minute })
            "
            @change="locktimeChanged"
          />
        </q-item-section>
      </q-item>
      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>{{ $t('Language') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-select
            v-model="lang"
            :options="langOptions"
          />
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>{{ $t('AutoLaunch') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="autoLaunch" />
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>{{ $t('ResizeImage') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="resizeImage" />
        </q-item-section>
      </q-item>
    </q-list>

    <q-list
      class="q-mb-md"
      bordered
      padding
    >
      <q-item-label header>
        {{ $t('Account') }}
      </q-item-label>

      <q-item
        to="/settings/backup"
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>{{ $t('BackupMasterWords') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
      <q-item
        to="/settings/change_password"
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>{{ $t('ChangeLockPWD') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
      <q-item
        to="/settings/remove_account"
        tag="label"
        v-ripple
        active
        active-class="text-orange"
      >
        <q-item-section>
          <q-item-label>{{ $t('RemoveAccount') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <q-list
      class="q-mb-md"
      bordered
      padding
    >
      <q-item-label header>
        {{ $t('Records') }}
      </q-item-label>

      <q-item
        to="/history"
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>{{ $t('RecordHistories') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>

      <q-item
        to="/deleted"
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>{{ $t('DeletedRecords') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <q-list
      class="q-mb-md"
      bordered
      padding
    >
      <q-item
        @click="visitOurWebsite"
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>{{ $t('help') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section>
          <q-item-label>{{ $t('AppVersion') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          {{ appVersion }}
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script>
import { openURL } from 'quasar'
import { mapActions, mapGetters, mapState } from 'vuex'
import config from '../../../config'

export default {
  data () {
    return {
      langOptions: config.langOptions,
      minute: 2,
      appVersion: require('../../../../package.json').version
    }
  },
  computed: {
    ...mapGetters('settings', ['locktimeByMinutes']),
    ...mapState('settings', ['userSettings']),
    lang: {
      get () {
        return this.userSettings.lang
      },
      set (val) {
        this.setLang(val)
      }
    },
    resizeImage: {
      get () {
        return this.userSettings.resizeImage
      },
      set (val) {
        this.setResizeImage(val)
      }
    },
    autoLaunch: {
      get () {
        return this.userSettings.autoLaunch
      },
      set (val) {
        this.setAutoLaunch(val)
      }
    }
  },
  methods: {
    ...mapActions('settings', [
      'setLang',
      'setLocktime',
      'setBiometricAuth',
      'setResizeImage',
      'setAutoLaunch'
    ]),
    visitOurWebsite () {
      openURL('https://note.sv')
    },
    locktimeChanged () {
      this.setLocktime(this.minute)
      let idleTime = this.userSettings.locktime
      if (idleTime === 0) {
        // 设置一个大值，比如一年
        idleTime = 365 * 24 * 60 * 60 * 1000
      }
      // idle时间要到毫秒
      this.changeIdleTime(idleTime)
    }
  },
  async mounted () {
    this.minute = this.locktimeByMinutes

    if (this.userSettings.wordsConfirmed === false) {
      // 提示备份助记词
      this.$q.notify({
        color: 'warning',
        message: this.$t('BackupNow'),
        position: 'top'
      })
    }
  }
}
</script>

<style></style>
