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
        <q-toolbar-title>{{ $t('HistoryRecord') }}</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-list
        bordered
        separator
        class="q-mb-md"
      >
        <q-item
          v-for="(item, index) in histories"
          :key="item._id"
          clickable
          v-ripple
          @click="selectedNoteTx(item._id)"
        >
          <q-item-section side>
            {{ index + 1 }}
          </q-item-section>
          <q-item-section>
            {{ niceDate(item.tms) }}
          </q-item-section>
          <q-item-section>{{ niceStatus(item) }}</q-item-section>
          <q-item-section side>
            <div class="row">
              <q-btn
                @click.stop="showTxOnChain(item.tx_hash)"
                flat
                round
                dense
                icon="open_in_new"
                v-if="item.tx_hash"
                label="TX"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <q-dialog
        v-model="showNormalNoteTx"
        v-if="txNote"
      >
        <q-card>
          <q-card-section>
            <div
              class="row q-mb-sm"
              v-if="txNote.note.del"
            >
              {{ $t('Deleted') }}
            </div>
            <markdown-view
              :content="txContent"
              class="scroll"
            />
            <q-separator />
            <div class="row q-mb-sm">
              <small>
                {{ $t('UpdatedOn') }}: {{ niceDate(txNote.note.tms) }}<br>
                {{ niceStatus(txNote.status) }}
              </small>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              v-close-popup
              flat
              color="secondary"
              :label="$t('OK')"
              no-caps
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog
        v-model="showPasswordNoteTx"
        v-if="txNote"
      >
        <q-card>
          <q-card-section>
            <div
              class="row q-mb-sm"
              v-if="txNote.note.del"
            >
              {{ $t('Deleted') }}
            </div>

            <q-field
              standard
              :label="$t('fid')"
              stack-label
              class="col"
              v-if="txNote.note.fid"
            >
              <template #control>
                <div
                  class="self-center full-width no-outline"
                  tabindex="0"
                  @click="copy(txNote.note.fid)"
                >
                  {{ txNote.note.fid }}
                </div>
              </template>

              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(txNote.note.fid)"
                  class="cursor-pointer"
                />
              </template>
            </q-field>

            <q-input
              standard
              v-model="txNote.note.pwd"
              class="col"
              :label="$t('pwd')"
              readonly
              @click="copy(txNote.note.pwd)"
              type="text"
              v-if="txNote.note.pwd"
            >
              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(txNote.note.pwd)"
                  class="cursor-pointer"
                />
              </template>
            </q-input>
            <q-field
              standard
              :label="$t('url')"
              stack-label
              class="col"
              v-if="txNote.note.url"
            >
              <template #control>
                <markdown-view :content="txNote.note.url" />
              </template>

              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(txNote.note.url)"
                  class="cursor-pointer"
                />
              </template>
            </q-field>

            <q-field
              standard
              :label="$t('otp')"
              stack-label
              class="col"
              v-if="txNote.note.otp"
            >
              <template #control>
                <markdown-view :content="txNote.note.otp" />
              </template>

              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(txNote.note.otp)"
                  class="cursor-pointer"
                />
              </template>
            </q-field>

            <q-field
              standard
              :label="$t('memo')"
              stack-label
              class="col"
              v-if="txNote.note.mem"
            >
              <template #control>
                <markdown-view :content="txNote.note.mem" />
              </template>

              <template #append>
                <q-icon
                  name="file_copy"
                  @click.stop="copy(txNote.note.mem)"
                  class="cursor-pointer"
                />
              </template>
            </q-field>
            <div class="row q-mb-sm">
              <small>
                {{ $t('UpdatedOn') }}: {{ niceDate(txNote.note.tms) }}<br>
                {{ niceStatus(txNote.status) }}
              </small>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              v-close-popup
              flat
              color="secondary"
              :label="$t('OK')"
              no-caps
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page-container>
  </q-layout>
</template>

<script>
import config from '../../config'
const console = config.console
import { mapGetters, mapState, mapActions } from 'vuex'
import { Plugins } from '@capacitor/core'
const { Clipboard } = Plugins

export default {
  data () {
    return {
      id: '',
      histories: [],
      showNormalNoteTx: false,
      showPasswordNoteTx: false,
      txNote: null,
      txContent: ''
    }
  },
  components: {
    'markdown-view': require('components/MarkdownView.vue').default
  },
  computed: {
    ...mapState('notes', ['currentNote']),
    ...mapGetters('notes', ['getHistoriesById'])
  },
  methods: {
    ...mapActions('notes', ['selectNoteTxById']),
    copy (content) {
      Clipboard.write({
        string: content
      })
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
          // fail
          this.$q.notify({
            color: 'negative',
            message: this.$t('CopyFailed'),
            position: 'center',
            badgeStyle: 'background-color: #ff0000'
          })
        })
    },

    niceDate (tms) {
      return new Date(tms).toLocaleString()
    },
    niceStatus (status) {
      console.log(status)
      let result = ''
      if (status.addressIndex === 0) {
        result += this.$t('SharedFrom')
      } else if (status.sharer) {
        result += this.$t('SharedTo')
      }
      if (status.sharer) {
        result += ' ' + status.sharer
      }
      switch (status.tx_status) {
        case 0:
        case 1:
        case 2:
        case 3:
          result += '\n' + this.$t(`status.${status.tx_status}`)
          break
        default:
          break
      }
      return result
    },
    async selectedNormalNoteTx (note) {
      if (!note.note.ttl) {
        note.note.ttl = ''
      }
      if (!note.note.mem) {
        note.note.mem = ''
      }
      let content = note.note.ttl + '\n\n' + note.note.mem + '\n\n'
      if (note.files) {
        for (const file of note.note.files) {
          const fixedName = config.fixMDName(file.name)
          content = content + `![${fixedName}](${file.content})`
          this.$markdownIt.image_add(fixedName, file.content)
        }
      } else if (note.note.images) {
        for (const image of note.note.images) {
          const fixedName = config.fixMDName(image.name)

          this.$markdownIt.image_add(fixedName, image.content)
          // 新版中image均已内嵌入markdown
        }
      }

      this.txContent = content
      this.showNormalNoteTx = true
    },
    async selectedNoteTx (noteTxId) {
      const note = await this.selectNoteTxById(noteTxId)
      console.log(note)

      this.txNote = note

      if (note.note.tpl === 1) {
        this.selectedNormalNoteTx(note)
      } else {
        this.showPasswordNoteTx = true
      }
    },
    showTxOnChain (txHash) {
      window.open(`https://whatsonchain.com/tx/${txHash}`, '_blank')
    },
    async showHistories () {
      this.$q.loading.show({})

      this.histories = await this.getHistoriesById(this.id)
      console.log(this.histories)

      this.$q.loading.hide({})
    }
  },
  mounted () {
    this.id = this.$router.history.current.params.id
    this.showHistories()
  }
}
</script>

<style lang="scss">
.no-badge {
  display: none;
}
</style>
