import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from '@/plugins/vuetify'
import iconify from '@/plugins/iconify'
import axios from 'axios'

// Базовые стили
import '@core/scss/template/index.scss'
import '@layouts/styles/index.scss'

// Импортируем главный контейнер
import MobileHelper from './views/pages/MobileHelper.vue'
import { usePwaInstallStore } from './stores/pwaInstall'

// Создаем Pinia store
const pinia = createPinia()

// Создаем приложение
const app = createApp(MobileHelper)

// Подключаем плагины
app.use(pinia)

// Ловим предложение браузера установить приложение — сохраняем его в сторе,
// чтобы показать свою кнопку «Установить» вместо автоматического баннера браузера
const pwaInstallStore = usePwaInstallStore(pinia)

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  pwaInstallStore.setDeferredPrompt(event)
})

window.addEventListener('appinstalled', () => {
  pwaInstallStore.clearDeferredPrompt()
})
vuetify(app) // Используем существующую конфигурацию Vuetify
iconify(app) // Подключаем иконки Iconify

// Настройка axios
axios.defaults.xsrfCookieName = "CSRF-TOKEN"
axios.defaults.xsrfHeaderName = "X-CSRF-Token"
axios.defaults.withCredentials = true

// Монтируем приложение
app.mount('#app')

// Регистрируем service worker только для мобильного приложения «Кошелёк ресурсов»
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

