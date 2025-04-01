<template>
  <q-layout
    view="Lhh lpR fff"
    container
    class="bg-white"
  >
    <q-header :class="txHash ? 'bg-secondary' : 'bg-ino'">
      <q-toolbar>
        <q-toolbar-title>
          {{
            txHash ? $t('EditNote') : $t('AddNote')
          }}
        </q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="alertClose"
        />
      </q-toolbar>
    </q-header>

    <q-footer class="bg-black text-white">
      <q-toolbar align="right">
        <q-btn
          flat
          type="button"
          :label="noteToSubmit.draft ? $t('DeleteDraft') : $t('Delete')"
          color="warning"
          @click="promptToDelete(id)"
          v-if="txHash || noteToSubmit.draft"
        />

        <q-toolbar-title />
        <q-btn
          @click="submitForm"
          :label="$t('SaveSubmit')"
          color="primary"
        />
      </q-toolbar>
    </q-footer>

    <q-page-container>
      <q-page ref="page">
        <mavon-editor
          :language="userSettings.lang.value"
          :toolbars="markdownOption"
          default-open="preview"
          :toolbar-top="true"
          :subfield="true"
          v-model="content"
          :images="images"
          @image-changed="imageChanged"
          @label="editLabel"
          style="min-height: inherit;"
        />
      </q-page>
      <q-dialog v-model="showLabel">
        <q-card style="width: 300px">
          <q-card-section>
            <div class="text-h6">
              {{ $t('label') }}
            </div>
          </q-card-section>
          <q-card-section>
            <vue-tags-input
              v-model="tag"
              :tags="tags"
              @tags-changed="tagsChanged"
              :autocomplete-items="tagsAutocomplete"
              :placeholder="$t('AddLabel')"
              style="min-height: 30px;"
            />
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
import Vue from 'vue'

import { mapState, mapActions, mapGetters } from 'vuex'

import config from '../../../../config'
const console = config.console
import _ from 'lodash'
import VueTagsInput from '@johmun/vue-tags-input'

