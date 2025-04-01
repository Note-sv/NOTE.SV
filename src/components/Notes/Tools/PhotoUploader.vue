<template>
  <note-uploader
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
    :max-total-size="500 * 1024"
    style="height:100%;"
    color="white"
    :label="$t('ImageFiles')"
  >
    <template #header="scope">
      <q-avatar
        size="100px"
        class="q-mb-sm"
      >
        <img
          v-if="images.length>0"
          :src="images[0].content"
        >
        <img
          v-else
          src="add-user.png"
        >
      </q-avatar>
      <q-btn
        flat
        style="color: black;"
        @click="scope.reset();removeFiles();"
      >
        {{ $t('ChangePhoto') }}
        <q-uploader-add-trigger />
      </q-btn>
    </template>
    <template #list="" />
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
      default: () => {
        return {
          width: 200,
          height: 200
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

      console.log(imgFile)

      this.imgFiles = [imgFile]
      this.images = this.imgFiles
      this.$emit('input', this.imgFiles)
      this.$emit('img-added', imgFile)
    },
    handleFailed ({ file }) {
      // 删除出错的文件
      this.imgFiles = this.value.filter((f) => f.name !== file.name)
      this.images = this.imgFiles
      this.$emit('input', this.imgFiles)
      this.$emit('img-removed', [file])
    },
    handleRemoved (removedFiles) {
      this.imgFiles = this.value.filter(
        (file) => removedFiles.findIndex((f) => file.name === f.name) === -1
      )
      this.images = this.imgFiles
      this.$emit('input', this.imgFiles)
      this.$emit('img-removed', removedFiles)
    },
    removeFiles () {
      this.imgFiles = []
      this.images = this.imgFiles
      this.$emit('input', this.imgFiles)
      this.$emit('img-cleared')
    },
    handleError (error) {
      this.$q.notify({
        color: 'negative',
        message: this.$t(error, { maxSize: '500KB' }),
        position: 'top'
      })
      this.$emit('error', error)
    }
  }
}
</script>

<style></style>
