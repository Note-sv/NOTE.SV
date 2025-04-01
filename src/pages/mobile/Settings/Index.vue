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
        <q-toolbar-title>{{ $t('settings') }}</q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-page-container>
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
                    ? $t('LockNow')
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
            v-if="hasBiometric"
          >
            <q-item-section>
              <q-item-label>
                {{
                  faceId ? $t('FaceIDAuth') : $t('TouchIDAuth')
                }}
              </q-item-label>
            </q-item-section>
            <q-toggle v-model="biometricAuth" />
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
              {{ version }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import { Plugins } from '@capacitor/core'
const { BiometricAuth, Device } = Plugins
import config from '../../../config'

const openURL = (url) => { window.location = url }

export default {
  data () {
    return {
      langOptions: config.langOptions,
      hasBiometric: false,
      faceId: true,
      minute: 2,
      version: ''
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
    biometricAuth: {
      get () {
        return this.userSettings.biometricAuth
      },
      set (val) {
        this.setBiometricAuth(val)
      }
    },
    resizeImage: {
      get () {
        return this.userSettings.resizeImage
      },
      set (val) {
        this.setResizeImage(val)
      }
    }
  },
  methods: {
    ...mapActions('settings', [
      'setLang',
      'setLocktime',
      'setBiometricAuth',
      'setResizeImage'
    ]),
    visitOurWebsite () {
      openURL('https://note.sv')
    },
    locktimeChanged () {
      this.setLocktime(this.minute)
    }
  },
  async mounted () {
    this.minute = this.locktimeByMinutes

    const available = await BiometricAuth.isAvailable()
    if (available.has) {
      this.hasBiometric = true
      this.faceId = available.faceID === true
    }

    if (this.userSettings.wordsConfirmed === false) {
      // 提示备份助记词
      this.$q.notify({
        color: 'warning',
        message: this.$t('BackupNow'),
        position: 'top'
      })
    }

    const info = await Device.getInfo()
    this.version = info.appVersion
    if (info.appBuild) {
      this.version = `${info.appVersion}(${info.appBuild})`
    }
  }
}
</script>

<style></style>
