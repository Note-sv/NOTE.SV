<template>
  <q-page padding>
    <div
      class="q-gutter-y-md"
      style="max-width: 600px"
    >
      <div>
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
      </div>
      <div v-html="$t('ChargeMessage')" />

      <div />
      <q-card>
        <q-tabs
          v-model="tab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab
            name="wallet"
            :label="$t('Wallet')"
            v-show="systemSettings.chargeServices.wallet.desktop"
            no-caps
          />
          <q-tab
            name="chainbow"
            :label="$t('ChainBow')"
            no-caps
          />
          <q-tab
            name="buybsv"
            no-caps
            :label="$t('buyBSV')"
            v-show="systemSettings.chargeServices.buybsv.desktop"
          />
          <q-tab
            name="dotwallet"
            :label="$t('DotWallet')"
            v-show="systemSettings.chargeServices.dotwallet.desktop"
            no-caps
          />
          <q-tab
            name="moneybutton"
            :label="$t('MoneyButton')"
            v-show="systemSettings.chargeServices.moneybutton.desktop"
            no-caps
          />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="tab"
          animated
        >
          <q-tab-panel name="buybsv">
            <div v-html="$t('buyBSVMessage')" />
            <q-field
              standard
              :label="$t('ChargeAddress')"
              stack-label
              class="col"
            >
              <template #control>
                <div
                  class="self-center full-width no-outline"
                  tabindex="0"
                  @click="copy(walletAddress)"
                >
                  {{ walletAddress }}
                </div>
              </template>

              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(walletAddress)"
                  class="cursor-pointer"
                />
              </template>
            </q-field>
            <br>
            <div class="row no-wrap items-center ">
              <q-btn
                size="18px"
                icon="img:coinify.svg"
                @click="chargeViaBuyBSV"
                no-caps
                :label="$t('buyBSV')"
              />
              <q-space />
              <div>
                {{ '1BSV' }}={{ Number(1e8).toLocaleString() + $t('Satoshi') }}
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="chainbow">
            <div v-html="$t('ChargeChainBowMessage')" />

            <div>{{ $t('ChargeAmount') }}</div>
            <q-slider
              v-model="amountSatoshi"
              :min="10000"
              :max="1000000"
              :step="10000"
              label
              label-always
              :label-value="amountSatoshi.toLocaleString() + $t('Satoshi')"
              color="purple"
            />
            <div class="row no-wrap items-center ">
              <q-btn
                size="18px"
                icon="img:chainbow.png"
                @click="chargeViaChainBow"
                :label="$t('ChainBow')"
                no-caps
              />
              <q-space />
              <div>
                {{ amountSatoshi.toLocaleString() + $t('Satoshi') }}={{
                  amountSatoshi / 1e8 + 'BSV'
                }}
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="dotwallet">
            <div v-html="$t('ChargeDotWalletMessage')" />

            <div>{{ $t('ChargeAmount') }}</div>
            <q-slider
              v-model="amountSatoshi"
              :min="10000"
              :max="1000000"
              :step="10000"
              label
              label-always
              :label-value="amountSatoshi.toLocaleString() + $t('Satoshi')"
              color="purple"
            />
            <div class="row no-wrap items-center ">
              <q-btn
                size="18px"
                icon="img:dotwallet-logo.png"
                @click="chargeViaDotWallet"
                :label="$t('DotWallet')"
                no-caps
              />
              <q-space />
              <div>
                {{ amountSatoshi.toLocaleString() + $t('Satoshi') }}={{
                  amountSatoshi / 1e8 + 'BSV'
                }}
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="moneybutton">
            <div v-html="$t('ChargeMoneyButtonMessage')" />

            <div>{{ $t('ChargeAmount') }}</div>
            <q-slider
              v-model="amountUSD"
              :min="1"
              :max="50"
              :step="1"
              label
              label-always
              :label-value="amountUSD.toLocaleString() + $t('USD')"
              color="purple"
            />
            <div class="row no-wrap items-center ">
              <q-btn
                size="18px"
                icon="img:moneybutton.png"
                @click="chargeViaMoneyButton"
                no-caps
                :label="$t('MoneyButton')"
              />
            </div>
          </q-tab-panel>

          <q-tab-panel name="wallet">
            <qrcode
              :value="walletAddress"
              :options="{ width: 200 }"
            />
            <q-field
              standard
              :label="$t('ChargeAddress')"
              stack-label
              class="col"
            >
              <template #control>
                <div
                  class="self-center full-width no-outline"
                  tabindex="0"
                  @click="copy(walletAddress)"
                >
                  {{ walletAddress }}
                </div>
              </template>

              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(walletAddress)"
                  class="cursor-pointer"
                />
              </template>
            </q-field>
            <div v-html="$t('ChargeWalletMessage')" />

            <div v-if="alias && alias !== ''">
              <q-field
                standard
                :label="$t('PaymailAddress')"
                stack-label
                class="col"
              >
                <template #control>
                  <div
                    class="self-center full-width no-outline"
                    tabindex="0"
                    @click="copy(paymail)"
                  >
                    {{ paymail }}
                  </div>
                </template>

                <template #append>
                  <q-icon
                    name="file_copy"
                    @click.stop="copy(paymail)"
                    class="cursor-pointer"
                  />
                </template>
              </q-field>
              <div v-html="$t('PaymailAddressMessage')" />
            </div>
            <div v-else>
              <div v-html="$t('NoPaymailAddressMessage')" />
              <q-btn
                to="/alias"
                :label="$t('RegisterAccoun')"
              />
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
    <div class="q-py-md">
      <records
        v-if="chargeRecords.length"
        :records="chargeRecords"
        :title="$t('ChargeHistories')"
      />
    </div>

    <q-dialog
      v-model="showBuyBSV"
      persistent
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card style="min-width: 350px">
        <q-card-section>
          <iframe
            :src="buyBSV.src"
            :style="buyBSV.style"
            :height="buyBSV.style.height"
            :width="buyBSV.style.width"
            frameborder="0"
          />
        </q-card-section>
        <q-card-section align="right">
          <q-btn
            flat
            no-caps
            :label="$t('OpenInBrowser')"
            @click="openBuyBSV"
          />
          <q-btn
            flat
            no-caps
            :label="$t('Close')"
            v-close-popup
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import config from '../../config'
const console = config.console
import { copyToClipboard, openURL, uid } from 'quasar'
import { DWMerchant } from 'dotwallet'

