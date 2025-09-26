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
  const pollTimeouts = {
    merchants: null,
    nobles: null,
    screen: null,
  }

  // защита от гонки запросов
  let lastMerchReqId = 0
  let lastNobleReqId = 0
  let lastScreenReqId = 0

  /** --- Купцы --- */
  const fetchMerchantResults = async () => {
    const reqId = ++lastMerchReqId
    isLoading.value = true
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/show_sorted_results`
      )

      if (reqId === lastMerchReqId && Array.isArray(data) && data.length > 0) {
        merchantsList.value = data
      }
    } catch (error) {
      console.error('Ошибка загрузки игроков:', error)
      errorMessage.value = 'Ошибка загрузки списка игроков'
    } finally {
      isLoading.value = false
    }
  }

  /** --- Текущий экран merchants --- */
  const fetchCurrDisplay = async () => {
    const reqId = ++lastScreenReqId
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/display_results`
      )

      if (reqId === lastScreenReqId && data) {
        currentDisplay.value = data
      }
      return data
    } catch (error) {
      console.error('Ошибка при загрузке данных экрана merchants:', error)
      errorMessage.value = error.message || 'Ошибка загрузки экрана merchants'
      throw error
    }
  }

  /** --- Благородные --- */
  const fetchNobleResults = async () => {
    const reqId = ++lastNobleReqId
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/show_noble_results`
      )
      if (reqId === lastNobleReqId && Array.isArray(data) && data.length > 0) {
        nobleInfList.value = data
      }
    } catch (error) {
      console.error('Ошибка загрузки данных благородных:', error)
    }
  }

  /** --- Polling --- */
  const startPolling = () => {
    stopPolling() // сначала чистим

    // merchants
    const pollMerchants = async () => {
      await fetchMerchantResults()
      pollTimeouts.merchants = setTimeout(pollMerchants, pollTime)
    }
    pollMerchants()

    // nobles
    const pollNobles = async () => {
      await fetchNobleResults()
      pollTimeouts.nobles = setTimeout(pollNobles, pollTime)
    }
    pollNobles()

    // screen
    const pollScreen = async () => {
      await fetchCurrDisplay()
      pollTimeouts.screen = setTimeout(pollScreen, pollTime)
    }
    pollScreen()
  }

  const stopPolling = () => {
    Object.keys(pollTimeouts).forEach((key) => {
      if (pollTimeouts[key]) {
        clearTimeout(pollTimeouts[key])
        pollTimeouts[key] = null
      }
    })
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
    fetchMerchantResults,
    fetchNobleResults,
    fetchCurrDisplay,
    startPolling,
    stopPolling,
    cleanup,
  }
})


