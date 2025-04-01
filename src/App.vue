<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script>
import Vue from 'vue'
import IdleVue from 'idle-vue'
import { mapActions, mapState } from 'vuex'

export default {
  computed: {
    ...mapState('settings', ['userSettings'])
  },
  methods: {
    ...mapActions('settings', ['getSettings']),
    ...mapActions('account', ['checkAccount'])
  },
  async mounted () {
    await this.getSettings()
    // 当屏幕不工作时触发idle事件
    // 获取设置的锁屏时间
    let idleTime = this.userSettings.locktime
    if (idleTime === 0) {
      // 设置一个大值，比如一年
      idleTime = 365 * 24 * 60 * 60 * 1000
    }
    // idle时间要到毫秒
    const eventsHub = new Vue()
    Vue.use(IdleVue, { eventEmitter: eventsHub, idleTime })
    await this.checkAccount()
  }
}
</script>
