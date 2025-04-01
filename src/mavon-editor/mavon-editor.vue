<template>
  <div
    :class="[{ fullscreen: sFullScreen, shadow: boxShadow }]"
    class="v-note-wrapper markdown-body"
    :style="{ 'box-shadow': boxShadow ? boxShadowStyle : '' }"
  >
    <!--顶部工具栏-->
    <md-toolbar
      v-show="toolbarTop && toolbarsFlag"
      :style="{ background: toolbarsBackground }"
      ref="toolbarTop"
      :editable="editable"
      :transition="transition"
      :d-words="dWords"
      @toolbar-left-click="toolbar_left_click"
      @toolbar-left-addlink="toolbar_left_addlink"
      :toolbars="toolbars"
      @img-manager-open="openImageManager"
      :image-filter="imageFilter"
      :class="{ transition: transition }"
      @toolbar-right-click="toolbar_right_click"
      :s-subfield="sSubfield"
      :s-preview-switch="sPreviewSwitch"
      :s-full-screen="sFullScreen"
      :s-html-code="sHtmlCode"
      :s-navigation="sNavigation"
    />
    <!--编辑展示区域-->
    <div class="v-note-panel">
      <!--编辑区-->
      <div
        ref="vNoteEdit"
        @scroll="$v_edit_scroll"
        class="v-note-edit divarea-wrapper"
        :class="{
          'scroll' : true,
          'scroll-style': s_scrollStyle,
          'scroll-style-border-radius':
            s_scrollStyle && !sPreviewSwitch && !sHtmlCode,
          'single-edit': !sPreviewSwitch && !sHtmlCode,
          'single-show':
            (!sSubfield && sPreviewSwitch) || (!sSubfield && sHtmlCode),
          transition: transition,
        }"
        @click="textAreaFocus"
      >
        <div
          class="content-input-wrapper"
          :style="{ 'background-color': editorBackground }"
        >
          <!-- 双栏 -->
          <v-autoTextarea
            ref="vNoteTextarea"
            :placeholder="placeholder ? placeholder : dWords.start_editor"
            class="content-input"
            :font-size="fontSize"
            line-height="1.5"
            v-model="d_value"
            full-height
            :style="{ 'background-color': editorBackground }"
          />
        </div>
      </div>
      <!--展示区-->
      <div
        :class="{
          'single-show':
            (!sSubfield && sPreviewSwitch) || (!sSubfield && sHtmlCode),
        }"
        v-show="sPreviewSwitch || sHtmlCode"
        class="v-note-show"
      >
        <div
          ref="vShowContent"
          v-html="d_render"
          v-show="!sHtmlCode"
          :class="{
            'scroll' : true,
            'scroll-style': s_scrollStyle,
            'scroll-style-border-radius': s_scrollStyle,
          }"
          class="v-show-content"
          :style="{ 'background-color': previewBackground }"
        />
        <div
          v-show="sHtmlCode"
          :class="{
            'scroll-style': s_scrollStyle,
            'scroll-style-border-radius': s_scrollStyle,
          }"
          class="v-show-content-html"
          :style="{ 'background-color': previewBackground }"
        >
          {{ d_render }}
        </div>
      </div>

      <!--标题导航-->
      <transition name="slideTop">
        <div
          v-show="sNavigation"
          class="v-note-navigation-wrapper"
          :class="{ transition: transition }"
        >
          <div class="v-note-navigation-title">
            {{ dWords.navigation_title
            }}<i
              @click="toolbar_right_click('navigation')"
              class="fa fa-mavon-times v-note-navigation-close"
              aria-hidden="true"
            />
          </div>
          <div
            ref="navigationContent"
            class="v-note-navigation-content"
            :class="{ 'scroll-style': s_scrollStyle }"
          />
        </div>
      </transition>
    </div>
    <!--底部工具栏-->
    <div>
      <md-toolbar
        v-show="!toolbarTop && toolbarsFlag"
        :style="{ background: toolbarsBackground }"
        ref="toolbarBottom"
        :editable="editable"
        :transition="transition"
        :d-words="dWords"
        @toolbar-left-click="toolbar_left_click"
        @toolbar-left-addlink="toolbar_left_addlink"
        :toolbars="toolbars"
        @img-manager-open="openImageManager"
        :image-filter="imageFilter"
        :class="{ transition: transition }"
        @toolbar-right-click="toolbar_right_click"
        :s-subfield="sSubfield"
        :s-preview-switch="sPreviewSwitch"
        :s-full-screen="sFullScreen"
        :s-html-code="sHtmlCode"
        :s-navigation="sNavigation"
      />
    </div>

    <!-- 预览图片 -->
    <transition name="fade">
      <div
        @click="dPreviewImgSrc = null"
        class="v-note-img-wrapper"
        v-if="dPreviewImgSrc"
      >
        <img
          :src="dPreviewImgSrc"
          alt="none"
        >
      </div>
    </transition>
    <!--阅读模式-->
    <div
      :class="{ show: s_readmodel }"
      class="v-note-read-model scroll-style"
      ref="vReadModel"
    >
      <div
        ref="vNoteReadContent"
        class="v-note-read-content"
        v-html="d_render"
      />
    </div>

    <q-dialog
      v-model="img_manager_open"
      :maximized="maximizedToggle"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card style="min-width: 350px">
        <q-bar>
          <q-space />

          <q-btn
            dense
            flat
            icon="minimize"
            @click="maximizedToggle = false"
            :disable="!maximizedToggle"
          >
            <q-tooltip
              v-if="maximizedToggle"
              content-class="bg-white text-primary"
            >
              {{ $t('Minimize') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            icon="crop_square"
            @click="maximizedToggle = true"
            :disable="maximizedToggle"
          >
            <q-tooltip
              v-if="!maximizedToggle"
              content-class="bg-white text-primary"
            >
              {{ $t('Maximize') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            icon="close"
            v-close-popup
          >
            <q-tooltip content-class="bg-white text-primary">
              {{
                $t('Close')
              }}
            </q-tooltip>
          </q-btn>
        </q-bar>
        <q-separator />
        <q-card-section>
          <note-uploader
            v-model="imgFiles"
            @img-added="imgFileAdd"
            @img-removed="imgFileRemove"
            @img-cleared="imgFileClear"
            @insert="imgFileInsert"
            :resize="imgResize"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="help_open"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card style="min-width: 350px">
        <q-bar class="">
          <q-space />
          <q-btn
            dense
            flat
            icon="close"
            v-close-popup
          >
            <q-tooltip content-class="bg-white text-primary">
              {{
                $t('Close')
              }}
            </q-tooltip>
          </q-btn>
        </q-bar>
        <q-card-section class="scroll">
          <markdown-view :content="helpContent" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import config from '../config'
const console = config.console

// import tomarkdown from './lib/core/to-markdown.js'
import { autoTextarea } from 'auto-textarea'
import { keydownListen } from './lib/core/keydown-listen.js'
import hljsCss from './lib/core/hljs/lang.hljs.css.js'
// import hljsLangs from './lib/core/hljs/lang.hljs.js'
const xss = require('xss')
import {
  fullscreenchange,
  /* windowResize, */
  scrollLink,
  insertTextAtCaret,
  getNavigation,
  insertTab,
  unInsertTab,
  insertOl,
  insertUl,
  insertEnter,
  removeLine,
  loadLink,
  loadScript,
  ImagePreviewListener
} from './lib/core/extra-function.js'
import { stopEvent } from './lib/util.js'
import {
  toolbar_left_click,
  toolbar_left_addlink
} from './lib/toolbar_left_click.js'
import { toolbar_right_click } from './lib/toolbar_right_click.js'
import { CONFIG } from './lib/config.js'
// import hljs from './lib/core/highlight.js'
import markdown from './lib/mixins/markdown.js'

import md_toolbar from './components/md-toolbar.vue'
import { mapState, mapMutations } from 'vuex'

import './lib/font/css/fontello.css'
import './lib/css/md.css'
export default {
  mixins: [markdown],
  props: {
    images: {
      // 添附的图像
      type: Array,
      default: () => []
    },
    toolbarTop: {
      // 工具条是否在顶端，false为在底端
      type: Boolean,
      default: true
    },
    scrollStyle: {
      // 是否渲染滚动条样式(webkit)
      type: Boolean,
      default: true
    },
    boxShadow: {
      // 是否添加阴影
      type: Boolean,
      default: true
    },
    transition: {
      // 是否开启动画过渡
      type: Boolean,
      default: true
    },
    autofocus: {
      // 是否自动获取焦点
      type: Boolean,
      default: true
    },
    fontSize: {
      // 字体大小
      type: String,
      default: '14px'
    },
    toolbarsBackground: {
      // 工具栏背景色
      type: String,
      default: '#ffffff'
    },
    editorBackground: {
      // TODO: 编辑栏背景色
      type: String,
      default: '#ffffff'
    },
    previewBackground: {
      // 预览栏背景色
      type: String,
      default: '#fbfbfb'
    },
    boxShadowStyle: {
      // 阴影样式
      type: String,
      default: '0 2px 12px 0 rgba(0, 0, 0, 0.1)'
    },
    help: {
      type: String,
      default: null
    },
    value: {
      // 初始 value
      type: String,
      default: ''
    },
    language: {
      // 初始语言
      type: String,
      default: 'zh-CN'
    },
    subfield: {
      type: Boolean,
      default: true
    },
    navigation: {
      type: Boolean,
      default: false
    },
    defaultOpen: {
      type: String,
      default: null
    },
    editable: {
      // 是否开启编辑
      type: Boolean,
      default: true
    },
    toolbarsFlag: {
      // 是否开启工具栏
      type: Boolean,
      default: true
    },
    toolbars: {
      // 工具栏
      type: Object,
      default () {
        return CONFIG.toolbars
      }
    },
    xssOptions: {
      // 工具栏
      type: Object,
      default () {
        return null
      }
    },
    codeStyle: {
      // <code></code> 样式
      type: String,
      default () {
        return 'github'
      }
    },
    placeholder: {
      // 编辑器默认内容
      type: String,
      default: null
    },
    ishljs: {
      type: Boolean,
      default: true
    },
    externalLink: {
      type: [Object, Boolean],
      default: true
    },
    imageFilter: {
      type: Function,
      default: null
    },
    imageClick: {
      type: Function,
      default: null
    },
    tabSize: {
      type: Number,
      default: 0
    },
    shortCut: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      img_manager_open: false, // 图像管理器
      maximizedToggle: false, // 是否全屏最大化

      help_open: false, // 显示帮助
      helpContent: '', // 帮助内容

      s_right_click_menu_show: false,
      right_click_menu_top: 0,
      right_click_menu_left: 0,
      sSubfield: (() => {
        return this.subfield
      })(),
      s_autofocus: true,
      // 标题导航
      sNavigation: (() => {
        return this.navigation
      })(),
      s_scrollStyle: (() => {
        return this.scrollStyle
      })(), // props 是否渲染滚动条样式
      d_value: '', // props 文本内容
      d_render: '', // props 文本内容render
      sPreviewSwitch: (() => {
        let default_open_ = this.defaultOpen
        if (!default_open_) {
          default_open_ = this.subfield ? 'preview' : 'edit'
        }
        return default_open_ === 'preview'
      })(), // props true 展示编辑 false展示预览
      sFullScreen: true, // 全屏编辑标志
      s_help: false, // markdown帮助
      sHtmlCode: false, // 分栏情况下查看html
      d_help: null,
      dWords: null,
      edit_scroll_height: -1,
      s_readmodel: false,
      s_table_enter: false, // 回车事件是否在表格中执行
      d_history: (() => {
        const temp_array = []
        temp_array.push(this.value)
        return temp_array
      })(), // 编辑记录
      d_history_index: 0, // 编辑记录索引
      currentTimeout: '',
      d_image_file: [],
      dPreviewImgSrc: null, // 图片预览地址
      s_external_link: {
        // markdown_css: function () {
        //   return '../../mavon-editor/resources/markdown/github-markdown.min.css'
        // },
        hljs_js: function () {
          return 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js'
        },
        hljs_lang: function (lang) {
          return (
            'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/languages/' +
            lang +
            '.min.js'
          )
        },
        hljs_css: function (css) {
          if (hljsCss[css]) {
            return (
              'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/' +
              css +
              '.min.css'
            )
          }
          return ''
        },
        katex_js: function () {
          return 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.3/katex.min.js'
        },
        katex_css: function () {
          return 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.3/katex.min.css'
        }
      },
      p_external_link: {},
      textarea_selectionEnd: 0,
      textarea_selectionEnds: [0]
    }
  },
  computed: {
    ...mapState('settings', ['userSettings']),

    imgResize: {
      get () {
        if (this.userSettings.resizeImage) {
          return {
            width: 1024,
            height: 1024
          }
        } else {
          return null
        }
      },
      set (enable) {
        this.setResizeImage(enable)
      }
    },

    imgFiles: {
      get () {
        // 图像文件一览
        return this.images
      },
      set (files) {
        this.$emit('image-changed', files)
      }
    }
  },

  created () {
    var $vm = this
    // 初始化语言
    this.initLanguage()
    this.initExternalFuc()
    this.$nextTick(() => {
      // 初始化Textarea编辑开关
      $vm.editableTextarea()
    })
  },
  mounted () {
    var $vm = this
    // 暂时简直粘贴和拖拽图像
    // this.$el.addEventListener('paste', function (e) {
    //   $vm.$paste(e)
    // })
    // this.$el.addEventListener('drop', function (e) {
    //   $vm.$drag(e)
    // })
    // 浏览器siz大小
    /* windowResize(this); */
    keydownListen(this)
    // 图片预览事件监听
    ImagePreviewListener(this)
    // 设置默认焦点
    if (this.autofocus) {
      this.getTextareaDom().focus()
    }
    // fullscreen事件
    fullscreenchange(this)
    this.d_value = this.value

    // this.loadExternalLink('markdown_css', 'css')
    this.loadExternalLink('katex_css', 'css')
    this.loadExternalLink('katex_js', 'js', function () {
      $vm.iRender(true)
    })
    this.loadExternalLink('hljs_js', 'js', function () {
      $vm.iRender(true)
    })

    if (
      !(
        typeof $vm.externalLink === 'object' &&
        typeof $vm.externalLink.markdown_css === 'function'
      )
    ) {
      // 没有外部文件要来接管markdown样式，可以更改markdown样式。
      $vm.codeStyleChange($vm.codeStyle, true)
    }
  },
  beforeDestroy () {
    // 清除残留在内存中的图像
    this.$markdownIt.image_clear()
  },
  methods: {
    ...mapMutations('setting', ['setResizeImage']),

    loadExternalLink (name, type, callback) {
      if (typeof this.p_external_link[name] !== 'function') {
        if (this.p_external_link[name] !== false) {
          console.error(
            'external_link.' + name,
            'is not a function, if you want to disabled this error log, set external_link.' +
              name,
            'to function or false'
          )
        }
        return
      }
      var _obj = {
        css: loadLink,
        js: loadScript
      }
      if (Object.prototype.hasOwnProperty.call(_obj, type)) {
        _obj[type](this.p_external_link[name](), callback)
      }
    },
    initExternalFuc () {
      var $vm = this
      var _external_ = [
        'markdown_css',
        'hljs_js',
        'hljs_css',
        'hljs_lang',
        'katex_js',
        'katex_css'
      ]
      var _type_ = typeof $vm.externalLink
      var _is_object = _type_ === 'object'
      var _is_boolean = _type_ === 'boolean'
      for (var i = 0; i < _external_.length; i++) {
        if (
          (_is_boolean && !$vm.externalLink) ||
          (_is_object && $vm.externalLink[_external_[i]] === false)
        ) {
          $vm.p_external_link[_external_[i]] = false
        } else if (
          _is_object &&
          typeof $vm.externalLink[_external_[i]] === 'function'
        ) {
          $vm.p_external_link[_external_[i]] = $vm.externalLink[_external_[i]]
        } else {
          $vm.p_external_link[_external_[i]] =
            $vm.s_external_link[_external_[i]]
        }
      }
    },
    textAreaFocus () {
      this.$refs.vNoteTextarea.$refs.vTextarea.focus()
    },
    $drag ($e) {
      var dataTransfer = $e.dataTransfer
      if (dataTransfer) {
        var files = dataTransfer.files
        if (files.length > 0) {
          $e.preventDefault()
          this.$refs.toolbar_left.$imgFilesAdd(files)
        }
      }
    },
    $paste ($e) {
      var clipboardData = $e.clipboardData
      if (clipboardData) {
        var items = clipboardData.items
        if (!items) return
        var types = clipboardData.types || []
        var item = null
        for (var i = 0; i < types.length; i++) {
          if (types[i] === 'Files') {
            item = items[i]
            break
          }
        }
        if (item && item.kind === 'file') {
          // prevent filename being pasted parallel along
          // with the image pasting process
          stopEvent($e)
          var oFile = item.getAsFile()
          this.$refs.toolbar_left.$imgFilesAdd([oFile])
        }
      }
    },
    openImageManager () {
      this.img_manager_open = true
    },

    imgTouch (file) {
      // var $vm = this
      // TODO 跳转到图片位置
    },

    imgFileClear () {
      // 管理器清空了所有图像
    },
    imgDel (file) {
      const fixedName = config.fixMDName(file.name)

      // 从正文中删除图像
      this.markdownIt.image_del(fixedName)
      // 删除所有markdown中的图片
      const regStr = `\\!\\[${fixedName}\\]\\(${fixedName}\\)`
      const reg = new RegExp(regStr, 'g')
      this.d_value = this.d_value.replace(reg, '')
      this.iRender()
    },
    imgFileRemove (files) {
      // 管理器有文件删除
      for (const file of files) {
        this.imgDel(file)
      }
    },
    imgFileAdd (file) {
      // 管理器有图像文件加入
      const fixedName = config.fixMDName(file.name)
      this.markdownIt.image_add(fixedName, file.content)
      this.insertText(this.getTextareaDom(), {
        prefix: '![' + fixedName + '](' + fixedName + ')',
        subfix: '',
        str: ''
      })
    },
    imgFileInsert (file) {
      const fixedName = config.fixMDName(file.name)
      this.insertText(this.getTextareaDom(), {
        prefix: '![' + fixedName + '](' + fixedName + ')',
        subfix: '',
        str: ''
      })
    },
    $imgUpdateByUrl (pos, url) {
      var $vm = this
      this.markdownIt.image_add(pos, url)
      this.$nextTick(function () {
        $vm.d_render = this.markdownIt.render(this.d_value)
      })
    },
    $imgAddByUrl (pos, url) {
      if (this.$refs.toolbar_left.$imgAddByUrl(pos, url)) {
        this.$imgUpdateByUrl(pos, url)
        return true
      }
      return false
    },
    $img2Url (fileIndex, url) {
      // x.replace(/(\[[^\[]*?\](?=\())\(\s*(\.\/2)\s*\)/g, "$1(http://path/to/png.png)")
      var reg_str =
        '/(!\\[\[^\\[\]*?\\]\(?=\\(\)\)\\(\\s*\(' + fileIndex + '\)\\s*\\)/g'
      var reg = new RegExp(reg_str)
      this.d_value = this.d_value.replace(reg, '$1(' + url + ')')
      this.$refs.toolbar_left.$changeUrl(fileIndex, url)
      this.iRender()
    },
    $imglst2Url (imglst) {
      if (imglst instanceof Array) {
        for (var i = 0; i < imglst.length; i++) {
          this.$img2Url(imglst[i][0], imglst[i][1])
        }
      }
    },
    toolbar_left_click (_type) {
      toolbar_left_click(_type, this)
    },
    toolbar_left_addlink (_type, text, link) {
      toolbar_left_addlink(_type, text, link, this)
    },
    toolbar_right_click (_type) {
      toolbar_right_click(_type, this)
    },
    getNavigation ($vm, full) {
      return getNavigation($vm, full)
    },
    // @event
    // 修改数据触发 （val ， val_render）
    change (val, render) {
      this.$emit('change', val, render)
    },
    // 切换全屏触发 （status , val）
    fullscreen (status, val) {
      this.$emit('full-screen', status, val)
    },
    // 打开阅读模式触发（status , val）
    readmodel (status, val) {
      this.$emit('read-model', status, val)
    },
    // 切换阅读编辑触发 （status , val）
    previewtoggle (status, val) {
      this.$emit('preview-toggle', status, val)
    },
    // 切换分栏触发 （status , val）
    subfieldtoggle (status, val) {
      this.$emit('subfield-toggle', status, val)
    },
    // 切换htmlcode触发 （status , val）
    htmlcode (status, val) {
      this.$emit('html-code', status, val)
    },
    // 打开 , 关闭 help触发 （status , val）
    helptoggle (status, val) {
      this.help_open = true
    },
    // 监听ctrl + s
    save (val, render) {
      this.$emit('save', val, render)
    },
    label (val, render) {
      this.$emit('label', val, render)
    },
    // 导航栏切换
    navigationtoggle (status, val) {
      this.$emit('navigation-toggle', status, val)
    },
    $toolbar_right_read_change_status () {
      this.s_readmodel = !this.s_readmodel
      if (this.readmodel) {
        this.readmodel(this.s_readmodel, this.d_value)
      }
      if (this.s_readmodel && this.toolbars.navigation) {
        this.getNavigation(this, true)
      }
    },
    // ---------------------------------------
    // 滚动条联动
    $v_edit_scroll ($event) {
      scrollLink($event, this)
    },
    // 获取textarea dom节点
    getTextareaDom () {
      return this.$refs.vNoteTextarea.$refs.vTextarea
    },
    // 工具栏插入内容
    insertText (obj, { prefix, subfix, str, type }) {
      // if (this.sPreviewSwitch) {

      insertTextAtCaret(obj, { prefix, subfix, str, type }, this)
    },
    insertTab () {
      insertTab(this, this.tabSize)
    },
    insertOl () {
      insertOl(this)
    },
    removeLine () {
      removeLine(this)
    },
    insertUl () {
      insertUl(this)
    },
    unInsertTab () {
      unInsertTab(this, this.tabSize)
    },
    insertEnter (event) {
      insertEnter(this, event)
    },
    saveHistory () {
      this.d_history.splice(this.d_history_index + 1, this.d_history.length)
      this.d_history.push(this.d_value)
      this.textarea_selectionEnds.splice(
        this.d_history_index + 1,
        this.textarea_selectionEnds.length
      )
      this.textarea_selectionEnds.push(this.textarea_selectionEnd)
      this.d_history_index = this.d_history.length - 1
    },
    saveSelectionEndsHistory () {
      const textarea =
        this.$refs.vNoteTextarea &&
        this.$refs.vNoteTextarea.$el.querySelector('textarea')
      this.textarea_selectionEnd = textarea
        ? textarea.selectionEnd
        : this.textarea_selectionEnd
    },
    initLanguage () {
      const lang =
        CONFIG.langList.indexOf(this.language) >= 0 ? this.language : 'zh-CN'
      // var $vm = this
      // $vm.$render(CONFIG[`help_${lang}`], function (res) {
      //   $vm.d_help = res
      // })
      this.helpContent = CONFIG[`help_${lang}`]
      this.dWords = CONFIG[`words_${lang}`]
    },
    // 编辑开关
    editableTextarea () {
      const text_dom = this.$refs.vNoteTextarea.$refs.vTextarea
      if (this.editable) {
        text_dom.removeAttribute('disabled')
      } else {
        text_dom.setAttribute('disabled', 'disabled')
      }
    },
    codeStyleChange (val, isInit) {
      isInit = isInit || false
      if (typeof this.p_external_link.hljs_css !== 'function') {
        if (this.p_external_link.hljs_css !== false) {
          console.error(
            'external_link.hljs_css is not a function, if you want to disabled this error log, set external_link.hljs_css to function or false'
          )
        }
        return
      }
      var url = this.p_external_link.hljs_css(val)
      if (url.length === 0 && isInit) {
        console.warn(
          'hljs color scheme',
          val,
          'do not exist, loading default github'
        )
        url = this.p_external_link.hljs_css('github')
      }
      if (url.length > 0) {
        loadLink(url)
      } else {
        console.warn(
          'hljs color scheme',
          val,
          'do not exist, hljs color scheme will not change'
        )
      }
    },
    iRender (toggleChange) {
      var $vm = this
      this.$render($vm.d_value, function (res) {
        // render
        $vm.d_render = res
        // change回调  toggleChange == false 时候触发change回调
        if (!toggleChange) {
          if ($vm.change) $vm.change($vm.d_value, $vm.d_render)
        }
        // 改变标题导航
        if ($vm.sNavigation) getNavigation($vm, false)
        // v-model 语法糖
        $vm.$emit('input', $vm.d_value)
        // 塞入编辑记录数组
        if ($vm.d_value === $vm.d_history[$vm.d_history_index]) return
        window.clearTimeout($vm.currentTimeout)
        $vm.currentTimeout = setTimeout(() => {
          $vm.saveHistory()
        }, 500)
      })
    },
    // 清空上一步 下一步缓存
    $emptyHistory () {
      this.d_history = [this.d_value] // 编辑记录
      this.d_history_index = 0 // 编辑记录索引
    }
  },
  watch: {
    d_value: function (val, oldVal) {
      this.saveSelectionEndsHistory()
      this.iRender()
    },
    value: function (val, oldVal) {
      // Escaping all XSS characters
      //         escapeHtml (html) {
      //             return html
      //         }
      if (this.xssOptions) {
        val = xss(val, this.xssOptions)
      }

      if (val !== this.d_value) {
        this.d_value = val
      }
    },
    subfield: function (val, oldVal) {
      this.sSubfield = val
    },
    d_history_index () {
      if (this.d_history_index > 20) {
        this.d_history.shift()
        this.d_history_index = this.d_history_index - 1
      }
      this.d_value = this.d_history[this.d_history_index]
    },
    language: function (val) {
      this.initLanguage()
    },
    editable: function () {
      this.editableTextarea()
    },
    defaultOpen: function (val) {
      let default_open_ = val
      if (!default_open_) {
        default_open_ = this.subfield ? 'preview' : 'edit'
      }
      this.sPreviewSwitch = default_open_ === 'preview'
      return this.sPreviewSwitch
    },
    codeStyle: function (val) {
      this.codeStyleChange(val)
    }
  },
  components: {
    'v-autoTextarea': autoTextarea.default,
    'md-toolbar': md_toolbar,
    'note-uploader': require('components/Notes/Tools/NoteUploader.vue').default,
    'markdown-view': require('components/Shared/MarkdownView.vue').default
  }
}
</script>

<style lang="scss">
@import 'lib/css/scroll.scss';
@import 'lib/css/mavon-editor.scss';
</style>
<style lang="scss">
.auto-textarea-wrapper {
  height: 100%;
}
</style>