export default {
  props: {
    id: {
      type: Number,
      default: function () {
        return 0
      }
    }
  },
  data () {
    return {
      noteToSubmit: {},
      txHash: null,
      isShowPwd: true,
      closePrompt: false,
      images: [],
      markdownOption: config.markdown,
      isSubmitting: false,
      showLabel: false,
      tag: '',
      tags: []
    }
  },
  components: {
    VueTagsInput
  },
  watch: {
    noteToSubmit: {
      handler (val, oldVal) {
        // 保存成Draft
        // 在500毫秒之内避免重复调用
        // _.debounce(this.saveDraft, 2000)()
        this.saveDraft()
      },
      deep: true
    }
  },
  computed: {
    ...mapState('notes', ['currentNote']),
    ...mapState('settings', ['userSettings']),
    ...mapGetters('notes', ['noteTags']),
    tagsAutocomplete () {
      return _.map(Object.keys(this.noteTags), (item) => {
        return { text: item }
      })
    },
    content: {
      get () {
        if (this.noteToSubmit.mem === '') {
          return this.noteToSubmit.ttl
        } else {
          return this.noteToSubmit.ttl + '\n' + this.noteToSubmit.mem
        }
      },
      set (value) {
        const valueArray = value.trim().split('\n')
        this.noteToSubmit.ttl = valueArray[0]
        if (!this.noteToSubmit.ttl) {
          return
        }
        if (valueArray.length > 1) {
          this.noteToSubmit.mem = valueArray.slice(1).join('\n')
        } else {
          this.noteToSubmit.mem = ''
        }
      }
    }
  },
  methods: {
    ...mapActions('notes', ['selectNote', 'updateNote', 'deleteNote']),
    tagsChanged (newTags) {
      this.tags = newTags
      if (this.tags.length > 0) {
        this.noteToSubmit.tags = _.map(this.tags, (value) => {
          return value.text
        })
      }
    },
    // 记录在mavonEditor中图片发生的变化
    imageChanged (images) {
      this.images = images
      this.noteToSubmit.images = this.images
    },
    promptToDelete (id) {
      console.log(id)
      let message
      if (this.noteToSubmit.draft) {
        message = this.$t('ConfirmDraftDelete')
      } else {
        message = this.$t('ConfirmDelete')
      }
      this.$q
        .dialog({
          title: this.$t('Confirm'),
          message: message,
          ok: {
            label: this.$t('Yes'),
            color: 'primary',
            flat: true
          },
          cancel: {
            label: this.$t('No'),
            color: 'negative',
            flat: true
          },
          persistent: true
        })
        .onOk(() => {
          this.deleteNote({ id, draft: this.noteToSubmit.draft })
          this.$emit('close')
        })
    },

    async submitNote () {
      this.noteToSubmit.tms = Date.now()
      this.noteToSubmit.tpl = 1 // 普通文档
      if (this.txHash) {
        // 设置父交易的tx
        this.noteToSubmit.ptx = this.txHash
      }
      const payload = {
        id: this.id,
        note: this.noteToSubmit,
        status: {
          status: 0
        }
      }
      return this.updateNote(payload)
    },
    saveDraft: _.debounce( function () {
      console.log(this)
      // 检查是否需要保存, 不是因为点击保存而失去的焦点
      if (
        !this.isSubmitting &&
        !_.isEqual(this.noteToSubmit, this.currentNote.note)
      ) {
        this.isSubmitting = true

        // 改变draft属性，让画面立即有变化
        Vue.set(this.noteToSubmit, 'draft', true)
        // 异步保存
        this.submitNote().then((result) => {
          this.isSubmitting = false
        })
      }
    }, 1000),
    validCheck () {
      if (this.noteToSubmit.ttl === '') {
        this.$q.notify({
          color: 'negative',
          message: this.$t('CheckRule'),
          position: 'top'
        })
        return false
      }
      return true
    },
    async submitForm () {
      console.log(this.noteToSubmit.ttl)
      if (this.validCheck()) {
        this.noteToSubmit.draft = false
        this.isSubmitting = true

        const payload = await this.submitNote()
        this.$q.notify({
          icon: 'done',
          color: 'positive',
          message: this.$t('Submited'),
          position: 'top'
        })
        this.$emit('done', payload)
      }
    },
    alertClose () {
      if (
        !this.noteToSubmit.draft &&
        _.isEqual(this.noteToSubmit, this.currentNote.note)
      ) {
        this.$emit('close')
        return
      }

      // this.closePrompt = true
      this.$q
        .dialog({
          title: this.$t('Close'),
          message: this.$t('CloseHintForSaveDraft'),
          ok: {
            label: this.$t('Yes'),
            color: 'primary',
            flat: true
          },
          cancel: {
            label: this.$t('No'),
            color: 'negative',
            flat: true
          },
          persistent: true
        })
        .onOk(() => {
          this.saveDraft()
        })
        .onCancel(() => {
          if (this.noteToSubmit.draft) {
            this.deleteNote({ id: this.id, draft: this.noteToSubmit.draft })
          }
        })
        .onDismiss(() => {
          this.$emit('close')
          // console.log('I am triggered on both OK and Cancel')
        })
    },
    editLabel () {
      this.showLabel = true
    }
  },

  async mounted () {
    await this.selectNote(this.id)
    this.noteToSubmit = Object.assign({}, this.currentNote.note)
    console.log(this.id, this.noteToSubmit )

    // 编辑前的txhash
    this.txHash =
      this.currentNote.status.tx_hash ||
      (this.noteToSubmit.draft ? this.noteToSubmit.ptx : null)

    if (!this.noteToSubmit.ttl) {
      this.noteToSubmit.ttl = ''
    }
    if (!this.noteToSubmit.mem) {
      this.noteToSubmit.mem = ''
    }

    let content = this.noteToSubmit.ttl + '\n' + this.noteToSubmit.mem
    if (this.noteToSubmit.files) {
      for (const file of this.noteToSubmit.files) {
        console.log(file)
        const fixedName = config.fixMDName(file.name)

        this.$markdownIt.image_add(fixedName, file.content)
        content = content + `![${fixedName}](${file.name})`
      }
      // 老版本的笔记包含files字段，在新版中移植到images字段
      this.noteToSubmit.images = this.noteToSubmit.files.slice(0)
      delete this.noteToSubmit.files
    } else if (this.noteToSubmit.images) {
      for (const image of this.noteToSubmit.images) {
        const fixedName = config.fixMDName(image.name)
        this.$markdownIt.image_add(fixedName, image.content)
        // 新版中image均已内嵌入markdown
      }
    }

    this.content = content
    this.images = this.noteToSubmit.images
  }
}
</script>

<style lang="scss"></style>
