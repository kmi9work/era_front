import { ref } from 'vue'
import axios from 'axios'

// Глобальное состояние для уведомлений
const notificationsRef = ref(null)
let refreshTimeout = null

// Функция для установки ссылки на компонент уведомлений
export function setNotificationsRef(ref) {
  notificationsRef.value = ref
}

// Функция для обновления уведомлений с дебаунсингом
export function refreshNotifications() {
  // Очищаем предыдущий таймер
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
  }
  
  // Устанавливаем новый таймер
  refreshTimeout = setTimeout(() => {
    if (notificationsRef.value && notificationsRef.value.updateNotifications) {
      notificationsRef.value.updateNotifications()
    }
    // Также отправляем глобальное событие
    window.dispatchEvent(new CustomEvent('dataUpdated'))
  }, 1000) // Увеличиваем задержку до 1 секунды
}

// Перехватчик для автоматического обновления уведомлений
export function setupNotificationInterceptor() {
  // Перехватываем все POST, PATCH, PUT, DELETE запросы
  axios.interceptors.response.use(
    (response) => {
      // Проверяем, что это запрос, изменяющий данные
      const method = response.config.method?.toUpperCase()
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
        // Обновляем уведомления с дебаунсингом
        refreshNotifications()
      }
      return response
    },
    (error) => {
      return Promise.reject(error)
    }
  )
}
