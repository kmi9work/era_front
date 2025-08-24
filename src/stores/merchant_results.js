import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useMerchantResultsStore = defineStore('merchant_results', () => {
  const isLoading = ref(false)
  const errorMessage = ref(null)
  const merchantsList = ref([])
  const pollTime = 5000
  const pollInterval = ref(null)
  let abortController = null

  const showResultsLevel = ref(0) // 0 - все, 1 - только третье, 2 - третье и второе, 3 - все три призовых

  // Функция для выбора уровня показа результатов
  const chooseMerchScreen = async (level) => {
    if (abortController) {
      abortController.abort()
    }
    
    abortController = new AbortController()
    isLoading.value = true
    
    try {
      // Преобразуем уровень в число для безопасности
      const numericLevel = parseInt(level, 10)
      const validLevel = isNaN(numericLevel) ? 0 : Math.max(0, Math.min(3, numericLevel))
      
      const response = await axios.patch(
        `${import.meta.env.VITE_PROXY}/game_parameters/choose_current_result`,
        { request: validLevel },
        { signal: abortController.signal }
      )
      
      console.log('Screen level set to:', validLevel, 'Response:', response.data)
      
      // Обновляем локальное значение после успешной отправки
      showResultsLevel.value = validLevel
      
      return response.data
      
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Запрос отменен')
        return
      }
      console.error('Ошибка установки уровня экрана:', error)
      errorMessage.value = 'Ошибка установки уровня показа результатов'
      throw error
    } finally {
      isLoading.value = false
      abortController = null
    }
  }

  const fetchCurrentScreen = async () => {
    if (abortController) {
      abortController.abort()
    }
    
    abortController = new AbortController()
    isLoading.value = true

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/get_current_result`,
        { signal: abortController.signal }
      )
      
      // Правильное извлечение значения current_result_screen
      const screenValue = response.data?.current_result_screen
      const numericValue = parseInt(screenValue, 10)
      showResultsLevel.value = isNaN(numericValue) ? 0 : numericValue
      
      console.log('Current screen level:', showResultsLevel.value)
      
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Запрос отменен')
        return
      }
      console.error('Ошибка загрузки текущего экрана:', error)
      errorMessage.value = 'Ошибка загрузки текущего экрана'
    } finally {
      isLoading.value = false
      abortController = null
    }
  }

  const fetchMerchantResults = async () => {
    if (abortController) {
      abortController.abort()
    }
    
    abortController = new AbortController()
    isLoading.value = true
    errorMessage.value = null
    
    try {
      const merchResponse = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/show_sorted_results`,
        { signal: abortController.signal }
      )
      
      console.log('API response:', merchResponse.data)
      
      // Обработка разных форматов ответа
      merchantsList.value = merchResponse.data?.merchants || 
                           merchResponse.data?.data || 
                           merchResponse.data || 
                           []
      
      // Если в ответе есть уровень показа результатов
      if (merchResponse.data?.showResultsLevel !== undefined) {
        const levelValue = parseInt(merchResponse.data.showResultsLevel, 10)
        showResultsLevel.value = isNaN(levelValue) ? 0 : levelValue
      }
      
      console.log('Loaded merchants:', merchantsList.value.length)
      console.log('Show results level:', showResultsLevel.value)
      
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Запрос отменен')
        return
      }
      console.error('Ошибка загрузки игроков:', error)
      errorMessage.value = 'Ошибка загрузки списка игроков'
    } finally {
      isLoading.value = false
      abortController = null
    }
  }

  // Безопасная функция для получения числового значения score
  const getScore = (merchant) => {
    return merchant?.score ?? merchant?.points ?? merchant?.value ?? merchant?.total ?? 0
  }

  // Отсортированные merchants по убыванию score
  const getSortedMerchants = computed(() => {
    return [...merchantsList.value].sort((a, b) => getScore(b) - getScore(a))
  })

  // Функция для получения отфильтрованных результатов по месту (place)
  const getFilteredResults = computed(() => {
    console.log('Filtering with level:', showResultsLevel.value)
    
    if (showResultsLevel.value === 0) {
      return merchantsList.value // Все результаты
    }
    
    switch (showResultsLevel.value) {
      case 1: // Только третье место (place = 3)
        return merchantsList.value.filter(merchant => {
          const place = parseInt(merchant?.place, 10)
          return !isNaN(place) && place === 3
        })
      
      case 2: // Только второе место (place = 2)
        return merchantsList.value.filter(merchant => {
          const place = parseInt(merchant?.place, 10)
          return !isNaN(place) && place === 2
        })
      
      case 3: // Только первое место (place = 1)
        return merchantsList.value.filter(merchant => {
          const place = parseInt(merchant?.place, 10)
          return !isNaN(place) && place === 1
        })
      
      default:
        return merchantsList.value
    }
  })

  // Функция для получения текстового названия места
  const getPlaceTitle = (place) => {
    switch (place) {
      case 1: return 'Первое место'
      case 2: return 'Второе место'
      case 3: return 'Третье место'
      case 4: return 'Четвертое место'
      case 5: return 'Пятое место'
      default: return `${place}-е место`
    }
  }

  // Функция для получения иконки места
  const getPlaceIcon = (place) => {
    switch (place) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏆'
    }
  }

  // Запуск polling
  const startPolling = () => {
    if (pollInterval.value) return
    pollInterval.value = setInterval(() => {
      fetchMerchantResults()
      fetchCurrentScreen()
    }, pollTime)
  }

  // Остановка polling
  const stopPolling = () => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
  }

  // Очистка при уничтожении store
  const cleanup = () => {
    if (abortController) {
      abortController.abort()
    }
    stopPolling()
  }

  // Инициализация - загружаем данные сразу
  fetchMerchantResults()
  fetchCurrentScreen()

  return {
    // state
    isLoading,
    errorMessage,
    merchantsList,
    showResultsLevel,
    
    // computed
    getFilteredResults,
    getSortedMerchants,
    
    // actions
    chooseMerchScreen,
    fetchMerchantResults,
    fetchCurrentScreen,
    startPolling,
    stopPolling,
    cleanup,
    getPlaceTitle,
    getPlaceIcon,
    
    // polling
    pollTime,
    pollInterval,
  }
})