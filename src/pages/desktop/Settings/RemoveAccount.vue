<template>
  <div class="q-pa-md">
    <q-stepper
      v-model="step"
      vertical
      color="primary"
      animated
      class="q-mb-md"
    >
      <q-step
        :name="1"
        :title="$t('ConfirmBackup')"
        icon="settings"
        :done="step > 1"
      >
        <div v-html="$t('BackupMessage')" />

        <q-stepper-navigation>
          <q-btn
            @click="step = 2"
            color="primary"
            class="q-ma-md"
            :label="$t('BackupMasterWordsNow')"
          />
          <q-btn
            @click="skipBackup"
            flat
            color="primary"
            :label="$t('SkipBackup')"
            class="q-ma-md"
          />
        </q-stepper-navigation>
      </q-step>
      <q-step
        :name="2"
        :title="$t('MasterWords')"
        icon="create_new_folder"
        :done="step > 2"
      >
        <q-card class="my-card">
          <q-card-section>
            <q-chip
              v-for="(word, index) in mnWords"
              :key="index"
              style="font-size: 1.2em"
            >
              <b>{{ word }}</b>
              <q-badge
                color="orange"
                floating
                transparent
              >
                {{ index + 1 }}
              </q-badge>
            </q-chip>
          </q-card-section>
        </q-card>
        <br>
        <div v-html="$t('MasterWordsMessage')" />

        <q-stepper-navigation>
          <q-btn
            @click="step = 3"
            color="primary"
            class="q-ma-md"
            :label="$t('VerifyMasterWords')"
          />
          <q-btn
            flat
            @click="restart"
            color="primary"
            :label="$t('Restart')"
            class="q-ma-md"
          />
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="3"
        :title="$t('VerifyMasterWords')"
        icon="assignment"
        :done="step > 3"
      >
        <verify-mnemonic
          v-model="inputWords"
          :show-lang-select="false"
          :lang="mnLang"
        />
        <br>
        <div v-html="$t('InputMasterWordsMessage')" />
        <div v-html="$t('MasterWordsMessage')" />

        <q-stepper-navigation>
          <q-btn
            @click="verifySeed"
            color="primary"
            :label="$t('Verify')"
            class="q-ma-md"
          />
          <q-btn
            flat
            @click="restart"
            color="primary"
            :label="$t('Restart')"
            class="q-ma-md"
          />
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="4"
        :title="$t('Withdraw')"
        icon="assignment"
        :done="step > 4"
        v-if="walletBalance > 1000"
      >
        <q-card class="my-card">
          <q-card-section>
            <div v-html="$t('InputAddressMessage')" />

            <div>
              <q-chip
                color="teal"
                text-color="white"
              >
                {{ $t('balanceSatoshi', { walletBalance: walletBalance.toLocaleString() }) }}
              </q-chip>
              <q-input
                ref="address"
                :rules="[
                  (val) =>
                    checkAddressFormat(val) || $t('RequireCorrectAddress'),
                ]"
                v-model="address"
                class="col"
                :hint="
                  $t('AddressFormat') + ':1Pwmd4RCoTbYP6tLWVoDcys1GW5chsve8C'
                "
                :label="$t('WithdrawAddress')"
              />
            </div>
          </q-card-section>
        </q-card>
        <br>
        <div v-html="$t('InputAddressHintMessage')" />

        <q-stepper-navigation>
          <q-btn
            @click="withdraw"
            color="primary"
            :label="$t('WithdrawAll')"
          />
          <q-btn
            flat
            @click="restart"
            color="primary"
            :label="$t('Restart')"
            class="q-ma-md"
          />
          <q-btn
            @click="step = 5"
            flat
            color="primary"
            :label="$t('SkipThisStep')"
            class="q-ma-md"
          />
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="5"
        :title="$t('RemoveAccount')"
        icon="add_comment"
      >
        <q-stepper-navigation>
          <q-btn
            @click="remove"
            color="primary"
            :label="$t('Remove')"
          />
          <q-btn
            @click="step = 4"
            flat
            color="primary"
            :label="$t('ContinueWithdraw')"
            v-if="walletBalance > 1000"
            class="q-ma-md"
          />

          <q-btn
            flat
            @click="restart"
            color="primary"
            :label="$t('Restart')"
            class="q-ma-md"
          />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
    <q-btn
      v-go-back="'/settings'"
      :label="$t('Return')"
      class="q-ma-sm"
    />
  </div>
</template>
<script>
import config from '../../../config'
const console = config.console
import Mnemonic from 'bsv/mnemonic'
import { mapActions, mapState } from 'vuex'
import _ from 'lodash'

export default {
  data () {
    return {
      appName: config.name,
      step: 1,
      mnLang: null,
      mnLangOptions: config.mnLangOptions,
      mnWords: [12],
      inputWords: [12],
      address: ''
    }
  },
  components: {
    'verify-mnemonic': require('components/Notes/Tools/VerifyMnemonic.vue')
      .default
  },
  computed: {
    ...mapState('account', [
      'walletBalance',
      'seedString',
      'walletPath',
      'lang'
    ]),
    ...mapState('settings', ['userSettings'])
  },

  methods: {
    ...mapActions('account', ['saveAccount', 'withdrawAllTo', 'removeAccount']),

    restart () {
      this.mnLang = this.mnLangOptions[
        _.findIndex(this.mnLangOptions, (o) => {
          return o.value === this.lang
        })
      ]
      this.mnWords = this.seedString.split(/\s/)
      this.inputWords = new Array(12)
      this.inputWords.fill('', 0, 12)
      this.step = 1
    },
    skipBackup () {
      if (this.walletBalance > 1000) {
        this.step = 4
      } else {
        this.step = 5
      }
    },
    verifySeed () {
      try {
        const seedString = _.map(this.inputWords, (word) => {
          return word.trim()
        }).join(' ')

        const mnemonic = Mnemonic.fromString(
          seedString,
          Mnemonic.Words[this.lang]
        )
        if (this.seedString === '' || Mnemonic.fromString(
          this.seedString,
          Mnemonic.Words[this.lang]
        ).toString() === mnemonic.toString()) {
          // 如果是导入的种子，或者同第二步创建的种子一致
          if (this.walletBalance > 1000) {
            this.step = 4
          } else {
            this.step = 5
          }
          return
        }
      } catch (e) {
        console.log(e)
      }
      this.$q.notify({
        color: 'negative',
        message: this.$t('InputMissMasterWords'),
        position: 'top'
      })
    },
    async remove () {
      this.$q
        .dialog({
          title: this.$t('Confirm'),
          message: this.$t('ConfirmRemoveMessage'),
          cancel: {
            label: this.$t('Cancel'),
            flat: true
          }
        })
        .onOk(() => {
          this.removeAccount()
        })
        .onCancel(() => {
          // console.log('Cancel')
        })
    },
    async withdraw () {
      this.$refs.address.validate()
      if (this.$refs.address.hasError) {
        this.$q.notify({
          color: 'negative',
          message: this.$t('AddressMissing'),
          position: 'top'
        })
      } else {
        this.$q.loading.show({
          message: this.$t('Withdrawing', { address: this.address })
        })
        // 校验地址是否有效
        await this.withdrawAllTo(this.address)

        this.$q.loading.hide()
        this.step = 5
      }
    },
    checkAddressFormat (val) {
      const bitcoin = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/
      return bitcoin.test(val)
    }
  },
  mounted () {
    this.restart()
  }
}
</script>
