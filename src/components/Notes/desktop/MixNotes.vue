<template>
  <transition
    appear
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut absolute-top"
  >
    <div>
      <list-header bg-color="bg-secondary">
        {{ title }}
      </list-header>

      <q-list
        separator
        bordered
        v-for="(item) in notes"
        :key="item[0]"
      >
        <password-note
          v-if="item[1].tpl === 0"
          :note="item[1]"
          :status="item[2]"
          :id="item[0]"
        />
        <normal-note
          v-else
          :note="item[1]"
          :status="item[2]"
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
    notes: {
      type: Array,
      default: () => {
        return []
      }
    },
    title: {
      type: String,
      default: () => {
        return ''
      }
    }
  },
  components: {
    'normal-note': require('components/Notes/desktop/NormalNote.vue').default,
    'password-note': require('components/Notes/desktop/PasswordNote.vue')
      .default,
    'list-header': require('components/Shared/ListHeader.vue').default
  },
  computed: {
    ...mapState('settings', ['userSettings'])
  }
}
</script>

<style></style>
