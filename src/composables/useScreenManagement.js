import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

export function useScreenManagement(onPollingStart) {
  const selectedScreen = ref('placeholder')
  const isTransitioning = ref(false)
  const timerMessage = ref('Проверьте расписание. Либо его нет, либо циклы еще не начались, либо уже закончились')
  const pollInterval = ref(null)

  // Загрузка данных с сервера
  const loadScreen = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_screen`)
      if (response.data !== selectedScreen.value) {
        selectedScreen.value = response.data
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    }
  }

  // Смена экрана
  const changeScreen = async (screen) => {
    if (selectedScreen.value === screen || isTransitioning.value) return

    try {
      await axios.patch(
        `${import.meta.env.VITE_PROXY}/game_parameters/toggle_screen`,
        { request: screen }
      )
      isTransitioning.value = true
      setTimeout(() => {
        selectedScreen.value = screen
        isTransitioning.value = false
      }, 300)
    } catch (error) {
      console.error("Ошибка при смене экрана:", error)
    }
  }

  // Настройка polling
  const startPolling = () => {
    loadScreen()
    
    // Вызываем колбэк для запуска дополнительного polling (товарообороты, чек-листы)
    if (onPollingStart) {
      onPollingStart()
    }
    
    pollInterval.value = setInterval(() => {
      loadScreen()
      
      // Вызываем колбэк для обновления данных
      if (onPollingStart) {
        onPollingStart()
      }
    }, 5000)
  }

  // Остановка polling
  const stopPolling = () => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
  }

  onBeforeUnmount(() => {
    stopPolling()
  })

  return {
    selectedScreen,
    isTransitioning,
    timerMessage,
    loadScreen,
    changeScreen,
    startPolling,
    stopPolling
  }
}

