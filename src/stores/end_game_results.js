import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useEndGameResultsStore = defineStore('merchant_results', () => {
  const isLoading = ref(false)
  const errorMessage = ref(null)

  const merchantsList = ref([])
  const nobleInfList = ref([])
  const currentDisplay = ref('merchPlaceholder')

  const pollTime = 5000
  const pollTimeout = {
    bundle: null,
  }

  // защита от гонки запросов (bundle)
  let lastBundleReqId = 0

  /** --- Bundle: экран + купцы + знать --- */
  const fetchScreenBundle = async () => {
    const reqId = ++lastBundleReqId
    isLoading.value = true
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/screen_bundle`
      )
      if (reqId === lastBundleReqId && data) {
        if (Array.isArray(data.merchants)) merchantsList.value = data.merchants
        if (Array.isArray(data.nobles)) nobleInfList.value = data.nobles
        if (data.display) currentDisplay.value = data.display
      }
    } catch (error) {
      console.error('Ошибка загрузки bundle экрана:', error)
      errorMessage.value = error.message || 'Ошибка загрузки экрана'
    } finally {
      isLoading.value = false
    }
  }

  /** --- Polling (bundle) --- */
  const startPolling = () => {
    stopPolling()
    const loop = async () => {
      await fetchScreenBundle()
      pollTimeout.bundle = setTimeout(loop, pollTime)
    }
    loop()
  }

  const stopPolling = () => {
    if (pollTimeout.bundle) {
      clearTimeout(pollTimeout.bundle)
      pollTimeout.bundle = null
    }
  }

  const cleanup = () => {
    stopPolling()
  }

  return {
    // state
    isLoading,
    errorMessage,
    merchantsList,
    nobleInfList,
    currentDisplay,
    pollTime,

    // actions
    fetchScreenBundle,
    startPolling,
    stopPolling,
    cleanup,
  }
})


