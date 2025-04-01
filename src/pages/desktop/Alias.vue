<template>
  <div class="q-pa-md">
    <q-card class="my-card">
      <q-card-section>
        <q-input
          ref="alias"
          :rules="[
            (val) => /^[a-z0-9._]{3,64}$/.test(val) || $t('RequireAliasRule'),
          ]"
          v-model="alias"
          :label="$t('AccountID')"
          autofocus
          :readonly="aliasExists"
          type="text"
        >
          <template #hint>
            {{ hintMessage }}
          </template>
          <template #append>
            <q-btn
              @click="checkAlias"
              :label="$t('CheckAccountID')"
              class="q-ma-sm"
              v-if="!aliasExists"
            />
          </template>
        </q-input>
      </q-card-section>
      <q-card-section>
        <photo-uploader
          v-model="images"
          :resize="{ width: 200, height: 200 }"
        />
        <q-input
          ref="name"
          :rules="[(val) => !!val || $t('RequireVal')]"
          v-model="name"
          :label="$t('Name')"
          type="text"
        />
        <q-input
          ref="email"
          v-model="email"
          :rules="[
            (val) =>
              /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
                val
              ) || $t('RequireVal'),
          ]"
          hint="ex: yourname@gmail.com, name@yourcompany.com ..."
          :label="$t('Email')"
          type="email"
        />
        <q-btn
          no-caps
          @click="saveAccount"
          :label="$t('SaveAccount')"
          class="q-ma-sm"
        />
        <q-btn
          no-caps
          @click="reset"
          :label="$t('Reset')"
          class="q-ma-sm"
        />
      </q-card-section>
    </q-card>
  </div>
</template>
<script>
import config from '../../config'
const console = config.console
import { mapState, mapMutations } from 'vuex'
import BackService from '../../../lib/back-service'
const backService = new BackService()

export default {
  data () {
    return {
      appName: config.name,
      alias: '',
      email: '',
      name: '',
      photo: null,
      hintMessage: '',
      aliasExists: false
    }
  },
  computed: {
    ...mapState('account', ['seedString', 'walletPath']),
    ...mapState('settings', ['systemSettings']),
    images: {
      get () {
        // 图像文件一览
        if (this.photo) {
          console.log(this.photo)
          return [this.photo]
        } else {
          return []
        }
      },
      set (files) {
        this.photo = files[0]
        console.log(this.photo)
      }
    }
  },
  components: {
    'photo-uploader': require('components/Notes/Tools/PhotoUploader.vue')
      .default
  },
  methods: {
    ...mapMutations('settings', ['setSystemSettings']),

    async checkAlias () {
      try {
        this.alias = this.alias.trim().toLowerCase()
        if ( !/^[a-z0-9._]{3,64}$/.test(this.alias) ) {
          this.$q.notify({
            color: 'negative',
            message: this.$t('CheckRule'),
            position: 'top'
          })
          return false
        }

        const exists = await backService.checkAlias(this.alias)
        if (exists) {
          this.hintMessage = this.$t('id-already-exist')
          return false
        } else {
          this.hintMessage = this.$t('id-available')
          return true
        }
      } catch (error) {
        // 服务器出错
        console.error(error)
        this.$q.notify({
          color: 'negative',
          message: this.$t('ServiceUnavailable'),
          position: 'top'
        })
        return false
      }
    },
    async saveAccount () {
      try {
        this.alias = this.alias.trim().toLowerCase()
        if (!/^[a-z0-9._]{3,64}$/.test(this.alias) ) {
          this.$q.notify({
            color: 'negative',
            message: this.$t('CheckRule'),
            position: 'top'
          })
          return
        }

        this.name = this.name.trim()

        this.$refs.alias.validate()
        this.$refs.name.validate()
        this.$refs.email.validate()

        if (this.$refs.alias.hasError ||
          this.$refs.name.hasError ||
          this.$refs.email.hasError) {
          this.$q.notify({
            color: 'negative',
            message: this.$t('CheckRule'),
            position: 'top'
          })
          return
        }
        this.$q.loading.show({})

        const result = await backService.createAccount(
          this.systemSettings.xpubkey,
          this.alias,
          this.name,
          this.email,
          this.photo
        )

        this.$q.loading.hide()

        this.setSystemSettings({
          alias: this.alias,
          name: this.name,
          email: this.email,
          photo: this.photo
        })
        console.log(this.systemSettings)
        this.aliasExists = true
        this.hintMessage = this.$t('AliasNoModify')
        console.log(result)
        this.$q.notify({
          color: 'positive',
          message: this.$t('Saved'),
          position: 'top'
        })
      } catch (error) {
        this.$q.loading.hide()

        // 服务器出错
        console.error(error)
        this.$q.notify({
          color: 'negative',
          message: this.$t('ServiceUnavailable'),
          position: 'top'
        })
      }
    },
    reset () {
      console.log(this.systemSettings)
      this.alias = this.systemSettings.alias
      this.name = this.systemSettings.name
      if (this.alias) {
        this.photo = this.systemSettings.photo
      }
      this.email = this.systemSettings.email
      if (this.alias) {
        this.aliasExists = true
      }
      this.hintMessage = this.$t('AliasNoModify')
    }
  },
  mounted () {
    this.reset()
  }
}
</script>
