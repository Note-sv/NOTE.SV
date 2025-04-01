<template>
  <div class="v-left-item">
    <slot name="left-toolbar-before" />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.bold"
      @click="$clicks('bold')"
      class="op-icon fa fa-mavon-bold"
      aria-hidden="true"
      :title="`${dWords.tl_bold}`"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.italic"
      @click="$clicks('italic')"
      class="op-icon fa fa-mavon-italic"
      aria-hidden="true"
      :title="`${dWords.tl_italic}`"
    />

    <q-btn
      flat
      :disabled="!editable"
      v-if="toolbars.header"
      class="op-icon fa fa-mavon-header"
    >
      <q-menu>
        <q-list>
          <q-item
            clickable
            @click="$click_header('header1')"
            v-close-popup
          >
            <q-item-section>
              <q-item-label>{{ dWords.tl_header_one }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="$click_header('header2')"
            v-close-popup
          >
            <q-item-section>
              <q-item-label>{{ dWords.tl_header_two }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="$click_header('header3')"
            v-close-popup
          >
            <q-item-section>
              <q-item-label>{{ dWords.tl_header_three }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="$click_header('header4')"
            v-close-popup
          >
            <q-item-section>
              <q-item-label>{{ dWords.tl_header_four }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="$click_header('header5')"
            v-close-popup
          >
            <q-item-section>
              <q-item-label>{{ dWords.tl_header_five }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="$click_header('header6')"
            v-close-popup
          >
            <q-item-section>
              <q-item-label>{{ dWords.tl_header_six }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <span
      v-if="toolbars.header || toolbars.italic || toolbars.bold"
      class="op-icon-divider"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.underline"
      @click="$clicks('underline')"
      class="op-icon fa fa-mavon-underline"
      :title="`${dWords.tl_underline}`"
      aria-hidden="true"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.strikethrough"
      @click="$clicks('strikethrough')"
      class="op-icon fa fa-mavon-strikethrough"
      :title="`${dWords.tl_strikethrough}`"
      aria-hidden="true"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.mark"
      @click="$clicks('mark')"
      class="op-icon fa fa-mavon-thumb-tack"
      :title="`${dWords.tl_mark}`"
      aria-hidden="true"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.superscript"
      @click="$clicks('superscript')"
      class="op-icon fa fa-mavon-superscript"
      aria-hidden="true"
      :title="`${dWords.tl_superscript}`"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.subscript"
      @click="$clicks('subscript')"
      class="op-icon fa fa-mavon-subscript"
      aria-hidden="true"
      :title="`${dWords.tl_subscript} `"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.alignleft"
      @click="$clicks('alignleft')"
      class="op-icon fa fa-mavon-align-left"
      aria-hidden="true"
      :title="`${dWords.tl_alignleft} `"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.aligncenter"
      @click="$clicks('aligncenter')"
      class="op-icon fa fa-mavon-align-center"
      aria-hidden="true"
      :title="`${dWords.tl_aligncenter}`"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.alignright"
      @click="$clicks('alignright')"
      class="op-icon fa fa-mavon-align-right"
      aria-hidden="true"
      :title="`${dWords.tl_alignright}`"
    />
    <span
      v-if="
        toolbars.superscript ||
          toolbars.subscript ||
          toolbars.underline ||
          toolbars.strikethrough ||
          toolbars.mark
      "
      class="op-icon-divider"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.quote"
      @click="$clicks('quote')"
      class="op-icon fa fa-mavon-quote-left"
      aria-hidden="true"
      :title="`${dWords.tl_quote}`"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.ol"
      @click="$clicks('ol')"
      class="op-icon fa fa-mavon-list-ol"
      aria-hidden="true"
      :title="`${dWords.tl_ol}`"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.ul"
      @click="$clicks('ul')"
      class="op-icon fa fa-mavon-list-ul"
      aria-hidden="true"
      :title="`${dWords.tl_ul}`"
    />
    <span
      v-if="toolbars.ul || toolbars.ol || toolbars.quote"
      class="op-icon-divider"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.link"
      @click.stop="$toggle_imgLinkAdd('link')"
      class="op-icon fa fa-mavon-link"
      aria-hidden="true"
      :title="`${dWords.tl_link}`"
    />

    <q-btn
      flat
      :disabled="!editable"
      v-if="toolbars.imagelink"
      icon="insert_photo"
    >
      <q-menu>
        <q-list>
          <q-item
            clickable
            @click="$toggle_imgLinkAdd('imagelink')"
            v-close-popup
          >
            <q-item-section>
              <q-item-label>{{ dWords.tl_image }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="$toggle_imgManager"
            v-close-popup
          >
            <q-item-section>
              <q-item-label>{{ dWords.tl_img_manager }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.code"
      @click="$clicks('code')"
      class="op-icon fa fa-mavon-code"
      aria-hidden="true"
      :title="`${dWords.tl_code}`"
    />
    <button
      :disabled="!editable"
      type="button"
      v-if="toolbars.table"
      @click="$clicks('table')"
      class="op-icon fa fa-mavon-table"
      aria-hidden="true"
      :title="`${dWords.tl_table}`"
    />
    <span
      v-if="
        toolbars.link || toolbars.imagelink || toolbars.code || toolbars.table
      "
      class="op-icon-divider"
    />
    <button
      type="button"
      v-if="toolbars.undo"
      @click="$clicks('undo')"
      class="op-icon fa fa-mavon-undo"
      aria-hidden="true"
      :title="`${dWords.tl_undo}`"
    />
    <button
      type="button"
      v-if="toolbars.redo"
      @click="$clicks('redo')"
      class="op-icon fa fa-mavon-repeat"
      aria-hidden="true"
      :title="`${dWords.tl_redo}`"
    />
    <button
      type="button"
      v-if="toolbars.trash"
      @click="$clicks('trash')"
      class="op-icon fa fa-mavon-trash-o"
      aria-hidden="true"
      :title="`${dWords.tl_trash}`"
    />
    <button
      type="button"
      v-if="toolbars.save"
      @click="$clicks('save')"
      class="op-icon fa fa-mavon-floppy-o"
      aria-hidden="true"
      :title="`${dWords.tl_save}`"
    />

    <q-btn
      flat
      dense
      :disabled="!editable"
      v-if="toolbars.insert"
      icon="add"
      color="grey-7"
    >
      <q-menu>
        <q-list>
          <q-item
            clickable
            @click="$click_header('date')"
            v-close-popup
          >
            <q-item-section>
              <q-item-label>{{ dWords.insert_date }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            clickable
            @click="$click_header('time')"
            v-close-popup
          >
            <q-item-section>
              <q-item-label>{{ dWords.insert_time }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <q-btn
      flat
      dense
      v-if="toolbars.label"
      @click="$clicks('label')"
      icon="label"
      aria-hidden="true"
      :title="`${dWords.label}`"
    />

    <slot name="left-toolbar-after" />

    <!-- 添加image链接 -->
    <q-dialog
      v-model="s_img_link_open"
      persistent
    >
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">
            {{
              link_type == 'link'
                ? dWords.tl_popup_link_title
                : dWords.tl_popup_img_link_title
            }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            dense
            v-model="link_text"
            autofocus
            :label="
              link_type == 'link'
                ? dWords.tl_popup_link_text
                : dWords.tl_popup_img_link_text
            "
          />
          <q-input
            dense
            v-model="link_addr"
            :label="
              link_type == 'link'
                ? dWords.tl_popup_link_addr
                : dWords.tl_popup_img_link_addr
            "
          />
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            flat
            :label="dWords.tl_popup_link_cancel"
            @click.stop="s_img_link_open = false"
            v-close-popup
          />
          <q-btn
            flat
            :label="dWords.tl_popup_link_sure"
            @click.stop="$imgLinkAdd()"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
export default {
  name: 'SMdToolbarLeft',
  props: {
    editable: {
      // 是否开启编辑
      type: Boolean,
      default: true
    },
    transition: {
      // TODO: 是否开启动画过渡
      type: Boolean,
      default: true
    },
    toolbars: {
      // 工具栏
      type: Object,
      required: true
    },
    dWords: {
      type: Object,
      required: true
    },
    imageFilter: {
      type: Function,
      default: null
    }
  },
  data () {
    return {
      img_timer: null,
      header_timer: null,
      s_img_dropdown_open: false,
      s_header_dropdown_open: false,
      s_img_link_open: false,
      trigger: null,
      num: 0,
      link_text: '',
      link_addr: '',
      link_type: 'link'
    }
  },
  computed: {
    imgCond () {
      return this.item && this.item[1]
    }
  },
  methods: {
    $toggle_imgManager () {
      // 打开图像管理器
      this.$emit('img-manager-open')
    },
    $imgLinkAdd () {
      this.$emit(
        'toolbar-left-addlink',
        this.link_type,
        this.link_text,
        this.link_addr
      )
      this.s_img_link_open = false
    },
    $toggle_imgLinkAdd (type) {
      this.link_type = type
      this.link_text = this.link_addr = ''
      this.s_img_link_open = true
      this.s_img_dropdown_open = false
    },
    $imgFileListClick (pos) {
      this.$emit('img-touch', this.img_file[pos])
    },
    $changeUrl (index, url) {
      this.img_file[index][0] = url
    },
    // 工具栏功能图标click-----------------
    $mouseenter_img_dropdown () {
      if (this.editable) {
        clearTimeout(this.img_timer)
        this.s_img_dropdown_open = true
      }
    },
    $mouseleave_img_dropdown () {
      const vm = this
      this.img_timer = setTimeout(function () {
        vm.s_img_dropdown_open = false
      }, 200)
    },
    $mouseenter_header_dropdown () {
      if (this.editable) {
        clearTimeout(this.header_timer)
        this.s_header_dropdown_open = true
      }
    },
    $mouseleave_header_dropdown () {
      const vm = this
      this.header_timer = setTimeout(function () {
        vm.s_header_dropdown_open = false
      }, 200)
    },
    $clicks (_type) {
      // 让父节点来绑定事件并
      if (this.editable) {
        this.$emit('toolbar-left-click', _type)
      }
    },
    $click_header (_type) {
      // 让父节点来绑定事件并
      this.$emit('toolbar-left-click', _type)
      this.s_header_dropdown_open = false
    },
    handleClose (e) {
      this.s_img_dropdown_open = false
    }
  }
}
</script>
<style lang="scss" scoped>
.op-icon.dropdown-wrapper.dropdown {
  position: relative;
}
.op-icon.dropdown-wrapper.dropdown[type='button'] {
  -webkit-appearance: unset;
}
.op-icon.dropdown-wrapper.dropdown .popup-dropdown {
  position: absolute;
  display: block;
  background: #fff;
  top: 32px;
  left: -45px;
  min-width: 130px;
  z-index: 1600;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.op-icon.dropdown-wrapper.dropdown .popup-dropdown .dropdown-item:first-child {
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
}
.op-icon.dropdown-wrapper.dropdown .popup-dropdown .dropdown-item:last-child {
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
}
.op-icon.dropdown-wrapper.dropdown .popup-dropdown.op-header {
  left: -30px;
  min-width: 90px;
}
.op-icon.dropdown-wrapper.dropdown .popup-dropdown.fade-enter-active,
.op-icon.dropdown-wrapper.dropdown .popup-dropdown.fade-leave-active {
  opacity: 1;
}
.op-icon.dropdown-wrapper.dropdown .popup-dropdown.fade-enter,
.op-icon.dropdown-wrapper.dropdown .popup-dropdown.fade-leave-active {
  opacity: 0;
}
.op-icon.dropdown-wrapper.dropdown .popup-dropdown.transition,
.op-icon.dropdown-wrapper.dropdown .popup-dropdown.transition .dropdown-item {
  transition: all 0.2s linear 0s;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-item {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  color: #606266;
  position: relative;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-item:hover {
  color: #303133;
  background-color: #e9e9eb;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-item input {
  position: absolute;
  font-size: 100px;
  right: 0;
  top: 0;
  opacity: 0;
  cursor: pointer;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-images {
  box-sizing: border-box;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-images button {
  position: absolute;
  top: -1px;
  right: 5px;
  font-size: 14px;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-images button:hover {
  color: #f56c6c;
  background-color: transparent;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-images span {
  display: inline-block;
  width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-images:hover .image-show {
  display: block !important;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-images .image-show {
  display: none;
  position: absolute;
  left: -128px;
  top: 0;
  width: 120px;
  height: 90px;
  object-fit: contain;
  border: 1px solid #f2f6fc;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-images .image-show.transition {
  transition: all 0.2s linear 0s;
}
.op-icon.dropdown-wrapper.dropdown .dropdown-images.transition {
  transition: all 0.2s linear 0s;
}
.add-image-link-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1600;
  transition: all 0.1s linear 0s;
}
.add-image-link-wrapper.fade-enter-active,
.add-image-link-wrapper.fade-leave-active {
  opacity: 1;
}
.add-image-link-wrapper.fade-enter,
.add-image-link-wrapper.fade-leave-active {
  opacity: 0;
}
.add-image-link-wrapper .add-image-link {
  position: fixed;
  box-sizing: border-box;
  text-align: center;
  width: 24%;
  left: 38%;
  height: auto;
  padding: 40px;
  top: 25%;
  transition: all 0.1s linear 0s;
  z-index: 3;
  background: #fff;
  border-radius: 2px;
}
@media only screen and (max-width: 1500px) {
  .add-image-link-wrapper .add-image-link {
    width: 34%;
    left: 33%;
  }
}
@media only screen and (max-width: 1000px) {
  .add-image-link-wrapper .add-image-link {
    width: 50%;
    left: 25%;
  }
}
@media only screen and (max-width: 600px) {
  .add-image-link-wrapper .add-image-link {
    width: 80%;
    left: 10%;
  }
}
.add-image-link-wrapper .add-image-link i {
  font-size: 24px;
  position: absolute;
  right: 8px;
  top: 6px;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
}
.add-image-link-wrapper .add-image-link .title {
  font-size: 20px;
  margin-bottom: 30px;
  margin-top: 10px;
  font-weight: 500 !important;
}
.add-image-link-wrapper .add-image-link .input-wrapper {
  margin-top: 10px;
  width: 80%;
  border: 1px solid #eeece8;
  text-align: left;
  margin-left: 10%;
  height: 35px;
}
.add-image-link-wrapper .add-image-link .input-wrapper input {
  height: 32px;
  line-height: 32px;
  font-size: 15px;
  width: 90%;
  margin-left: 8px;
  border: none;
  outline: none;
}
.add-image-link-wrapper .add-image-link .op-btn {
  width: 100px;
  height: 35px;
  display: inline-block;
  margin-top: 30px;
  cursor: pointer;
  text-align: center;
  line-height: 35px;
  opacity: 0.9;
  border-radius: 2px;
  letter-spacing: 1px;
  font-size: 15px;
}
.add-image-link-wrapper .add-image-link .op-btn.sure {
  background: #2185d0;
  color: #fff;
  margin-left: 5%;
}
.add-image-link-wrapper .add-image-link .op-btn.sure:hover {
  opacity: 1;
}
.add-image-link-wrapper .add-image-link .op-btn.cancel {
  border: 1px solid #bcbcbc;
  color: #bcbcbc;
}
.add-image-link-wrapper .add-image-link .op-btn.cancel:hover {
  color: #000;
}
</style>
