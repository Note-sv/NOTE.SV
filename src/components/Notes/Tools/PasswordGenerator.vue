<template>
  <q-card class="box-card">
    <div class="row q-pa-md">
      <q-slider
        v-model="rule.length"
        color="teal"
        class="col"
        label
        :label-value="$t('Characters' , { length: rule.length})"
        label-always
        :min="4"
        :max="64"
      />
      <q-btn
        @click="generate"
        flat
        icon="sync"
        color="primary"
        :label="$t('GeneratePassword')"
      />
    </div>

    <div class="row q-mb-sm">
      <q-checkbox
        class="col"
        v-model="rule.uppercase"
        :label="$t('UppercaseLetters')"
        border
      />
      <q-checkbox
        class="col"
        v-model="rule.lowercase"
        :label="$t('LowercaseLetters')"
        border
      />
    </div>

    <div class="row q-mb-sm">
      <q-checkbox
        class="col"
        v-model="rule.numbers"
        :label="$t('IncludeNumbers')"
        border
      />
      <q-checkbox
        class="col"
        v-model="rule.symbols"
        :label="$t('IncludeSymbols')"
        border
      />
    </div>
  </q-card>
</template>

<script>
import passwordGenerator from 'generate-password'

export default {
  data () {
    return {
      password: '',
      rule: {
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
        length: 8,
        exclude: '',
        strict: true
      }
    }
  },
  watch: {
    rule: {
      handler: function (newRule, oldRule) {
        this.generate()
      },
      deep: true
    }
  },
  methods: {
    generate () {
      try {
        this.password = passwordGenerator.generate(this.rule)
        this.$emit('password', this.password)
      } catch (e) {
        this.$q.notify({
          color: 'negative',
          message: this.$t(e.message),
          position: 'top',
          badgeStyle: 'background-color: #ff0000'
        })
      }
    }
  },
  mounted () {}
}
</script>
