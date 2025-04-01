<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-primary">
      <q-toolbar class="mobile-header">
        <q-btn
          flat
          round
          icon="arrow_back_ios"
          @click="$router.back()"
        />
        <q-toolbar-title>{{ $t('QRReader') }}</q-toolbar-title>
        <q-btn
          flat
          round
          color="white"
          icon="wb_incandescent"
          @click="switchLight"
        />
        <q-btn
          flat
          round
          icon="flip_camera_android"
          @click="switchCamera"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="flex flex-center">
        <q-img
          src="scan.png"
          width="300px"
        />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import config from '../../config'
const console = config.console
const scanner = window.QRScanner

export default {
  data () {
    return {
      frontCamera: false,
      light: false
    }
  },
  watch: {},
  components: {},
  methods: {
    switchCamera (e) {
      this.frontCamera = !this.frontCamera
      if (this.frontCamera) {
        scanner.useFrontCamera((err, status) => {
          err && console.error(err)
          console.log(status)
        })
      } else {
        scanner.useBackCamera((err, status) => {
          err && console.error(err)
          console.log(status)
        })
      }
    },
    switchLight (e) {
      this.light = !this.light
      if (this.light) {
        scanner.enableLight((err, status) => {
          err && console.error(err)
          console.log(status)
        })
      } else {
        scanner.disableLight((err, status) => {
          err && console.error(err)
          console.log(status)
        })
      }
    },
    async scan () {
      const onDone = (err, status) => {
        if (err) {
          // here we can handle errors and clean up any loose ends.
          console.error(err)
        }
        if (status.authorized) {
          // W00t, you have camera access and the scanner is initialized.
          // QRscanner.show() should feel very fast.

          // Start a scan. Scanning will continue until something is detected or
          // `QRScanner.cancelScan()` is called.
          scanner.scan(displayContents)

          // Make the webview transparent so the video preview is visible behind it.
          scanner.show()
          // Be sure to make any opaque HTML elements transparent here to avoid
          // covering the video.
        } else if (status.denied) {
          // The video preview will remain black, and scanning is disabled. We can
          // try to ask the user to change their mind, but we'll have to send them
          // to their device settings with `QRScanner.openSettings()`.
        } else {
          // we didn't get permission, but we didn't get permanently denied. (On
          // Android, a denial isn't permanent unless the user checks the "Don't
          // ask again" box.) We can ask again at the next relevant opportunity.
        }
      }

      const displayContents = (err, text) => {
        if (err) {
          // an error occurred, or the scan was canceled (error code `6`)
          console.error(err)
        } else {
          // The scan completed, display the contents of the QR code:
          console.log(text)
          this.$qrEventBus.$emit('scan-result', { result: text })
          scanner.cancelScan()
          this.$router.back()
        }
      }
      scanner.cancelScan((status) => {
        console.log(status)
      })

      this.showQRReader = true
      scanner.prepare(onDone) // show the prompt
    }
  },
  mounted () {
    // 设置body背景颜色为透明
    var body = document.body
    if (body.style) {
      this.defaultBackgroundColor = body.style.backgroundColor
      setTimeout(function () {
        body.style.backgroundColor = 'transparent'
      }, 1)
      if (body.parentNode && body.parentNode.style) {
        body.parentNode.style.backgroundColor = 'transparent'
      }
    }
    this.scan()
  },
  beforeDestroy () {
    scanner.destroy(function (status) {
      console.log(status)
      // 设置body背景颜色为白色
      var body = document.body
      if (body.style) {
        setTimeout(function () {
          body.style.backgroundColor = 'white'
        }, 2)
        if (body.parentNode && body.parentNode.style) {
          body.parentNode.style.backgroundColor = 'white'
        }
      }
    })
  }
}
</script>
