import { ref, onBeforeUnmount } from 'vue'

// Выбранный экран — настройка конкретного браузера, а не игры: панель
// оператора, проектор и планшет могут показывать разные экраны одновременно.
const STORAGE_KEY = 'era_screen'
const DEFAULT_SCREEN = 'placeholder'

const readStoredScreen = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored && stored.trim() ? stored : DEFAULT_SCREEN
  } catch (error) {
    console.warn('Не удалось прочитать выбранный экран из localStorage:', error)
    return DEFAULT_SCREEN
  }
}

const persistScreen = (screen) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, screen)
  } catch (error) {
    console.warn('Не удалось сохранить выбранный экран в localStorage:', error)
  }
}

export function useScreenManagement(onPollingStart) {
  const selectedScreen = ref(readStoredScreen())
  const pollInterval = ref(null)

  // Смена экрана: только в этом браузере (сервер общий экран больше не хранит)
  const changeScreen = (screen) => {
    if (!screen || selectedScreen.value === screen) return
    selectedScreen.value = screen
    persistScreen(screen)
  }

  // Настройка polling: данные окон (товарообороты, чек-листы) остаются общими
  const startPolling = () => {
    // Вызываем колбэк для запуска дополнительного polling (товарообороты, чек-листы)
    if (onPollingStart) {
      onPollingStart()
    }

    pollInterval.value = setInterval(() => {
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
    changeScreen,
    startPolling,
    stopPolling
  }
}
