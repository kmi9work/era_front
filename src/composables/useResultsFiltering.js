import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { useEndGameResultsStore } from '@/stores/end_game_results.js'

export function useResultsFiltering() {
  const endGameResultsStore = useEndGameResultsStore()
  
  const activeScreen = ref('merchPlaceholder')
  const currentMerchPlace = ref(0)
  const currentNoblePlace = ref(0)
  const isTransitioning = ref(false)

  const placeMap = {
    firstMerch: 1,
    secondMerch: 2, 
    thirdMerch: 3,
    firstMerchBoyar: 1,
    secondMerchBoyar: 2,
    thirdMerchBoyar: 3,
    firstMerchBoyarWithCapital: 1,
    secondMerchBoyarWithCapital: 2,
    thirdMerchBoyarWithCapital: 3,
    firstNoble: 1,
    secondNoble: 2,
    thirdNoble: 3,
  }

  const currentPlace = computed(() => {
    return placeMap[activeScreen.value] || 0
  })

  // Синхронизация с store (только если не было локальных изменений)
  const isLocalUpdate = ref(false)
  watch(() => endGameResultsStore.currentDisplay, (newScreen) => {
    // Не перезаписываем, если изменение было локальным
    if (!isLocalUpdate.value && newScreen) {
      activeScreen.value = newScreen
    }
    isLocalUpdate.value = false
  })

  // Watch для синхронизации currentMerchPlace с currentPlace
  watch(currentPlace, (newPlace) => {
    currentMerchPlace.value = newPlace
    currentNoblePlace.value = newPlace
  })

  // Watch который следит за изменениями activeScreen
  watch(activeScreen, (newScreen, oldScreen) => {
    const newPlace = placeMap[newScreen] || 0
    
    // Здесь можно добавить дополнительную логику
    if (newPlace !== 0) {
      // Выполнить какие-то действия при смене места
    }
  }, { immediate: true })

  watch(activeScreen, (newScreen) => {
    // Здесь можно добавить логику синхронизации с store если нужно
  })

  watch(() => endGameResultsStore.currentNobleResultsScreen, (newScreen) => {
    // Здесь можно добавить дополнительную логику при изменении экрана
  })

  watch(
    () => endGameResultsStore.merchantResults,
    (val) => {
      // Пустой watch, оставлен для совместимости
    },
    { deep: true }
  )

  const merchResults = computed(() => {
    // Для комбинированного вывода показываем все результаты
    if (activeScreen.value === 'allMerchBoyarWithCapital') {
      return endGameResultsStore.merchantsList
    }
    
    if (currentMerchPlace.value === 0) {
      return endGameResultsStore.merchantsList
    } else {
      return endGameResultsStore.merchantsList.filter(
        (merchant) => merchant.place === currentPlace.value
      )
    }
  })

  const nobleResults = computed(() => {
    if (currentNoblePlace.value === 0) {
      return endGameResultsStore.nobleInfList
    } else {
      return endGameResultsStore.nobleInfList.filter(
        (noble) => noble.place === currentPlace.value
      )
    }
  })

  const toggleResultsDisplay = async (display) => {
    isLocalUpdate.value = true
    activeScreen.value = display
    try {
      await axios.patch(
        `${import.meta.env.VITE_PROXY}/game_parameters/change_results_display`,
        { request: display }
      )
      isTransitioning.value = true
      setTimeout(() => {
        isTransitioning.value = false
      }, 300)
    } catch (error) {
      console.error("Ошибка при смене экрана:", error)
      isLocalUpdate.value = false
    }
  }

  const filterMerchResults = async (display, place = null) => {
    if (place != null) {
      currentMerchPlace.value = place
    }
    await toggleResultsDisplay(display)
  }

  const filterNobleResults = async (display, place = null) => {
    if (place != null) {
      currentNoblePlace.value = place
    }
    await toggleResultsDisplay(display)
  }

  return {
    activeScreen,
    currentMerchPlace,
    currentNoblePlace,
    currentPlace,
    isTransitioning,
    merchResults,
    nobleResults,
    filterMerchResults,
    filterNobleResults,
    toggleResultsDisplay
  }
}

