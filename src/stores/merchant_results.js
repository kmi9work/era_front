import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useMerchantResultsStore = defineStore('merchant_results', () => {
  const isLoading = ref(false)
  const errorMessage = ref(null)
  const merchantsList = ref([])
  const pollTime = 5000
  const pollInterval = ref(null)
  const screenPollInterval = ref(null) // ← отдельный интервал для экрана
  const showResultsLevel = ref(0)
  const abortController = ref(null)
  const screenAbortController = ref(null) // ← отдельный контроллер для экрана
  const currentMerchantsResultsScreen = ref(0)

  const fetchMerchantResults = async () => {
    if (abortController.value) {
      abortController.value.abort()
    }
    
    abortController.value = new AbortController()
    isLoading.value = true
    errorMessage.value = null
    
    try {
      const merchResponse = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/show_sorted_results`,
        { signal: abortController.value.signal }
      )
      
      merchantsList.value = merchResponse.data || []
      
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Запрос merchants отменен')
        return
      }
      console.error('Ошибка загрузки игроков:', error)
      errorMessage.value = 'Ошибка загрузки списка игроков'
    } finally {
      isLoading.value = false
      abortController.value = null
    }
  }

  const fetchCurrMerchResScreen = async () => {
  
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/show_curr_merch_res_screen`,       
      )
      
      currentMerchantsResultsScreen.value = response.data || 0
      return response.data

    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Запрос экрана отменен')
        return
      }
      
      errorMessage.value = error.message || 'Произошла ошибка загрузки экрана'
      console.error('Ошибка при загрузке данных экрана:', error)
      throw error
    } finally {
      screenAbortController.value = null
    }
  }

  const startPolling = () => {
    stopPolling() // Останавливаем предыдущий polling
    
    // Запускаем сразу оба запроса
    fetchMerchantResults().catch(error => {
      if (!axios.isCancel(error)) {
        console.error('Ошибка начальной загрузки merchants:', error)
      }
    })
    
    fetchCurrMerchResScreen().catch(error => {
      if (!axios.isCancel(error)) {
        console.error('Ошибка начальной загрузки экрана:', error)
      }
    })
    
    // Polling для merchants
    pollInterval.value = setInterval(() => {
      fetchMerchantResults().catch(error => {
        if (!axios.isCancel(error)) {
          console.error('Ошибка polling merchants:', error)
        }
      })
    }, pollTime)
    
    // Polling для экрана (можно с другим интервалом)
    screenPollInterval.value = setInterval(() => {
      fetchCurrMerchResScreen().catch(error => {
        if (!axios.isCancel(error)) {
          console.error('Ошибка polling экрана:', error)
        }
      })
    }, pollTime)
  }

  const stopPolling = () => {
    // Останавливаем интервалы
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
    
    if (screenPollInterval.value) {
      clearInterval(screenPollInterval.value)
      screenPollInterval.value = null
    }
    
    // Отменяем запросы
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    
    if (screenAbortController.value) {
      screenAbortController.value.abort()
      screenAbortController.value = null
    }
  }

  const cleanup = () => {
    stopPolling()
  }

  return {
    isLoading,
    errorMessage,
    merchantsList,
    showResultsLevel,
    currentMerchantsResultsScreen,
    fetchMerchantResults,
    fetchCurrMerchResScreen,
    startPolling,
    stopPolling,
    cleanup,
    pollTime,
    pollInterval
  }
})