const HOST = 'https://note.sv'
// const HOST = 'http://localhost:8081'

export default {
  data () {
    return {
      amountCNY: 50,
      amountUSD: 10,
      amountSatoshi: 50000,
      tab: 'wallet',
      alias: '',
      showBuyBSV: false,
      buyBSV: {
        src: '',
        style: {
          height: 585,
          width: 500
        },
        data: {
          host: 'https://trade-ui.coinify.com/widget',
          partnerId: 'a3a5502d-593e-4624-b41c-70fdf410ac7e',
          partnerLegacyId: '156',
          partnerName: 'Chainbow'
        }
      }
    }
  },
  computed: {
    ...mapState('settings', ['userSettings', 'systemSettings']),
    ...mapState('account', ['walletAddress', 'walletBalance']),
    ...mapGetters('records', ['chargeRecords']),
    paymail () {
      return this.alias + '@note.sv'
    }
  },
  watch: {
    // 余额有变化，检测订单状态
    walletBalance: {
      handler: async function (val, oldVal) {
      }
    }
  },
  components: {
    qrcode: require('@chenfengyuan/vue-qrcode'),
    records: require('components/Shared/Records.vue').default
  },
  methods: {
    ...mapActions('account', ['getWalletAddress']),

    async chargeViaChainBow () {
      const redirectURI = `notesv://address/${this.walletAddress}?from=chainbow`
      const chargeURI = `payto:${this.alias ? this.paymail : this.walletAddress}?amount=${this.amountSatoshi}&purpose=${encodeURIComponent('charge NOTE.SV')}&return=${encodeURIComponent(redirectURI)}`
      console.log(chargeURI)
      openURL(chargeURI)
    },

    async chargeViaDotWallet () {
      this.$q.loading.show({})
      const noticeURI = 'https://note.sv'
      const redirectURI = `notesv://address/${this.walletAddress}?from=dotwallet`
      const appId = '98983544d834e717444c9aca7d6f2039'
      const secret = 'bd13e13d9dedbf7600d41a1acb8ee566'
      const dotwallet = new DWMerchant(appId, secret, {
        noticeURI,
        redirectURI,
        timeOut: 30 * 1000,
        isMobile: false
      })

      try {
        const order = await dotwallet.CreateOrder(
          uid(),
          'NoteSV',
          this.amountSatoshi,
          '',
          this.walletAddress
        )
        console.log(order)
        if (order.data) {
          const url = dotwallet.GetUserPayURL(order.data.order_sn)
          this.$q.loading.hide()
          openURL(url)
          return
        }
      } catch (e) {
        console.log(e)
      }
      this.$q.loading.hide()
      this.$q.notify({
        color: 'negative',
        message: this.$t('ChargeFails'),
        position: 'center',
        badgeStyle: 'background-color: #ff0000'
      })
    },
    chargeViaMoneyButton () {
      const redirectURI = encodeURIComponent(
        `notesv://address/${this.walletAddress}?from=moneybutton`
      )
      let paymail = ''
      if (this.alias) {
        paymail = this.paymail
      }
      const chargeURI = `${HOST}/mb-charge?address=${this.walletAddress}&amount=${this.amountUSD}&paymail=${paymail}&return=${redirectURI}`
      openURL(chargeURI)
    },
    chargeViaRelayX () {
      const redirectURI = encodeURIComponent(
        `notesv://address/${this.walletAddress}?from=relayx`
      )
      let paymail = ''
      if (this.alias) {
        paymail = this.paymail
      }
      const chargeURI = `${HOST}/relayx-charge?address=${this.walletAddress}&amount=${this.amountSatoshi}&paymail=${paymail}&return=${redirectURI}`

      openURL(chargeURI)
    },

    chargeViaBuyBSV () {
      const partner = this.buyBSV.data
      const chargeURI = `${partner.host}?partnerId=${partner.partnerLegacyId}&partnerName=${partner.partnerName}&cryptoCurrencies=BSV&address=${this.walletAddress}&targetPage=buy`
      this.buyBSV.src = chargeURI
      this.showBuyBSV = true
    },
    openBuyBSV () {
      const partner = this.buyBSV.data
      const chargeURI = `${partner.host}?partnerId=${partner.partnerLegacyId}&partnerName=${partner.partnerName}&cryptoCurrencies=BSV&address=${this.walletAddress}&targetPage=buy`
      openURL(chargeURI)
      this.showBuyBSV = false
    },

    copy (content) {
      copyToClipboard(content)
        .then(() => {
          // success!
          this.$q.notify({
            icon: 'done',
            color: 'positive',
            message: this.$t('Copied'),
            position: 'center',
            badgeClass: 'no-badge',
            timeout: 10
          })
        })
        .catch((e) => {
          console.log(e)
          // fail
          this.$q.notify({
            color: 'negative',
            message: this.$t('CopyFailed'),
            position: 'center',
            badgeStyle: 'background-color: #ff0000'
          })
        })
    }
  },
  mounted () {
    this.getWalletAddress()
    this.tab = 'wallet'
    this.alias = this.systemSettings.alias

    if (this.userSettings.wordsConfirmed === false) {
      // 提示备份助记词
      this.$q.notify({
        color: 'warning',
        message: this.$t('BackupNow'),
        position: 'top'
      })
    }
  },
  destroyed () {
    clearInterval(this.svcTimer)
  }
}
</script>

<style></style>
