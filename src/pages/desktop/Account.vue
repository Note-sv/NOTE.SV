<template>
  <div class="q-pa-md">
    <q-stepper
      v-model="step"
      vertical
      color="primary"
      animated
    >
      <q-step
        :name="1"
        :title="$t('Intro')"
        icon="settings"
        :done="step > 1"
      >
        <div v-html="$t('IntroMessage')" />

        <q-stepper-navigation>
          <q-btn
            @click="createSeed"
            color="primary"
            :label="$t('CreateMasterWords')"
            class="q-ma-sm"
          />
          <q-btn
            @click="step = 3"
            flat
            color="primary"
            :label="$t('ImportMasterWords')"
            class="q-ma-sm"
          />
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="2"
        :title="$t('CreateMasterWords')"
        icon="create_new_folder"
        :done="isCreatedSeed"
      >
        <q-slide-item>
          <q-item>
            <q-item-section avatar>
              <div space>
                {{ $t('MnemonicLanguage') }}
              </div>
            </q-item-section>
            <q-item-section>
              <q-select
                style="max-width: 150px"
                v-model="mnLang"
                :options="mnLangOptions"
                @input="changeMnLang"
              />
            </q-item-section>
          </q-item>
        </q-slide-item>

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
            :label="$t('VerifyMasterWords')"
            class="q-ma-sm"
          />
          <q-btn
            flat
            @click="skipVerify"
            color="secondary"
            :label="$t('skipVerify')"
            class="q-ma-sm"
          />
          <q-btn
            flat
            @click="restart"
            color="primary"
            :label="$t('Restart')"
            class="q-ma-sm"
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
          :lang="mnLang"
          @changed="verfiedMnLang"
        />
        <br>
        <div v-html="$t('InputMasterWordsMessage')" />

        <div v-html="$t('MasterWordsMessage')" />

        <q-stepper-navigation>
          <q-btn
            @click="verifySeed"
            color="primary"
            :label="$t('Verify')"
            class="q-ma-sm"
          />
          <q-btn
            v-show="this.seedString !== ''"
            flat
            @click="skipVerify"
            color="secondary"
            :label="$t('skipVerify')"
            class="q-ma-sm"
          />
          <q-btn
            flat
            @click="restart"
            color="primary"
            :label="$t('Restart')"
            class="q-ma-sm"
          />
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="4"
        :title="$t('LockScreenPassword')"
        icon="add_comment"
      >
        <q-card class="my-card">
          <q-card-section>
            <q-input
              ref="password"
              :rules="[(val) => !!val || $t('RequireVal')]"
              v-model="password"
              class="col"
              :label="$t('LockScreenPassword')"
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
              :label="$t('LockScreenPasswordAgain')"
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
            class="q-ma-sm"
          />
          <q-btn
            flat
            @click="restart"
            color="primary"
            :label="$t('Restart')"
            class="q-ma-sm"
          />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </div>
</template>
<script>
import config from '../../config'
const console = config.console
import Mnemonic from 'bsv/mnemonic'
import { mapActions, mapState } from 'vuex'
import _ from 'lodash'

export default {
  data () {
    return {
      appName: config.name,
      step: 1,
      mnWords: [12],
      inputWords: [12],
      password: '',
      passwordAgain: '',
      seedString: '',
      mnLang: null,
      mnLangOptions: config.mnLangOptions,
      wordOptions: Mnemonic.Words.ENGLISH,
      walletPath: "m/44'/236'/0'",
      isShowPwd: true,
      isCreatedSeed: false
    }
  },
  components: {
    'verify-mnemonic': require('components/Notes/Tools/VerifyMnemonic.vue')
      .default
  },

  methods: {
    ...mapActions('account', ['saveAccount']),
    ...mapActions('settings', ['setWordsConfirmed']),
    restart () {
      // 缺省使用英语作为助记词列表
      this.mnLang = this.mnLangOptions[
        _.findIndex(this.mnLangOptions, (o) => {
          return o.value === 'ENGLISH'
        })
      ]
      // 缺省使用画面语言作为助记词语言
      // this.initMnLang()

      this.mnWords = new Array(12)
      this.mnWords.fill('', 0, 12)
      this.seedString = ''
      this.inputWords = new Array(12)
      this.inputWords.fill('', 0, 12)
      this.step = 1
      this.isCreatedSeed = false
      this.setWordsConfirmed(false)
    },
    initMnLang () {
      switch (this.userSettings.lang.value) {
        case 'zh':
          this.mnLang = this.mnLangOptions[
            _.findIndex(this.mnLangOptions, (o) => {
              return o.value === 'CHINESE'
            })
          ]
          break
        case 'ja':
          this.mnLang = this.mnLangOptions[
            _.findIndex(this.mnLangOptions, (o) => {
              return o.value === 'JAPANESE'
            })
          ]
          break
        default:
          this.mnLang = this.mnLangOptions[
            _.findIndex(this.mnLangOptions, (o) => {
              return o.value === 'ENGLISH'
            })
          ]
          break
      }
    },
    createSeed () {
      this.initMnLang()
      this.changeMnLang()
    },
    changeMnLang () {
      this.wordOptions = Mnemonic.Words[this.mnLang.value]
      const mnemonic = Mnemonic.fromRandom(this.wordOptions)
      this.seedString = mnemonic.toString()
      this.mnWords = this.seedString.split(/\s/)
      console.log(this.seedString)
      this.step = 2
      this.isCreatedSeed = true
    },
    verfiedMnLang (lang) {
      // 从校验助记词控件返回了不同的语言
      this.mnLang = lang
    },
    verifySeed () {
      try {
        const seedString = _.map(this.inputWords, (word) => {
          return word.trim()
        }).join(' ')

        const mnemonic = Mnemonic.fromString(
          seedString,
          Mnemonic.Words[this.mnLang.value]
        )
        if (this.seedString === '' || Mnemonic.fromString(
          this.seedString,
          Mnemonic.Words[this.mnLang.value]
        ).toString() === mnemonic.toString()) {
          // 如果是导入的种子，或者同第二步创建的种子一致
          this.seedString = mnemonic.toString()
          this.step = 4
          this.setWordsConfirmed(true)
          return
        }
      } catch (e) {
        console.log(e)
      }
      this.$q.notify({
        color: 'negative',
        message: this.$t('MasterWordsFailed'),
        position: 'top'
      })
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
      this.password = _.trim(this.password)
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
        walletPath: "m/44'/236'/0'",
        lang: this.mnLang.value
      })
      this.$router.push('/').catch((e) => {})
    },
    skipVerify () {
      this.step = 4
    }
  },
  computed: {
    ...mapState('settings', ['userSettings'])
  },
  mounted () {
    this.restart()
  }
}
</script>
