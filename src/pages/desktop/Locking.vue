<template>
  <q-page class="row justify-center">
    <q-card
      class="my-card fixed-center"
      style="width: 300px;height:330px"
    >
      <q-card-section>
        <div class="row">
          <div class="col-6 top-image">
            <img
              src="bright - combi - full.svg"
              width="100%"
            >
          </div>
        </div>
        <div class="text-center">
          <q-input
            ref="password"
            v-model="password"
            :label="$t('inputPassword')"
            @keydown.enter="handleUnlock"
            stack-label
            filled
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
          <br>
          <q-btn
            ref="unlockBtn"
            @click="handleUnlock"
            type="button"
            class="unlock-btn"
            :label="$t('unlock')"
            color="primary"
          />
          <br><br>
          <q-btn
            ref="unlockBtn"
            @click="forgotPassword"
            type="button"
            class="unlock-btn"
            :label="$t('forgotPassword')"
            flat
            size="sm"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import config from '../../config'
const console = config.console

export default {
  name: 'Login',
  data () {
    return {
      isShowPwd: true,
      password: ''
    }
  },
  computed: {
    ...mapState('settings', ['userSettings'])
  },
  methods: {
    ...mapActions('account', ['loginWithPassword', 'removeAccount']),

    async validator () {
      this.$q.loading.show({})

      const result = await this.loginWithPassword(this.password)
      this.$q.loading.hide()

      console.log(result)
      return result
    },
    async handleUnlock () {
      if (await this.validator()) {
        this.$q.sessionStorage.set('locking', '0')
        let path = this.$q.sessionStorage.getItem('last_page_path') || this.userSettings.frontPage || '/'
        // 个别时候会出现上一个页面等于locking的情况
        if (path === '/locking') {
          path = this.userSettings.frontPage || '/'
        }
        this.$router.replace(
          {
            path // 解锁之后跳转到锁屏之前的页面
          },
          () => {}
        )
        console.log('handleUnlock', path)
      } else {
        this.$q.notify({
          color: 'negative',
          message: this.$t('PasswordError'),
          position: 'top'
        })
      }
    },
    async forgotPassword () {
      this.$q
        .dialog({
          title: this.$t('ForgotPasswordTitle'),
          message:
            this.$t('ForgotPasswordMessage'),
          ok: {
            label: this.$t('Cancel'),
            color: 'primary',
            flat: true
          },
          cancel: {
            label: this.$t('ResetSystem'),
            color: 'negative',
            flat: true
          },
          persistent: true
        })
        .onOk(() => {
          // do nothing
        })
        .onCancel(() => {
          // 删除本地账号
          this.removeAccount()
        })
        .onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
    }
  }
}
</script>

<style scoped>
.dark {
  background: #1817309a;
}
.top-image {
  margin-top: 2em;
  margin-bottom: 3em;
}
</style>
