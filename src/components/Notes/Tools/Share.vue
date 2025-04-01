<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">
        {{ $t('Share') }}
      </div>
    </q-card-section>
    <q-card-section>
      <q-input
        ref="alias"
        :rules="[
          (val) =>
            /^[a-z0-9._]{3,64}$/.test(val) || !val || $t('RequireAliasRule'),
        ]"
        v-model="account"
        :label="$t('AccountID')"
        autofocus
        type="text"
        @keydown.enter.prevent="addAccount"
      >
        <template #append>
          <q-btn
            @click="addAccount"
            round
            color="primary"
            dense
            icon="add"
            class="q-ma-sm"
          />
        </template>
      </q-input>
    </q-card-section>

    <q-card-section>
      <q-list
        bordered
        v-if="contacts.length > 0"
      >
        <q-item
          v-for="contact in contacts"
          :key="contact.id"
          class="q-mb-sm"
          v-ripple
        >
          <q-item-section avatar>
            <q-avatar>
              <img :src="contact.avatar">
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ contact.name }}</q-item-label>
            <q-item-label
              caption
              lines="1"
            >
              {{ contact.paymail }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn
              round
              dense
              icon="remove"
              @click="removeAccount(contact.paymail)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn
        v-close-popup
        flat
        color="secondary"
        :label="$t('Cancel')"
        no-caps
      />
      <q-btn
        @click="share"
        flat
        color="primary"
        :label="$t('Share')"
        no-caps
        :disable="contacts.length === 0"
      />
    </q-card-actions>
  </q-card>
</template>

<script>
import { date } from 'quasar'
import config from '../../../config'
const console = config.console

import { mapState, mapActions } from 'vuex'
import BackService from '../../../../lib/back-service'
const backService = new BackService()

import _ from 'lodash'

export default {
  props: {
    id: {
      type: Number,
      default: function () {
        return 0
      }
    },
    shareCard: Boolean
  },
  data () {
    return {
      isShow: true,
      account: '',

      contacts: []
    }
  },
  computed: {
    ...mapState('notes', ['currentNote']),
    ...mapState('settings', ['systemSettings']),
    status () {
      const status = this.currentNote.status
      switch (status.tx_status) {
        case 0:
        case 1:
        case 2:
        case 3:
          return this.$t(`status.${status.tx_status}`)
        default:
          return ''
      }
    },
    niceDate () {
      return date.formatDate(this.currentNote.note.tms, config.dateFormat)
    }
  },
  methods: {
    ...mapActions('notes', ['shareNote']),
    async addAccount () {
      this.account = this.account.trim().toLowerCase()
      if (!this.account.match(/^[a-z0-9._]{3,64}$/)) {
        this.$q.notify({
          color: 'negative',
          message: this.$t('CheckRule'),
          position: 'top'
        })
        return
      }

      const paymail = `${this.account.trim()}@note.sv`
      console.log(paymail, this.currentNote.status)

      const alias = this.systemSettings.alias
      if (this.account.trim() === alias) {
        console.warn('dont share to self', alias)
        this.$q.notify({
          color: 'negative',
          message: this.$t('DontShare2Self'),
          position: 'center',
          badgeStyle: 'background-color: #ff0000'
        })
        return
      }

      try {
        this.$q.loading.show({})

        if ( _.findIndex(this.contacts, function (o) { return o.paymail === paymail }) === -1) {
        // 获取Profile
          const profile = await backService.getPublicProfile(paymail)
          // 获取根Publickey
          const pubkey = await backService.getRootPublicKey(paymail)
          console.log(profile)
          profile.paymail = paymail
          profile.pubkey = pubkey
          console.log(profile)
          this.contacts.push(profile)
        }
        this.account = ''
        this.$q.loading.hide()
      } catch (e) {
        console.log(e)
        this.$q.loading.hide()

        if (e.message.match(/not-found/)) {
          // 没找到
          this.$q.notify({
            color: 'negative',
            message: this.$t('PaymailNotFound'),
            position: 'top'
          })
        } else {
          this.$q.notify({
            color: 'negative',
            message: this.$t('error'),
            position: 'top'
          })
        }
      } finally {
      }
    },

    removeAccount (paymail) {
      console.log(paymail)
      this.contacts = _.remove(this.contacts, function (obj) {
        return obj.paymail !== paymail
      })
    },
    async share () {
      try {
        const contacts = _.map(this.contacts, (obj) => {
          return {
            paymail: obj.paymail,
            pubkey: obj.pubkey
          }
        })
        const alias = this.systemSettings.alias
        const payload = {
          pay: `${alias}@note.sv`, // 分享者的paymail地址
          id: this.id, // 被分享笔记的id
          tx: this.currentNote.status.tx_hash, // 被分享笔记所在的交易hash
          addressIndex: parseInt(this.currentNote.status.addressIndex), // 被分享笔记使用的地址索引， 通过这个地址索引可以获取加密笔记用的私钥
          contacts
        }
        console.log(payload)

        this.$q.loading.show({})
        await this.shareNote(payload)
      } catch (e) {
        console.log(e)
      } finally {
        this.$q.loading.hide()
      }
      this.$emit('close')
    }
  },
  mounted () {
    this.isShow = this.shareCard
  }
}
</script>

<style></style>
