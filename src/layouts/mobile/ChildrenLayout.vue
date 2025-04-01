<template>
  <q-layout view="lHh Lpr lFf">
    <q-drawer
      :width="0"
      @show="backSwipe"
    />
    <router-view />
  </q-layout>
</template>

<script>
export default {
  data () {
    return {}
  },
  methods: {
    backSwipe (event) {
      this.$router.back()
    }
  },
  components: {},

  computed: {},
  mounted () {}
}
</script>

<style lang="scss"></style>
