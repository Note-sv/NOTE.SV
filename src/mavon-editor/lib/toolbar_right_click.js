/**
 * @Author: HuaChao Chen <CHC>
 * @Date:   2017-05-03T01:39:47+08:00
 * @Email:  chenhuachaoxyz@gmail.com
 * @Filename: toolbar_right_click.js
 * @Last modified by:   chc
 * @Last modified time: 2017-06-08T12:44:50+08:00
 * @License: MIT
 * @Copyright: 2017
 */

function $toolbar_right_html_click ($vm) {
  $vm.sHtmlCode = !$vm.sHtmlCode
  if ($vm.htmlcode) {
    $vm.htmlcode($vm.sHtmlCode, $vm.d_value)
  }
}

function $toolbar_right_help_click ($vm) {
  $vm.s_help = !$vm.s_help
  if ($vm.helptoggle) {
    $vm.helptoggle($vm.s_help, $vm.d_value)
  }
}
// 导航
function $toolbar_right_read_click ($vm) {
  const element = $vm.$refs.vReadModel
  // 单栏编辑
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  }
}

function $toolbar_right_preview_click ($vm) {
  $vm.sPreviewSwitch = !$vm.sPreviewSwitch
  // $vm.$refs.vNoteDivEdit.innerHTML = $vm.s_markdown.render($vm.d_value)
  if ($vm.previewtoggle) {
    $vm.previewtoggle($vm.sPreviewSwitch, $vm.d_value)
  }
}

function $toolbar_right_fullscreen_click ($vm) {
  $vm.sFullScreen = !$vm.sFullScreen
  if ($vm.fullscreen) {
    $vm.fullscreen($vm.sFullScreen, $vm.d_value)
  }
}
function $toolbar_right_subfield_click ($vm) {
  $vm.sSubfield = !$vm.sSubfield
  $vm.sPreviewSwitch = $vm.sSubfield
  // $vm.$refs.vNoteDivEdit.innerHTML = $vm.s_markdown.render($vm.d_value)
  if ($vm.previewtoggle) {
    $vm.previewtoggle($vm.sPreviewSwitch, $vm.d_value)
  }
  // $vm.$refs.vNoteDivEdit.innerHTML = $vm.s_markdown.render($vm.d_value)
  if ($vm.subfieldtoggle) {
    $vm.subfieldtoggle($vm.sSubfield, $vm.d_value)
  }
}
function $toolbar_right_navigation_click ($vm) {
  $vm.sNavigation = !$vm.sNavigation
  if ($vm.sNavigation) {
    $vm.sPreviewSwitch = true
  }
  if ($vm.navigationtoggle) {
    $vm.navigationtoggle($vm.sNavigation, $vm.d_value)
  }
  if ($vm.sNavigation) {
    // 绘制标题导航
    $vm.getNavigation($vm, false)
  }
}
export const toolbar_right_click = (_type, $vm) => {
  var _other_right_click = {
    help: $toolbar_right_help_click,
    html: $toolbar_right_html_click,
    read: $toolbar_right_read_click,
    preview: $toolbar_right_preview_click,
    fullscreen: $toolbar_right_fullscreen_click,
    navigation: $toolbar_right_navigation_click,
    subfield: $toolbar_right_subfield_click
  }
  if (Object.prototype.hasOwnProperty.call(_other_right_click, _type)) {
    _other_right_click[_type]($vm)
  }
}
