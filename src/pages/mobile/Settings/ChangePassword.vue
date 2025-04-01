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
        <q-toolbar-title>{{ $t('ChangeLockPWD') }}</q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-stepper
        v-model="step"
        vertical
        color="primary"
        animated
        class="q-mb-md"
      >
        <q-step
          :name="1"
          :title="$t('ChangePassword')"
          icon="add_comment"
        >
          <q-card class="my-card">
            <q-card-section>
              <q-input
                ref="password"
                :rules="[(val) => !!val || $t('RequireVal')]"
                v-model="password"
                class="col"
                :label="$t('InputNewPassword')"
                autofocus
                :type="isShowPwd ? 'password' : 'text'"
              >
                <template #append>
                  <q-icon
                    :name="isShowPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isShowPwd = !isShowPwd"
                  />
                </template>
              </q-input>
            </q-card-section>
            <q-card-section>
              <q-input
                ref="password-again"
                :rules="[(val) => !!val || $t('RequireVal')]"
                v-model="passwordAgain"
                class="col"
                :label="$t('InputPasswordAgain')"
                :type="isShowPwd ? 'password' : 'text'"
              >
                <template #append>
                  <q-icon
                    :name="isShowPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isShowPwd = !isShowPwd"
                  />
                </template>
              </q-input>
            </q-card-section>
          </q-card>
          <q-stepper-navigation>
            <q-btn
              @click="saveSeedWithPassword"
              color="primary"
              :label="$t('Done')"
            />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </q-page-container>
  </q-layout>
</template>
<script>
import config from '../../../config'
import { mapActions, mapState } from 'vuex'
import _ from 'lodash'

export default {
  data () {
    return {
      appName: config.name,
      step: 1,
      password: '',
      passwordAgain: '',
      isShowPwd: true
    }
  },
  computed: {
    ...mapState('account', ['seedString', 'walletPath', 'lang'])
  },
  methods: {
    ...mapActions('account', ['saveAccount']),
    restart () {
      this.step = 1
    },
    async saveSeedWithPassword () {
      this.$refs.password.validate()
      if (this.$refs.password.hasError) {
        this.$q.notify({
          color: 'negative',
          message: this.$t('CheckRule'),
          position: 'top'
        })
        return
      }
      this.newPassword = _.trim(this.password)
      this.passwordAgain = _.trim(this.passwordAgain)
      if (this.password !== this.passwordAgain) {
        this.$q.notify({
          color: 'negative',
          message: this.$t('PasswordFailed'),
          position: 'top'
        })
        return
      }
      await this.saveAccount({
        seedString: this.seedString,
        password: this.password,
        walletPath: this.walletPath,
        lang: this.lang
      })
      this.$q.notify({
        color: 'positive',
        message: this.$t('PasswordChanged'),
        position: 'top'
      })
    }
  },
  mounted () {
    this.restart()
  }
}
</script>
