import { QBtn, QIcon, QUploaderBase, format } from 'quasar'
import config from '../../../config'
const console = config.console

export default {
  name: 'NoteUploader',

  // 混合QUploaderBase
  mixins: [QUploaderBase],

  props: {
    images: Array,
    resize: Object
  },
  data () {
    return {
      xhrs: [],
      workingThreads: 0
    }
  },

  mounted () {
    this.uploadSize = 0
    this.uploadedSize = 0
    for (const file of this.images) {
      this.uploadSize += file.size
      this.uploadedSize += file.size
    }
  },

  computed: {

    canAddFiles () {
      console.log(this.uploadedSize, this.maxTotalSizeNumber)
      return true
      // return (
      //   this.editable === true &&
      //   this.isUploading === false &&
      //   // if single selection and no files are queued:
      //   (this.multiple === true || this.queuedFiles.length === 0) &&
      //   // if max-files is set and current number of files does not exceeds it:
      //   (this.maxFiles === undefined || this.files.length < this.maxFilesNumber) &&
      //   // if max-total-size is set and current upload size does not exceeds it:
      //   (this.maxTotalSize === undefined || this.uploadedSize < this.maxTotalSizeNumber)
      // )
    },
    // we're working on uploading files
    isUploading () {
      return this.workingThreads > 0
    },

    // shows overlay on top of the
    // uploader signaling it's waiting
    // on something (blocks all controls)

    isBusy () {
      return false
    }

  },

  methods: {
    // abort and clean up any process
    // that is in progress
    abort () {
      this.xhrs.forEach(x => { x.abort() })
    },

    upload () {
      if (this.canUpload === false) {
        return
      }

      const queue = this.queuedFiles.slice(0)
      this.queuedFiles = []

      queue.forEach(file => {
        this.__runFactory(file)
      })
    },

    __runFactory (file) {
      this.workingThreads++

      this.__uploadFiles(file)
    },

    _calculateImageSize (imageBase64) {
      const base64Str = imageBase64.split(',')[1]

      let padding = 0
      if (base64Str.endsWith('==')) padding = 2
      else if (base64Str.endsWith('=')) padding = 1

      const base64StringLength = base64Str.length
      const inBytes = (base64StringLength / 4 ) * 3 - padding
      return inBytes
    },

    __uploadFiles (file) {
      const reader = new FileReader()

      let aborted

      reader.onload = (args) => {
        const content = reader.result

        const emit = (content) => {
          this.__updateFile(file, 'uploaded')
          const contentSize = this._calculateImageSize(content)

          console.log('file.size and resized:', file.size, contentSize)

          // filter max file size
          if (this.maxFileSize !== undefined && contentSize > this.maxFileSize) {
            if (this.files.length > 0) {
              this.files = this.files.slice(0, this.files.length - 1)
              this.$emit('error', 'exceed-max-total-size')
              return
            }
          }

          if (this.maxTotalSize !== undefined && this.uploadedSize + contentSize > this.maxTotalSize) {
            this.files = this.files.slice(0, this.files.length - 1)
            this.$emit('error', 'exceed-max-total-size')
            return
          }

          // 已经上传的大小
          this.uploadedSize += contentSize

          console.log(this.uploadedSize)

          this.$emit('uploaded', { file, content, size: contentSize })
          this.workingThreads--
          this.xhrs = this.xhrs.filter(x => x !== reader)
        }

        if (this.resize && this.resize.width && this.resize.height) {
          // 画像をリサイズする
          const image = new Image()
          image.onload = () => {
            if (this.resize.width >= image.width || this.resize.height >= image.height) {
              // 通知客户端
              emit(content)
              return
            }

            let width, height
            if (image.width > image.height) {
              // 横長の画像は横のサイズを指定値にあわせる
              const ratio = image.height / image.width
              width = this.resize.width
              height = this.resize.width * ratio
            } else {
              // 縦長の画像は縦のサイズを指定値にあわせる
              const ratio = image.width / image.height
              width = this.resize.height * ratio
              height = this.resize.height
            }
            // サムネ描画用canvasのサイズを上で算出した値に変更
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            // canvasに既に描画されている画像をクリア
            ctx.clearRect(0, 0, width, height)
            // canvasにサムネイルを描画
            ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height)

            // canvasからbase64画像データを取得
            const resizedImageContext = canvas.toDataURL('image/jpeg', 0.85)
            // 通知客户端
            emit(resizedImageContext)
          }
          image.src = content
        } else {
          emit(content)
        }
      }
      reader.onerror = (error) => {
        console.log(error)

        this.queuedFiles = this.queuedFiles.push(file)
        this.__updateFile(file, 'failed')

        this.$emit('failed', { file })
        this.workingThreads--
        this.xhrs = this.xhrs.filter(x => x !== reader)
      }
      reader.onprogress = (e) => {
        // console.log(e, e.loaded, e.total)
        if (aborted === true) { }

        this.__updateFile(file, 'uploading', e.loaded)
        this.$emit('uploading', { file })
      }
      reader.onabort = (args) => {
        aborted = true
      }
      reader.onloadstart = (args) => {
        this.__updateFile(file, 'uploading', 0)
      }

      file.xhr = reader
      file.__abort = () => { reader.abort() }

      this.$emit('uploading', { file, reader })
      this.xhrs.push(reader)
      reader.readAsDataURL(file)
    },

    __addFiles (e, fileList) {
      const processedFiles = this.__processFiles(e, fileList)

      if (processedFiles === undefined) { return }

      // 将path做key，而不是name
      const files = processedFiles
        .filter(file => this.files.findIndex(f => file.name === f.name) === -1)

      this.__getFileInput().value = ''

      if (files === undefined) { return }

      for (const file of files) {
        this.__updateFile(file, 'idle')
        this.uploadSize += file.size

        if (this.noThumbnails !== true && file.type.toUpperCase().startsWith('IMAGE')) {
          const img = new Image()
          img.src = window.URL.createObjectURL(file)
          file.__img = img
        }
      }
      // 将文件转换为对象
      this.files = this.files.concat(files)
      this.queuedFiles = this.queuedFiles.concat(files)
      this.$emit('added', files)
      this.autoUpload === true && this.upload()
    },

    __processFiles (e, files) {
      files = Array.from(files || e.target.files)

      // filter file types
      if (this.accept !== undefined) {
        files = files.filter(file => {
          return this.extensions.some(ext => (
            file.type.toUpperCase().startsWith(ext.toUpperCase()) ||
            file.name.toUpperCase().endsWith(ext.toUpperCase())
          ))
        })
        if (files.length === 0) { return }
      }

      // filter max file size
      if (this.resize === undefined && this.maxFileSize !== undefined) {
        files = files.filter(file => file.size <= this.maxFileSize)
        if (files.length === 0) { return }
      }

      // Cordova/iOS allows selecting multiple files even when the
      // multiple attribute is not specified. We also normalize drag'n'dropped
      // files here:
      if (this.multiple !== true) {
        files = [files[0]]
      }

      if (this.resize === undefined && this.maxTotalSize !== undefined) {
        let size = this.uploadSize // 已经上传的数据大小
        for (let i = 0; i < files.length; i++) {
          size += files[i].size
          if (size > this.maxTotalSize) {
            if (i > 0) {
              files = files.slice(0, i)
              break
            } else {
              // 出错
              this.$emit('error', 'exceed-max-total-size')
              return
            }
          }
        }
        if (files.length === 0) { return }
      }

      // do we have custom filter function?
      if (typeof this.filter === 'function') {
        files = this.filter(files)
      }

      files = files.filter(file => this.images.findIndex(f => file.name === f.name) === -1)

      if (files.length > 0) {
        return files
      }
    },

    reset () {
      if (!this.disable) {
        this.abort()
        this.uploadedSize = 0
        this.uploadSize = 0
        this.__revokeImgURLs()
        this.files = []
        this.queuedFiles = []
        this.uploadedFiles = []
        this.$emit('removed', this.images)
      }
    },

    humanStorageSize (size) {
      return format.humanStorageSize(size)
    },

    removeQueuedFiles () {
      if (!this.disable) {
        const removedFiles = []

        const files = this.files.filter(f => {
          if (f.__status !== 'idle' && f.__status !== 'failed') {
            return true
          }

          this.uploadSize -= f.size
          removedFiles.push(f)

          const img = this.images.filter(file => f.name === file.name)[0]
          this.uploadedSize -= img.size

          f._img !== undefined && window.URL.revokeObjectURL(f._img.src)

          return false
        })

        if (removedFiles.length > 0) {
          this.files = files
          this.queuedFiles = []
          this.$emit('removed', removedFiles)
        }
      }
    },

    removeFile (file) {
      if (this.disable) { return }

      if (file.__status === 'uploaded') {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.name !== file.name)
      } else if (file.__status === 'uploading') {
        file.__abort()
      } else {
        this.uploadSize -= file.size
      }

      const img = this.images.filter(f => f.name === file.name)[0]
      this.uploadedSize -= img.size

      this.files = this.files.filter(f => {
        if (f.name !== file.name) {
          return true
        }

        f._img !== undefined && window.URL.revokeObjectURL(f._img.src)

        return false
      })
      this.queuedFiles = this.queuedFiles.filter(f => f.name !== file.name)
      this.$emit('removed', [file])
    },

    __getList (h) {
      if (this.$scopedSlots.list !== undefined) {
        return this.$scopedSlots.list(this)
      }

      return this.images.map(file => h('div', {
        key: file.name,
        staticClass: 'q-uploader__file relative-position',
        class: {
          'q-uploader__file--img': this.noThumbnails !== true && file.content !== undefined,
          'q-uploader__file--uploaded': true
        },
        style: this.noThumbnails !== true && file.content !== undefined ? {
          backgroundImage: 'url(' + file.content + ')'
        } : null
      }, [
        h('div', {
          staticClass: 'q-uploader__file-header row flex-center no-wrap'
        }, [
          file.__status === 'failed'
            ? h(QIcon, {
              staticClass: 'q-uploader__file-status',
              props: {
                name: this.$q.iconSet.type.negative,
                color: 'negative'
              }
            })
            : null,

          h('div', { staticClass: 'q-uploader__file-header-content col' }, [
            h('div', { staticClass: 'q-uploader__title' }, [config.fixMDName(file.name)]),
            h('div', {
              staticClass: 'q-uploader__subtitle row items-center no-wrap'
            }, [
              this.humanStorageSize(file.size)
            ])
          ]),

          h(QBtn, {
            props: {
              round: true,
              dense: true,
              flat: true,
              icon: 'insert_photo'
            },
            on: {
              click: () => { this.$emit('insert', file) }
            }
          }),

          h(QBtn, {
            props: {
              round: true,
              dense: true,
              flat: true,
              icon: this.$q.iconSet.uploader[file.__status === 'uploaded' ? 'done' : 'clear']
            },
            on: {
              click: () => { this.removeFile(file) }
            }
          })

        ])
      ]))
    }
  }
}
