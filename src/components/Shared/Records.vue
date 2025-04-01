<template>
  <transition
    appear
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut absolute-top"
  >
    <div>
      <list-header bg-color="bg-info">
        {{ title }}
      </list-header>

      <q-list
        separator
        bordered
      >
        <record
          v-for="(record, key) in records"
          :record="record"
          :key="key"
          :id="key"
        />
      </q-list>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    records: {
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
    record: require('components/Shared/Record.vue').default,
    'list-header': require('components/Shared/ListHeader.vue').default
  },
  computed: {},
  mounted () {
  }
}
</script>

<style></style>
