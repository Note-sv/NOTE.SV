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
        <q-toolbar-title>{{ $t('BackupMasterWords') }}</q-toolbar-title>
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
          :title="$t('MasterWords')"
          icon="create_new_folder"
          :done="step > 1"
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
              @click="step = 2"
              color="primary"
              :label="$t('VerifyMasterWords')"
            />
          </q-stepper-navigation>
        </q-step>

        <q-step
          :name="2"
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
            />
            <q-btn
              flat
              @click="restart"
              color="primary"
              :label="$t('Restart')"
              class="q-ml-sm"
            />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </q-page-container>
  </q-layout>
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
      step: 1,
      mnLang: null,
      mnLangOptions: config.mnLangOptions,
      mnWords: [12],
      inputWords: [12]
    }
  },
  computed: {
    ...mapState('account', ['seedString', 'walletPath', 'lang']),
    ...mapState('settings', ['userSettings'])
  },
  components: {
    'verify-mnemonic': require('components/Notes/Tools/VerifyMnemonic.vue')
      .default
  },
  methods: {
    ...mapActions('account', ['saveAccount']),
    ...mapActions('settings', ['setWordsConfirmed']),
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
    verifySeed () {
      try {
        console.log(this.inputWords)
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
          this.setWordsConfirmed(true)

          // 如果是导入的种子，或者同第二步创建的种子一致
          this.$q.notify({
            color: 'positive',
            message: this.$t('MasterWordsVerified'),
            position: 'top'
          })

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
    }
  },
  mounted () {
    this.restart()
  }
}
</script>
