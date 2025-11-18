<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const props = defineProps<{ currentLocale: string }>()
const emit = defineEmits(['update:currentLocale'])

const localLocale = ref(props.currentLocale || 'en')

watch(
  () => props.currentLocale,
  (val) => {
    localLocale.value = val
  },
)

watch(locale, () => {
  document.title = t('appTitle')
})

function changeLocale(val: string) {
  localLocale.value = val
  locale.value = val
  emit('update:currentLocale', val)
}

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  changeLocale(target.value)
}
</script>

<template>
  <div class="language-selector">
    <select :value="localLocale" @change="onChange">
      <option value="en">English</option>
      <option value="zh-hans">简体中文</option>
    </select>
  </div>
</template>
