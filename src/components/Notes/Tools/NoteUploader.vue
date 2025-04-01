<template>
  <note-uploader
    multiple
    hide-upload-btn
    accept="image/*"
    auto-upload
    flat
    :images="images"
    :resize="resize"
    @added="handleAdded"
    @removed="handleRemoved"
    @uploaded="handleUploaded"
    @failed="handleFailed"
    @error="handleError"
    @insert="handleInsert"
    :max-total-size="1024 * 1024"
    style="width:100%;height:100%;overflow:auto;max-height:fit-content;"
    color="white"
    text-color="black"
    :label="$t('ImageFiles')"
  >
    <template #header="scope">
      <div class="row no-wrap items-center q-pa-sm q-gutter-xs">
        <q-btn
          v-if="images.length > 0"
          icon="clear_all"
          @click="
            scope.reset()
            removeFiles()
          "
          round
          dense
          flat
        >
          <q-tooltip>{{ $t('ClearAll') }}</q-tooltip>
        </q-btn>
        <div class="col">
          <div class="q-uploader__title">
            {{ $t('AttachFiles') }}
          </div>
          <div class="q-uploader__subtitle">
            {{
              $t('nFiles', {
                count: scope.images.length,
                size: scope.uploadedSizeLabel,
                maxTotalSize: scope.humanStorageSize(scope.maxTotalSize),
              })
            }}
          </div>
        </div>
        <q-btn
          v-if="scope.canAddFiles"
          type="a"
          icon="add_box"
          round
          dense
          flat
        >
          <q-uploader-add-trigger />
          <q-tooltip>{{ $t('PickFiles') }}</q-tooltip>
        </q-btn>
      </div>
    </template>
  </note-uploader>
</template>

<script>
import NoteUploader from './NoteUploader'

import config from '../../../config'
const console = config.console
export default {
  props: {
    value: {
      type: Array,
      default: () => { return [] }
    },
    resize: {
      type: Object,
      default: function () {
        return {
          height: 200,
          width: 200
        }
      }
    }
  },
  data () {
    return {
      imgFiles: null
    }
  },
  computed: {
    images: {
      get () {
        return this.value.slice(0)
      },
      set (value) {
        console.log(value)
        this.imgFiles = value
        this.$emit('input', this.imgFiles)
      }
    }
  },
  components: {
    NoteUploader
  },
  methods: {
    handleAdded (newFiles) {},
    handleUploaded ({ file, content, size }) {
      // 文件已经读取成功
      if (!this.imgFiles) {
        this.imgFiles = this.images
      }

      const imgFile = {
        name: file.name,
        path: file.path,
        size: size,
        type: file.type,
        lastModified: file.lastModified,
        content: content
      }
      this.imgFiles.push(imgFile)
      this.$emit('input', this.imgFiles)
      this.$emit('img-added', imgFile)
    },
    handleFailed ({ file }) {
      // 删除出错的文件
      this.imgFiles = this.value.filter((f) => f.name !== file.name)
      this.$emit('input', this.imgFiles)
      this.$emit('img-removed', [file])
    },
    handleRemoved (removedFiles) {
      this.imgFiles = this.value.filter(
        (file) => removedFiles.findIndex((f) => file.name === f.name) === -1
      )
      this.$emit('input', this.imgFiles)
      this.$emit('img-removed', removedFiles)
    },
    removeFiles () {
      this.imgFiles = []
      this.$emit('input', this.imgFiles)
      this.$emit('img-cleared')
    },
    handleError (error) {
      this.$q.notify({
        color: 'negative',
        message: this.$t(error, { maxSize: '1MB' }),
        position: 'top'
      })
      this.$emit('error', error)
    },
    handleInsert (file) {
      const image = this.value.filter((f) => f.name === file.name)[0]
      this.$emit('insert', image)
    }
  }
}
</script>

<style></style>
