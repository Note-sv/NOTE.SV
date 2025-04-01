import Vue from 'vue'

// 定义一个全局eventBus用于传递扫码结果
Vue.prototype.$qrEventBus = new Vue()

// 通过代码更新数据。代码如下：
// this.$qrEventBus.$emit('scanResult', {result:result, error:error})

// 获取msg数据的代码如下：
// this.$qrEventBus.$on('scanResult', value => { this.result = value.result })
// 此时，title的值就会通过$emit 的改变而改变。
