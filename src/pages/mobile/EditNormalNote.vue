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
        <q-toolbar-title>{{ $t('EditNote') }}</q-toolbar-title>
        <q-btn
          flat
          no-caps
          @click="submitForm"
          :label="$t('SaveSubmit')"
        />
        <q-btn-dropdown
          dropdown-icon="more_horiz"
          flat
        >
          <q-list>
            <q-item
              clickable
              v-close-popup
              @click="promptToDelete(id)"
            >
              <q-item-section avatar>
                <q-avatar
                  icon="delete"
                  color="red"
                  text-color="white"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{
                    noteToSubmit.draft ? $t('DeleteDraft') : $t('Delete')
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page ref="page">
        <mavon-editor
          :language="userSettings.lang.value"
          :toolbars="markdownOption"
          default-open="edit"
          :toolbar-top="true"
          :subfield="false"
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

import { mapActions, mapState, mapGetters } from 'vuex'
import config from '../../config'
const console = config.console
import _ from 'lodash'
import VueTagsInput from '@johmun/vue-tags-input'

export default {
  data () {
    return {
      id: null,
      noteToSubmit: {},
      isShowPwd: true,
      closePrompt: false,
      images: [],
      markdownOption: config.markdown,
      showLabel: false,
      isSubmitting: false,
      tag: '',
      tags: []
    }
  },
  components: {
    VueTagsInput
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
          this.deleteNote({ id: id, draft: this.noteToSubmit.draft })
          // 回到一览画面
          this.$router.replace('/notes')
        })
    },
    async submitNote () {
      this.noteToSubmit.tms = Date.now()
      this.noteToSubmit.tpl = 1 // 普通文档
      if (this.txHash) {
        // 设置父交易的tx
        this.noteToSubmit.ptx = this.txHash
      }
      // 转化tags到字符串数组
      if (this.tags.length > 0) {
        this.noteToSubmit.tags = _.map(this.tags, (value) => {
          console.log(value)
          return value.text
        })
      } else {
        // 没有tags就删除对应字段
        delete this.noteToSubmit.tags
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
        this.noteToSubmit.draft = false
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
          this.$router.replace('/notes')
        })
    },
    editLabel () {
      this.showLabel = true
    }
  },

  async mounted () {
    this.$q.loading.show({})

    this.id = this.$router.history.current.params.id

    console.log('mounted', this.id)

    await this.selectNote(this.id)

    this.$q.loading.hide()

    this.noteToSubmit = Object.assign({}, this.currentNote.note)

    if (!this.noteToSubmit.ttl) {
      this.noteToSubmit.ttl = ''
    }
    if (!this.noteToSubmit.mem) {
      this.noteToSubmit.mem = ''
    }

    console.log(this.noteToSubmit)
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

    // 编辑前的txhash
    this.txHash =
      this.currentNote.status.tx_hash ||
      (this.noteToSubmit.draft ? this.noteToSubmit.ptx : null)

    this.tags = []
    if (this.noteToSubmit.tags) {
      // 要求每个tag都是字符串
      this.tags = _.map(
        _.filter(this.noteToSubmit.tags, (value) => {
          return _.isString(value)
        }),
        (value) => {
          console.log(value)
          return { text: value }
        }
      )
      console.log(this.tags)
    }
  }
}
</script>

<style lang="scss">
.mavonEditor {
  width: 100%;
  height: 100%;
}
</style>
