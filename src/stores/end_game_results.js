import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'
import { useCurrentCountry } from '@/composables/useCurrentCountry.js'

/**
 * Результаты года (many_teams, ТЗ № 2, § 9).
 *
 * Экран результатов относится к текущему государству (тому же, что в бейдже шапки)
 * и к выбранному году: запросы идут с явным `country_id`, а `year` передаётся только
 * для прошедших лет. Текущий год без `year` — живой расчёт (`source: 'live'`),
 * прошедшие — снимок года (`source: 'snapshot'`), поэтому уже показанные итоги
 * прошлых лет после смены года не меняются.
 */
export const useEndGameResultsStore = defineStore('merchant_results', () => {
  const { currentCountryId, withCountryParam } = useCurrentCountry()

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

  // Государство и год, к которым относятся загруженные данные
  const countryId = ref(null) // государство последнего ответа
  const currentYear = ref(null) // текущий год игры (живой расчёт)
  const selectedYear = ref(null) // null — текущий год, иначе год снимка
  const resultsYear = ref(null) // год, который вернул бэкенд
  const source = ref('live') // 'live' | 'snapshot'

  const pollTime = 5000
  const pollTimeout = {
    bundle: null,
  }

  // защита от гонки запросов (bundle)
  let lastBundleReqId = 0

  const api = () => import.meta.env.VITE_PROXY

  /** Адрес запроса в разрезе текущего государства (свои данные у каждого). */
  const countryUrl = path => withCountryParam(`${api()}${path}`, currentCountryId.value)

  /**
   * Адрес результатов: год передаём только для прошедших лет — текущий год
   * считается живым расчётом (без `year`).
   */
  const resultsUrl = path => {
    const url = countryUrl(path)
    const year = selectedYear.value
    if (!year || year === currentYear.value) return url

    return `${url}${url.includes('?') ? '&' : '?'}year=${year}`
  }

  const applySettings = data => {
    if (!data) return

    if (data.show_cap_per_player !== undefined) {
      showCapPerPlayer.value = !!data.show_cap_per_player
    }
    if (data.intelligence_data_status) {
      intelligenceDataStatus.value = {
        military_recruitment: !!data.intelligence_data_status.military_recruitment,
        scientists_recruitment: !!data.intelligence_data_status.scientists_recruitment,
        teaching_staff_recruitment: !!data.intelligence_data_status.teaching_staff_recruitment,
      }
    }
  }

  /** Год, государство и признак источника из ответа бэкенда. */
  const applyMeta = data => {
    if (data.year !== undefined && data.year !== null) {
      resultsYear.value = Number(data.year)
    }
    source.value = data.source === 'snapshot' ? 'snapshot' : 'live'
    if (data.country_id !== undefined && data.country_id !== null) {
      countryId.value = data.country_id
    }
    // Текущий год узнаём из живого расчёта (response.year)
    if (source.value === 'live' && resultsYear.value) {
      currentYear.value = resultsYear.value
    }
  }

  const isSnapshot = computed(() => source.value === 'snapshot')
  const isLive = computed(() => !isSnapshot.value)

  /** Выбран текущий год — результат считается живым. */
  const isCurrentYear = computed(() => !selectedYear.value || selectedYear.value === currentYear.value)

  /** Снимка за выбранный год нет: бэкенд вернул живой расчёт другого года. */
  const snapshotMissing = computed(() => !!selectedYear.value && resultsYear.value !== null && selectedYear.value !== resultsYear.value)

  /** Годы переключателя: текущий (живой расчёт) и прошедшие (снимки). */
  const yearOptions = computed(() => {
    const last = currentYear.value
    if (!last || last < 1) return []

    const options = []
    for (let year = last; year >= 1; year--) {
      options.push({ value: year, label: `Итоги года ${year}`, isCurrent: year === last })
    }

    return options
  })

  /** Значение переключателя года: пока год не выбран, показываем текущий. */
  const yearValue = computed(() => selectedYear.value || currentYear.value || null)

  /** Признак источника (живой расчёт / снимок) для интерфейса. */
  const sourceLabel = computed(() => {
    if (snapshotMissing.value) {
      return `Снимка за ${selectedYear.value} год нет — показан живой расчёт за ${resultsYear.value} год`
    }
    if (isSnapshot.value) {
      return resultsYear.value ? `Снимок, итоги года ${resultsYear.value}` : 'Снимок'
    }

    return resultsYear.value ? `Живой расчёт, год ${resultsYear.value}` : 'Живой расчёт'
  })

  /** Признак источника коротко — для экранов, где год уже показан отдельно. */
  const sourceShortLabel = computed(() => {
    if (snapshotMissing.value) return 'снимок не найден'
    if (isSnapshot.value) return 'снимок'

    return 'живой расчёт'
  })

  /** --- Bundle: экран + купцы + знать (текущее государство и выбранный год) --- */
  const fetchScreenBundle = async () => {
    const reqId = ++lastBundleReqId
    isLoading.value = true
    try {
      const { data } = await axios.get(resultsUrl('/game_parameters/screen_bundle'))
      if (reqId === lastBundleReqId && data) {
        if (Array.isArray(data.merchants)) merchantsList.value = data.merchants
        if (Array.isArray(data.nobles)) nobleInfList.value = data.nobles
        if (data.display) currentDisplay.value = data.display
        applySettings(data)
        applyMeta(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки bundle экрана:', error)
      errorMessage.value = error.message || 'Ошибка загрузки экрана'
    } finally {
      isLoading.value = false
    }
  }

  /** --- Настройки показа конкретного государства (не зависят от года) --- */
  const fetchMerchantResultsSettings = async () => {
    try {
      const { data } = await axios.get(countryUrl('/game_parameters/get_merchant_results_settings'))
      applySettings(data)
    } catch (error) {
      console.error('Ошибка загрузки настроек экрана:', error)
      errorMessage.value = error.message || 'Ошибка загрузки настроек экрана'
    }
  }

  /**
   * Переключение года: текущий год — живой расчёт, прошедшие — снимок года (§9 п. 5).
   * Возврат к текущему году — снова живой расчёт.
   */
  const setResultsYear = async (year) => {
    const next = year === null || year === undefined || year === '' ? null : Number(year)
    selectedYear.value = next && next !== currentYear.value ? next : null
    isLoading.value = true
    try {
      await fetchScreenBundle()
      await fetchMerchantResultsSettings()
    } finally {
      isLoading.value = false
    }
  }

  /** Сброс данных прошлого государства при смене текущего (§1.1, §9 п. 4). */
  const resetState = () => {
    merchantsList.value = []
    nobleInfList.value = []
    currentDisplay.value = 'merchPlaceholder'
    showCapPerPlayer.value = true
    intelligenceDataStatus.value = {
      military_recruitment: false,
      scientists_recruitment: false,
      teaching_staff_recruitment: false,
    }
    selectedYear.value = null
    resultsYear.value = null
    currentYear.value = null
    source.value = 'live'
    countryId.value = currentCountryId.value ?? null
  }

  /**
   * Перечитать экран после смены государства: подэкран и настройки показа
   * у каждого государства свои — данные прошлого не остаются.
   */
  const reloadForCountry = async () => {
    resetState()
    isLoading.value = true
    try {
      await fetchScreenBundle()
      await fetchMerchantResultsSettings()
    } finally {
      isLoading.value = false
    }
  }

  /** --- Обновление настройки показа капитала на игрока (своё у государства) --- */
  const updateShowCapPerPlayer = async (value) => {
    try {
      await axios.patch(
        countryUrl('/game_parameters/update_merchant_results_settings'),
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
        countryUrl('/game_parameters/update_merchant_results_settings'),
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
    // государство и год
    countryId,
    currentYear,
    selectedYear,
    resultsYear,
    source,
    isSnapshot,
    isLive,
    isCurrentYear,
    snapshotMissing,
    yearOptions,
    yearValue,
    sourceLabel,
    sourceShortLabel,

    // actions
    fetchScreenBundle,
    fetchMerchantResultsSettings,
    setResultsYear,
    resetState,
    reloadForCountry,
    updateShowCapPerPlayer,
    updateIntelligenceDataStatus,
    startPolling,
    stopPolling,
    cleanup,
  }
})
