import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from '@/plugins/vuetify'
import axios from 'axios'

// Базовые стили
import '@core/scss/template/index.scss'
import '@layouts/styles/index.scss'

// Импортируем главный контейнер
import NobleHelper from './views/pages/NobleHelper.vue'

// Создаем Pinia store
const pinia = createPinia()

// Создаем приложение
const app = createApp(NobleHelper)

// Подключаем плагины
app.use(pinia)
vuetify(app) // Используем существующую конфигурацию Vuetify

// Настройка axios
axios.defaults.xsrfCookieName = "CSRF-TOKEN"
axios.defaults.xsrfHeaderName = "X-CSRF-Token"
axios.defaults.withCredentials = true

// Монтируем приложение
app.mount('#app')

