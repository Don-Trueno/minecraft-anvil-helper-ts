import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const i18n = createI18n({
  legacy: false,
  locale: navigator.language || 'en',
  fallbackLocale: 'en',
  globalInjection: true,
  silentTranslationWarn: true,
  messages: {
    en: await import('./locale/en.json'),
    /*     zh: await import('./locale/zh-cn.json'),
    'zh-CN': await import('./locale/zh-cn.json'),
    'zh-TW': await import('./locale/zh-tw.json'),
    'zh-HK': await import('./locale/zh-hk.json'),
 */
  },
})

app.use(i18n)
app.mount('#app')
