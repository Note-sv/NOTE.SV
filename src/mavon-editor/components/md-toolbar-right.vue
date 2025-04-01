<template>
  <div class="v-right-item">
    <slot name="right-toolbar-before" />
    <button
      type="button"
      v-if="toolbars.navigation"
      @click="$clicks('navigation')"
      v-show="!sNavigation"
      class="op-icon fa fa-mavon-bars"
      aria-hidden="true"
      :title="`${dWords.tl_navigation_on}`"
    />
    <button
      type="button"
      v-if="toolbars.navigation"
      @click="$clicks('navigation')"
      v-show="sNavigation"
      class="op-icon fa fa-mavon-bars selected"
      aria-hidden="true"
      :title="`${dWords.tl_navigation_off}`"
    />
    <button
      type="button"
      v-if="toolbars.preview"
      @click="$clicks('preview')"
      v-show="sPreviewSwitch"
      class="op-icon fa fa-mavon-eye-slash selected"
      aria-hidden="true"
      :title="`${dWords.tl_edit}`"
    />
    <button
      type="button"
      v-if="toolbars.preview"
      @click="$clicks('preview')"
      v-show="!sPreviewSwitch"
      class="op-icon fa fa-mavon-eye"
      aria-hidden="true"
      :title="`${dWords.tl_preview} `"
    />
    <button
      type="button"
      v-if="toolbars.fullscreen"
      @click="$clicks('fullscreen')"
      v-show="!sFullScreen"
      class="op-icon fa fa-mavon-arrows-alt"
      :title="`${dWords.tl_fullscreen_on}`"
      aria-hidden="true"
    />
    <button
      type="button"
      v-if="toolbars.fullscreen"
      @click="$clicks('fullscreen')"
      v-show="sFullScreen"
      class="op-icon fa fa-mavon-compress selected"
      :title="`${dWords.tl_fullscreen_off}`"
      aria-hidden="true"
    />
    <button
      type="button"
      v-if="toolbars.readmodel"
      @click="$clicks('read')"
      class="op-icon fa fa-mavon-window-maximize"
      aria-hidden="true"
      :title="`${dWords.tl_read}`"
    />
    <button
      type="button"
      v-if="toolbars.subfield"
      @click="$clicks('subfield')"
      class="op-icon fa fa-mavon-columns"
      aria-hidden="true"
      :class="{'selected': sSubfield}"
      :title="`${sSubfield ? dWords.tl_single_column : dWords.tl_double_column}`"
    />
    <span
      v-if=" toolbars.help && toolbars.htmlcode && toolbars.readmodel && toolbars.fullscreen && toolbars.subfield && toolbars.navigation"
      class="op-icon-divider"
    />
    <button
      type="button"
      v-if="toolbars.htmlcode"
      @click="$clicks('html')"
      v-show="!sHtmlCode"
      class="op-icon fa fa-mavon-code"
      :title="dWords.tl_html_on"
      aria-hidden="true"
    />
    <button
      type="button"
      v-if="toolbars.htmlcode"
      @click="$clicks('html')"
      v-show="sHtmlCode"
      class="op-icon fa fa-mavon-code selected"
      :title="dWords.tl_html_off"
      aria-hidden="true"
    />
    <button
      type="button"
      v-if="toolbars.help"
      @click="$clicks('help')"
      class="op-icon fa fa-mavon-question-circle"
      style="font-size: 17px;padding: 5px 6px 5px 3px"
      :title="dWords.tl_help"
      aria-hidden="true"
    />
    <slot name="right-toolbar-after" />
  </div>
</template>
<script>

export default {
  name: 'SMdToolbarRight',
  props: {
    // 工具栏
    sSubfield: {
      type: Boolean,
      required: true
    },
    toolbars: { type: Object, required: true },
    sPreviewSwitch: { type: Boolean, required: true },
    sFullScreen: { type: Boolean, required: true },
    sHtmlCode: { type: Boolean, required: true },
    sNavigation: { type: Boolean, required: true },
    dWords: {
      type: Object,
      required: true
    }
  },
  methods: {
    // 工具栏功能图标click-----------------
    $clicks (_type) {
      // 让父节点来绑定事件并
      this.$emit('toolbar-right-click', _type)
    }
  }
}
</script>
