import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useMerchantResultsStore = defineStore('merchant_results', () => {
  const isLoading = ref(false)
  const errorMessage = ref(null)
  const merchantsList = ref([])
  const pollTime = 5000
  const pollInterval = ref(null)
  const showResultsLevel = ref(0)
  const abortController = ref(null)

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
        console.log('Запрос отменен')
        abortController.value = null
        return
      }
      console.error('Ошибка загрузки игроков:', error)
      errorMessage.value = 'Ошибка загрузки списка игроков'
    } finally {
      isLoading.value = false
      abortController.value = null
    }
  }

  const startPolling = () => {
    if (pollInterval.value) return
    fetchMerchantResults() // начать сразу
    pollInterval.value = setInterval(fetchMerchantResults, pollTime)
  }

  const stopPolling = () => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
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
    fetchMerchantResults,
    startPolling,
    stopPolling,
    cleanup,
    pollTime,
    pollInterval,
  }
})