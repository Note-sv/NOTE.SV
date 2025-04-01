<template>
  <q-btn
    @click="lockScreen"
    class="lock-screen-btn-con"
    flat
    icon-right="lock_open"
    :label="$t('lockScreen')"
  />
</template>

<script>
import config from '../config'
const console = config.console

export default {
  name: 'LockScreen',
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    lockScreen () {
      let path = this.$route.path || '/'
      if (path === '/locking') {
        path = '/'
      }
      this.$q.sessionStorage.set('last_page_path', path) // 本地存储锁屏之前打开的页面以便解锁后打开
      console.log(
        this.$route.path,
        this.$q.sessionStorage.getItem('last_page_path')
      )
      this.$q.sessionStorage.set('locking', '1')
      this.$router.replace(
        {
          path: '/locking' // 解锁之后跳转到锁屏之前的页面
        },
        () => {}
      )
    }
  },
  mounted () {},
  onIdle () {
    this.lockScreen()
  },
  onActive () {
  }
}
</script>
