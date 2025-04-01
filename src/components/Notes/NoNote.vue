<template>
  <transition
    appear
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut absolute-top"
  >
    <q-banner class="bg-grey-3">
      <template
        #avatar
      >
        <q-icon
          name="check"
          color="primary"
        />
      </template>
      {{ message }}
      <template
        #action
        v-if="!hiddenButton"
      >
        <q-btn
          @click="$emit('add-note')"
          flat
          color="primary"
          :label="$t('AddNote')"
        />
      </template>
    </q-banner>
  </transition>
</template>

<script>
export default {
  props: {
    message: {
      type: String,
      default: ''
    },
    hiddenButton: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style>
</style>
