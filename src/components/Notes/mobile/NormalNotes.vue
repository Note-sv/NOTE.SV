<template>
  <transition
    appear
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut absolute-top"
  >
    <div>
      <q-list
        separator
        bordered
      >
        <note
          v-for="(item) in notes"
          :note="item[1]"
          :status="item[2]"
          :key="item[0]"
          :id="item[0]"
        />
      </q-list>
    </div>
  </transition>
</template>

<script>
import { mapState } from 'vuex'
export default {
  props: {
    title: {
      type: String,
      default: () => { return '' }
    },
    notes: {
      type: Array,
      default: () => { return [] }
    }
  },
  components: {
    note: require('components/Notes/mobile/NormalNote.vue').default
  },
  computed: {
    ...mapState('settings', ['userSettings'])
  }
}
</script>

<style></style>
