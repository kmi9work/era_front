import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useEndGameResultsStore = defineStore('merchant_results', () => {
  const isLoading = ref(false)
  const errorMessage = ref(null)

  const merchantsList = ref([])
  const nobleInfList = ref([])
  const currentDisplay = ref('merchPlaceholder')
  const showCapPerPlayer = ref(true) // По умолчанию показываем
  const intelligenceDataStatus = ref({
    military_recruitment: false,
    scientists_recruitment: false,
    teaching_staff_recruitment: false,
  })

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
        if (data.show_cap_per_player !== undefined) {
          showCapPerPlayer.value = data.show_cap_per_player
        }
        if (data.intelligence_data_status) {
          intelligenceDataStatus.value = {
            military_recruitment: !!data.intelligence_data_status.military_recruitment,
            scientists_recruitment: !!data.intelligence_data_status.scientists_recruitment,
            teaching_staff_recruitment: !!data.intelligence_data_status.teaching_staff_recruitment,
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки bundle экрана:', error)
      errorMessage.value = error.message || 'Ошибка загрузки экрана'
    } finally {
      isLoading.value = false
    }
  }

  /** --- Обновление настройки показа капитала на игрока --- */
  const updateShowCapPerPlayer = async (value) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_PROXY}/game_parameters/update_merchant_results_settings`,
        { show_cap_per_player: value }
      )
      showCapPerPlayer.value = value
    } catch (error) {
      console.error('Ошибка обновления настройки:', error)
      errorMessage.value = error.message || 'Ошибка обновления настройки'
    }
  }

  const updateIntelligenceDataStatus = async (nextStatus) => {
    try {
      const payloadStatus = {
        military_recruitment: !!nextStatus.military_recruitment,
        scientists_recruitment: !!nextStatus.scientists_recruitment,
        teaching_staff_recruitment: !!nextStatus.teaching_staff_recruitment,
      }
      await axios.patch(
        `${import.meta.env.VITE_PROXY}/game_parameters/update_merchant_results_settings`,
        { intelligence_data_status: payloadStatus }
      )
      intelligenceDataStatus.value = payloadStatus
    } catch (error) {
      console.error('Ошибка обновления статуса разведданных:', error)
      errorMessage.value = error.message || 'Ошибка обновления статуса разведданных'
      throw error
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
    showCapPerPlayer,
    intelligenceDataStatus,
    pollTime,

    // actions
    fetchScreenBundle,
    updateShowCapPerPlayer,
    updateIntelligenceDataStatus,
    startPolling,
    stopPolling,
    cleanup,
  }
})


