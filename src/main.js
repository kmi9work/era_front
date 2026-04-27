import { createApp } from 'vue'
import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import axios from 'axios'
import { useLoadingStore } from '@/stores/loading'

// Styles
import '@core/scss/template/index.scss'
import '@layouts/styles/index.scss'
import '@/assets/fonts/fonts.css'

// Create vue app
const app = createApp(App)

axios.defaults.xsrfCookieName = "CSRF-TOKEN";
axios.defaults.xsrfHeaderName = "X-CSRF-Token";
axios.defaults.withCredentials = true;

// Настройка axios interceptors для глобальной загрузки
const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      // Показываем крутилку только для POST, PATCH, PUT, DELETE запросов
      const method = config.method?.toUpperCase()
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
        const loadingStore = useLoadingStore()
        loadingStore.startLoading()
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      // Скрываем крутилку для POST, PATCH, PUT, DELETE запросов
      const method = response.config.method?.toUpperCase()
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
        const loadingStore = useLoadingStore()
        loadingStore.stopLoading()
      }
      return response
    },
    (error) => {
      // Скрываем крутилку при ошибке для POST, PATCH, PUT, DELETE запросов
      const method = error.config?.method?.toUpperCase()
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
        const loadingStore = useLoadingStore()
        loadingStore.stopLoading()
      }
      return Promise.reject(error)
    }
  )
}

// Register plugins
registerPlugins(app)

// Настройка interceptors после регистрации плагинов
setupAxiosInterceptors()

// app.config.globalProperties.$http = axios; // Allow axios in all componenets this.$http.get

// Mount vue app
app.mount('#app')
