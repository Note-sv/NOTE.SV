<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-primary">
      <q-toolbar class="mobile-header">
        <q-btn
          flat
          round
          icon="arrow_back_ios"
          @click="alertClose"
        />
        <q-toolbar-title>{{ $t('AddNote') }}</q-toolbar-title>
        <q-btn
          flat
          @click="submitForm"
          :label="$t('SaveSubmit')"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page
        padding
        ref="page"
      >
        <mavon-editor
          :language="userSettings.lang.value"
          :toolbars="markdownOption"
          default-open="edit"
          v-model="content"
          :toolbar-top="true"
          :subfield="false"
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

import config from '../../config'
const console = config.console
import _ from 'lodash'
import VueTagsInput from '@johmun/vue-tags-input'

export default {
  data () {
    return {
      id: null,
      noteToSubmit: {
      },
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
  computed: {
    ...mapState('settings', ['userSettings']),
    ...mapState('notes', ['currentNote']),
    ...mapGetters('notes', ['noteTags']),
    tagsAutocomplete () {
      return _.map(Object.keys(this.noteTags), (item) => {
        return { text: item }
      })
    },
    content: {
      get () {
        let ttl = '', mem = ''
        if (this.noteToSubmit.ttl) {
          ttl = this.noteToSubmit.ttl
        }
        if (this.noteToSubmit.mem) {
          mem = this.noteToSubmit.mem
        }

        return ttl + '\n' + mem
      },
      set (value) {
        const valueArray = value.trim().split('\n')
        this.noteToSubmit.ttl = valueArray[0]
        if (valueArray.length > 1) {
          this.noteToSubmit.mem = valueArray.slice(1).join('\n')
        } else {
          this.noteToSubmit.mem = ''
        }
        // 保存成Draft
        // 在500毫秒之内避免重复调用
        this.saveDraft()
      }
    }
  },
  watch: {
    noteToSubmit: {
      handler (val, oldVal) {
        this.saveDraft()
      },
      deep: true
    }
  },
  components: {
    VueTagsInput
  },
  methods: {
    ...mapActions('notes', ['updateNote', 'deleteNote']),

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
      if (this.validCheck()) {
        delete this.noteToSubmit.draft
        this.isSubmitting = true
        const payload = await this.submitNote()
        console.log(payload)
        this.$q.notify({
          icon: 'done',
          color: 'positive',
          message: this.$t('Submited'),
          position: 'top'
        })
        this.$router.back()
      }
    },
    saveDraft: _.debounce( function () {
      // 在500毫秒之内避免重复调用
      // 检查是否需要保存, 不是因为点击保存而失去的焦点
      if (
        !this.isSubmitting &&
        !_.isEqual(this.noteToSubmit, this.currentNote.note)
      ) {
        // 改变draft属性，让画面立即有变化
        Vue.set(this.noteToSubmit, 'draft', true)
        // 异步保存
        this.isSubmitting = true
        this.submitNote().then((result) => {
          this.isSubmitting = false
        })
      }
    }, 1000),
    alertClose () {
      console.log(this.noteToSubmit, this.currentNote.note)
      if (!this.noteToSubmit.ttl) {
        delete this.noteToSubmit.ttl
      }
      if (!this.noteToSubmit.mem) {
        delete this.noteToSubmit.mem
      }
      if (
        !this.noteToSubmit.draft &&
        _.isEqual(this.noteToSubmit, this.currentNote.note)
      ) {
        this.$router.back()
        return
      }

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
          // console.log('I am triggered on both OK and Cancel')
          this.$router.back()
        })
    },
    editLabel () {
      this.showLabel = true
    }
  },
  mounted () {
    console.log(this.currentNote)
    this.id = this.currentNote.id
  }
}
</script>

<style lang="scss">
textarea {
  height: 100% !important;
}

.mavonEditor {
  width: 100%;
  height: 100%;
}
</style>
