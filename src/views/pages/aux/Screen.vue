<script setup>
import { ref, computed, watch, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { useTimerStore } from '@/stores/timer'
import { useEndGameResultsStore } from '@/stores/end_game_results.js'
import { storeToRefs } from 'pinia'

import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'
import previewMerchResults from '@/assets/images/preview_merch_results.jpg'

// Состояния
const isFullscreen = ref(false)
const selectedScreen = ref('placeholder')
const timerStore = useTimerStore()
const endGameResultsStore = useEndGameResultsStore()
const { showResultsLevel, isLoading: merchantsLoading, errorMessage: merchantsError } = storeToRefs(endGameResultsStore)
const isTransitioning = ref(false)
const timerMessage = ref('Проверьте расписание. Либо его нет, либо циклы еще не начались, либо уже закончились')
const pollInterval = ref(null)
const activeScreen = ref('merchPlaceholder')
const currentMerchPlace = ref(0)
const currentNoblePlace = ref(0)

// Товарооборот
const tradeTurnovers = ref([])
const tradeLevels = ref({})
const allThresholds = ref({})

// Загружаем товарообороты
const fetchTradeTurnovers = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/show_trade_turnover.json`)
    tradeTurnovers.value = response.data
    
    // Загружаем уровни торговли
    await fetchTradeLevels()
  } catch (error) {
    console.error('Error fetching trade turnovers:', error)
  }
}

// Загружаем текущие уровни торговли для всех стран
const fetchTradeLevels = async () => {
  try {
    const promises = tradeTurnovers.value.map(async (item) => {
      try {
        const levelResponse = await axios.get(`${import.meta.env.VITE_PROXY}/countries/${item.country_id}/show_current_trade_level.json`)
        const thresholdsResponse = await axios.get(`${import.meta.env.VITE_PROXY}/countries/${item.country_id}/show_trade_thresholds.json`)
        return { 
          countryId: item.country_id, 
          level: levelResponse.data,
          thresholds: thresholdsResponse.data
        }
      } catch (error) {
        console.error(`Error fetching trade level for country ${item.country_id}:`, error)
        return { countryId: item.country_id, level: null, thresholds: [] }
      }
    })
    
    const results = await Promise.all(promises)
    results.forEach(result => {
      if (result.level) {
        tradeLevels.value[result.countryId] = result.level
      }
      if (result.thresholds && result.thresholds.length > 0) {
        allThresholds.value[result.countryId] = result.thresholds
      }
    })
  } catch (error) {
    console.error('Error fetching trade levels:', error)
  }
}

// Форматирование товарооборота
const formatTurnover = (turnover) => {
  // Если nil, undefined или 0 - возвращаем '0'
  if (turnover == null || turnover === 0 || turnover === '') return '0'
  return turnover.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Вычисление процента прогресса до следующего уровня
const getProgressPercent = (countryId, tradeTurnover) => {
  const level = tradeLevels.value[countryId]
  const thresholds = allThresholds.value[countryId]
  
  if (!level || !thresholds || thresholds.length === 0) return 0
  
  // Обрабатываем nil/undefined как 0
  const safeTurnover = tradeTurnover || 0
  
  const currentLevel = level.current_level
  const nextThreshold = level.threshold
  
  // Находим порог ПРЕДЫДУЩЕГО уровня (current_level - 1)
  let previousThreshold = 0
  if (currentLevel > 1) {
    const previousLevelData = thresholds.find(t => t.level === (currentLevel - 1))
    if (previousLevelData) {
      previousThreshold = previousLevelData.threshold
    }
  }
  
  // Вычисляем прогресс между предыдущим и следующим порогом
  const levelRange = nextThreshold - previousThreshold
  const currentProgress = safeTurnover - previousThreshold
  
  if (levelRange <= 0) return 0
  
  const percent = (currentProgress / levelRange) * 100
  
  console.log(`[${countryId}] Level: ${currentLevel}, Current: ${safeTurnover}, Prev: ${previousThreshold}, Next: ${nextThreshold}, Progress: ${percent}%`)
  
  return Math.min(Math.max(percent, 0), 100)
}

// Определение цвета прогресс-бара
const getProgressColor = (level) => {
  if (!level) return '#808080'
  const currentLevel = level.current_level
  if (currentLevel >= 5) return '#4CAF50' // success green
  if (currentLevel >= 4) return '#2196F3' // primary blue
  if (currentLevel >= 2) return '#FF9800' // warning orange
  return '#00BCD4' // info cyan
}

// Получить название текущего уровня
const getLevelName = (countryId) => {
  const level = tradeLevels.value[countryId]
  const thresholds = allThresholds.value[countryId]
  
  if (!level || !thresholds || thresholds.length === 0) return ''
  
  const currentLevel = level.current_level || 0
  
  // Для нулевого уровня возвращаем название первого уровня или пустую строку
  if (currentLevel === 0) {
    const firstLevel = thresholds.find(t => t.level === 1)
    return firstLevel?.name || ''
  }
  
  const levelData = thresholds.find(t => t.level === currentLevel)
  
  return levelData?.name || ''
}

// Функции для работы с полноэкранным режимом
const toggleFullscreen = () => {
  const element = document.getElementById('fullscreen-content')
  if (!element) return

  if (!isFullscreen.value) {
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
}


const placeMap = {
  firstMerch: 1,
  secondMerch: 2, 
  thirdMerch: 3,
  firstNoble: 1,
  secondNoble: 2,
  thirdNoble: 3,
}

const currentPlace = computed(() => {
  return placeMap[activeScreen.value] || 0
})

// Watch который следит за изменениями activeScreen
watch(activeScreen, (newScreen, oldScreen) => {
  const newPlace = placeMap[newScreen] || 0
  
  // Здесь можно добавить дополнительную логику
  if (newPlace !== 0) {
    // Выполнить какие-то действия при смене места
  }
}, { immediate: true }) // immediate: true - выполнить сразу при загрузке



// Синхронизация с store
watch(() => endGameResultsStore.currentDisplay, (newScreen) => {
  activeScreen.value = newScreen
})

const filterMerchResults = async (display, place = null) => {
  if (place != null)
    {currentMerchPlace.value = place}
  await toggleResultsDisplay(display) // Ждем завершения запроса
}

const filterNobleResults = async (display, place = null) => {
  if (place != null)
    {currentNoblePlace.value = place}
  await toggleResultsDisplay(display) // Ждем завершения запроса
}

watch(
  () => endGameResultsStore.merchantResults,
  (val) => {
  },
  { deep: true }
)



// Watch для синхронизации currentMerchPlace с currentPlace
watch(currentPlace, (newPlace) => {

    currentMerchPlace.value = newPlace
    currentNoblePlace.value = newPlace

})


const merchResults = computed(() => { // RENAME
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




// Обработчик клавиш
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

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

// Настройка polling
const startPolling = () => {
  loadScreen()
  fetchTradeTurnovers()  // Загружаем товарообороты сразу
  pollInterval.value = setInterval(() => {
    loadScreen()
    fetchTradeTurnovers()  // Обновляем товарообороты каждые 5 сек
  }, 5000)
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


watch(activeScreen, (newScreen) => {
  // Здесь можно добавить логику синхронизации с store если нужно
})



watch(() => endGameResultsStore.currentNobleResultsScreen, (newScreen) => {
  // Здесь можно добавить дополнительную логику при изменении экрана
});

const toggleResultsDisplay = async (display) => {
  activeScreen.value = display
  try {
    activeScreen.value = display
    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/change_results_display`,
      { request: display}
    )
    isTransitioning.value = true
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  } catch (error) {
    console.error("Ошибка при смене экрана:", error)
  }
}


// Хуки жизненного цикла
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
  startPolling()
  
  // Запускаем polling store и ждем загрузки
  endGameResultsStore.startPolling()
  endGameResultsStore.fetchNobleResults()
  endGameResultsStore.fetchCurrDisplay()
  filterMerchResults('merchPlaceholder', 0)
  
  // Если нужно сразу загрузить данные
  endGameResultsStore.fetchMerchantResults().catch(error => {
    console.error('Ошибка загрузки merchants:', error)
  })


})

onBeforeUnmount(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
  
  endGameResultsStore.stopPolling()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('fullscreenchange', () => {})
})


</script>

<template>

  <!-- Режим управления (не полноэкранный) -->
  <div v-if="!isFullscreen" class="management-mode">
    <div class="preview-container">
      <div class="preview-selector">
        <div 
          v-for="screen in [         
            { id: 'placeholder', label: 'Заглушка' },
            { id: 'timer', label: 'Таймер' },
            { id: 'trade_turnover', label: 'Товарооборот' },
            { id: 'merchant_results', label: 'Результаты купцов' },
            { id: 'noble_results', label: 'Результаты знати' }
          ]"
          :key="screen.id"
          class="preview-card"
          :class="{ active: selectedScreen === screen.id }"
          @click="changeScreen(screen.id)"
        >
          <div class="preview-title">
            <strong>{{ screen.label }}</strong>
          </div>
          
          <div class="preview-content">

            <div v-if="screen.id === 'placeholder'" class="screen-preview">
              <img class="preview-image" :src="previewPlaceholder" alt="Заглушка">
            </div>
            
            <div v-else-if="screen.id === 'timer'" class="timer-preview">
              <div v-if="timerStore.isOutOfRange" class="preview-message">
                {{ timerMessage }}
              </div>
              <div v-else>
                <p class="preview-schedule-name">{{ timerStore.currentScheduleItemName }}</p>
                <p class="preview-timer-value">{{ timerStore.formattedRemainingTime }}</p>
              </div>
            </div>

            <div v-else-if="screen.id === 'trade_turnover'" class="timer-preview">
              <div class="preview-message">
                <p style="font-size: 1.2rem; margin-bottom: 8px;">Товарооборот</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Торговля с иностранными государствами</p>
              </div>
            </div>

            <div v-else-if="screen.id === 'noble_results'" class="results-preview">
              <div class="preview-message">
     
              </div>
              <div class="merchant-controls-compact">
                <button 
                  @click="() => {filterNobleResults('noblePlaceholder'); }"
                  :class="{ active: activeScreen === 'noblePlaceholder'}"
                  class="compact-button all-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Показать все результаты"
                >
                  Заглушка
                </button>

                <button 
                  @click="() => {filterNobleResults('thirdPlaceNoble'); }"
                  :class="{ active: activeScreen === 'thirdPlaceNoble' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  '3.1'
                </button>
                
                <button 
                  @click="() => { filterNobleResults('thirdNoble', 3); }"
                  :class="{  active: activeScreen === 'thirdNoble' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  3
                </button>

                <button 
                  @click="() => {filterNobleResults('secondPlaceNoble'); }"
                  :class="{ active: activeScreen === 'secondPlaceNoble' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  '2.1'
                </button>
                
                <button 
                  @click="() => { filterNobleResults('secondNoble', 2);}"
                  :class="{  active: activeScreen  === 'secondNoble' }"
                  class="compact-button second-third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Второе и третье места"
                >
                  2
                </button>
                
                <button 
                  @click="() => {filterNobleResults('firstPlaceNoble'); }"
                  :class="{ active: activeScreen === 'firstPlaceNoble' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  '1.1'
                </button>

                <button 
                  @click="() => { filterNobleResults('firstNoble', 1)}"
                  :class="{ active: activeScreen  === 'firstNoble' }"
                  class="compact-button top-three-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Топ 3 места"
                >
                  1
                </button>

                <button 
                  @click="() => {filterNobleResults('allNoble', 0); }"
                  :class="{ active: activeScreen === 'allNoble' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  Вся знать
                </button>


              </div>

            </div>

            <div v-else-if="screen.id === 'merchant_results'" class="results-preview">
              <div class="preview-message">
     
              </div>

              <div class="merchant-controls-compact">
                <button 
                  @click="() => {filterMerchResults('merchPlaceholder'); }"
                  :class="{ active: activeScreen === 'merchPlaceholder'}"
                  class="compact-button all-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Показать все результаты"
                >
                  Заглушка
                </button>

                <button 
                  @click="() => {filterMerchResults('thirdPlaceMerch'); }"
                  :class="{ active: activeScreen === 'thirdPlaceMerch' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  '3.1'
                </button>


                
                <button 
                  @click="() => { filterMerchResults('thirdMerch',3); }"
                  :class="{  active: activeScreen === 'thirdMerch' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  3
                </button>


                <button 
                  @click="() => {filterMerchResults('secondPlaceMerch'); }"
                  :class="{ active: activeScreen === 'secondPlaceMerch' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  '2.1'
                </button>


                
                <button 
                  @click="() => { filterMerchResults('secondMerch', 2); }"
                  :class="{  active: activeScreen  === 'secondMerch' }"
                  class="compact-button second-third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Второе и третье места"
                >
                  2
                </button>
                

                <button 
                  @click="() => {filterMerchResults('firstPlaceMerch'); }"
                  :class="{ active: activeScreen === 'firstPlaceMerch' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  '1.1'
                </button>



                <button 
                  @click="() => { filterMerchResults('firstMerch', 1); }"
                  :class="{ active: activeScreen  === 'firstMerch' }"
                  class="compact-button top-three-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Топ 3 места"
                >
                  1
                </button>



                <button 
                  @click="() => {filterMerchResults('allMerch', 0); }"
                  :class="{ active: activeScreen === 'allMerch' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  Все купцы
                </button>


              </div>
            </div>
          </div>

          <div 
            v-if="screen.id === 'timer'" 
            class="preview-controls"
            @click.stop
          >
            <button 
              @click="timerStore.toggleTimer"
              :disabled="timerStore.isLoading"
              class="timer-button"
              :class="{ 
                'active': !timerStore.isPaused,
                'loading': timerStore.isLoading,
                'paused': timerStore.isPaused && !timerStore.isLoading
              }"
            >
              <span v-if="!timerStore.isLoading">
                {{ timerStore.isPaused ? 'Запустить таймер' : 'Остановить таймер' }}
              </span>
              <span v-else class="loader">
                <svg class="spinner" viewBox="0 0 50 50">
                  <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                </svg>
                Загрузка...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="fullscreen-control">
      <button class="fullscreen-button" @click="toggleFullscreen"><span>Вывести на экран</span></button>
    </div>
  </div>

  <!-- Полноэкранный режим -->
  <div id="fullscreen-content" :class="['fullscreen-mode', { active: isFullscreen }]">
    <Transition name="fade" mode="out-in">
      <div class="fullscreen-content-wrapper" :key="selectedScreen">
        <template v-if="selectedScreen === 'placeholder'">
          <div class="screen-content"> 
            <img class="fullscreen-image" :src="previewPlaceholder" alt="Заглушка">
          </div>
        </template>
        
        <template v-else-if="selectedScreen === 'timer'">
          <Transition name="timer-fade" mode="out-in">
            <div class="fullscreen-text-container" :key="timerStore.isPaused ? 'paused' : 'running'">
              <div v-if="timerStore.isOutOfRange">
                <p class="fullscreen-timer-value">{{ timerStore.outOfRangeMessage }}</p>
              </div>
              <div v-else>
                <Transition name="text-fade" mode="out-in">
                  <p key="schedule" class="fullscreen-schedule-name">
                    {{ timerStore.currentScheduleItemName }}
                  </p>
                </Transition>
                <Transition name="text-fade" mode="out-in">
                  <p key="timer" class="fullscreen-timer-value">
                    {{ timerStore.formattedRemainingTime }}
                  </p>
                </Transition>
              </div>
            </div>
          </Transition>
        </template>

        <template v-else-if="selectedScreen === 'trade_turnover'">
          <div class="fullscreen-text-container">
            <!-- Верхняя часть: таймер или "Эпоха перемен" -->
            <Transition name="timer-fade" mode="out-in">
              <div :key="timerStore.isOutOfRange ? 'out-of-range' : 'active'">
                <!-- Если вне расписания - показываем "Эпоха перемен" -->
                <div v-if="timerStore.isOutOfRange">
                  <p class="fullscreen-timer-value">{{ timerStore.outOfRangeMessage }}</p>
                </div>
                
                <!-- Если в расписании - показываем таймер -->
                <div v-else>
                  <Transition name="text-fade" mode="out-in">
                    <p key="title" class="fullscreen-schedule-name">
                      {{ timerStore.currentScheduleItemName }}
                    </p>
                  </Transition>
                  <Transition name="text-fade" mode="out-in">
                    <p key="timer" class="fullscreen-timer-value">
                      {{ timerStore.formattedRemainingTime }}
                    </p>
                  </Transition>
                </div>
              </div>
            </Transition>
            
            <!-- Товарооборот с флагами - ВСЕГДА показывается -->
            <div class="trade-turnover-fullscreen">
              <Transition name="text-fade" mode="out-in">
                <div key="turnovers" class="countries-grid">
                  <div 
                    v-for="item in tradeTurnovers" 
                    :key="item.country_id"
                    class="country-turnover-card"
                  >
                    <!-- Иконка отношений в верхнем левом углу -->
                    <div v-if="item.relations !== undefined" class="relations-badge">
                      <img 
                        :src="`/images/relations/${item.relations}.png`"
                        class="relations-icon"
                        :alt="`Отношения: ${item.relations}`"
                        :title="`Отношения с Русью: ${item.relations}`"
                      />
                    </div>
                    
                    <img 
                      :src="`/images/countries/${item.country_name}.png`"
                      class="country-flag-large"
                      :alt="item.country_name"
                    />
                    
                    <!-- Информация об уровне и товарообороте -->
                    <div v-if="tradeLevels[item.country_id]" class="turnover-info">
                      <!-- Название уровня -->
                      <div v-if="getLevelName(item.country_id)" class="level-name-badge">
                        {{ getLevelName(item.country_id) }}
                      </div>
                      
                      <div class="turnover-amount">
                        {{ formatTurnover(item.trade_turnover) }}
                      </div>
                      
                      <!-- Прогресс-бар -->
                      <div class="progress-container">
                        <div class="progress-track">
                          <div 
                            class="progress-fill"
                            :style="{ 
                              width: getProgressPercent(item.country_id, item.trade_turnover) + '%',
                              backgroundColor: getProgressColor(tradeLevels[item.country_id])
                            }"
                          >
                            <div class="progress-shine"></div>
                          </div>
                        </div>
                        <div class="progress-text">
                          До следующего уровня: {{ formatTurnover(tradeLevels[item.country_id].to_next_level) }}
                        </div>
                      </div>
                    </div>
                    
                    <!-- Если данные еще не загружены -->
                    <div v-else class="turnover-amount">
                      {{ formatTurnover(item.trade_turnover) }}
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </template>

<template v-else-if="selectedScreen === 'merchant_results'">
  <div class="results-screen">
    
    <!-- Заглушка -->
    <div v-if="activeScreen === 'merchPlaceholder'" class="all-results-container">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты купцов</div>
      </div>
    </div>

    <!-- Текстовые заголовки -->
    <div v-else-if="activeScreen === 'thirdPlaceMerch'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Третье место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondPlaceMerch'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Второе место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstPlaceMerch'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Первое место</div> 
      </div>
    </div>

    <!-- Детальные результаты -->
    <div v-else-if="activeScreen === 'thirdMerch'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <span class="winner-stats">
              {{ team.capital.toLocaleString() }}💰 • 
              {{ team.number_of_players }}👥 • 
              <span class="highlight-gold">{{ (team.cap_per_pl || 0).toLocaleString() }}</span> •
              <span class="highlight-gold">{{ team.boyar_favor || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondMerch'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <span class="winner-stats">
              {{ team.capital.toLocaleString() }}💰 • 
              {{ team.number_of_players }}👥 • 
              <span class="highlight-gold">{{ (team.cap_per_pl || 0).toLocaleString() }}</span> •
              <span class="highlight-gold">{{ team.boyar_favor || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstMerch'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <span class="winner-stats">
              {{ team.capital.toLocaleString() }}💰 • 
              {{ team.number_of_players }}👥 • 
              <span class="highlight-gold">{{ (team.cap_per_pl || 0).toLocaleString() }}</span> •
              <span class="highlight-gold">{{ team.boyar_favor || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица всех результатов -->
    <div v-else-if="activeScreen === 'allMerch'" class="all-results-container">
      <div class="fullscreen-text-container">
        <table class="merchant-table">
          <thead>
            <tr>
              <th class="place-col">Место</th>
              <th class="name-col">Команда</th>
              <th class="capital-col">Капитал</th>
              <th class="players-col">Игроков</th>
              <th class="capital-per-player-col">На игрока</th>
              <th class="favor-col">Боярская милость</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(team, index) in merchResults" 
              :key="team.player_id || index"
              :class="'place-' + team.place"
            >
              <td class="place-number">{{ team.place }}</td>
              <td class="team-name">{{ team.player }}</td>
              <td class="team-capital">{{ team.capital.toLocaleString() }}💰</td>
              <td class="team-players">{{ team.number_of_players }}👥</td>
              <td class="team-capital-per-player">{{ (team.cap_per_pl || 0).toLocaleString() }}💰</td>
              <td class="team-favor">{{ team.boyar_favor || 0 }}⚜️</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fallback -->
    <div v-else class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты купцов</div>
    </div>

  </div>
</template>

<template v-else-if="selectedScreen === 'noble_results'">
  <div class="results-screen">
    
    <!-- Заглушка -->
    <div v-if="activeScreen === 'noblePlaceholder'" class="all-results-container">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты знати</div>
      </div>
    </div>

    <!-- Текстовые заголовки мест -->
    <div v-else-if="activeScreen  === 'thirdPlaceNoble'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Третье место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondPlaceNoble'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Второе место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstPlaceNoble'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Первое место</div> 
      </div>
    </div>

    <!-- Детальные результаты по местам (числовые) -->
    <div v-else-if="activeScreen === 'thirdNoble'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(noble, index) in nobleResults" 
            :key="index" 
            class="winner-line"
          >
            <span class="winner-name">{{ noble.noble_name }}</span>
            <span class="winner-stats">
              <span class="highlight-gold">{{ noble.noble_influence || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondNoble'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(noble, index) in nobleResults" 
            :key="index" 
            class="winner-line"
          >
            <span class="winner-name">{{ noble.noble_name }}</span>
            <span class="winner-stats">
              <span class="highlight-gold">{{ noble.noble_influence || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstNoble'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(noble, index) in nobleResults" 
            :key="index" 
            class="winner-line"
          >
            <span class="winner-name">{{ noble.noble_name }}</span>
            <span class="winner-stats">
              <span class="highlight-gold">{{ noble.noble_influence || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>


  <!-- Все результаты -->
 <!-- Все результаты -->
<div v-else-if="activeScreen === 'allNoble'" class="all-results-container">
  <div class="fullscreen-text-container">
    
    <div class="noble-grid-layout">
      <div 
        v-for="(noble, index) in nobleResults"  
        :key="index" 
        class="noble-card"
        :class="'place-' + noble.place" 
      >
        <div class="noble-header">
          <span class="place-badge">{{ noble.place }}</span>
          <span class="noble-name">{{ noble.noble_name }}</span>
        </div>
        <div class="noble-stats">
          <div class="stat-item">
            <span class="stat-value">{{ noble.noble_influence || 0 }}</span>
            <span class="stat-label">Влияние</span>
          </div>
          <div class="stat-icon">⚜️</div>
        </div>
      </div>
    </div>
  </div>
</div>



    <!-- Fallback если ничего не подошло -->
    <div v-else class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты знати</div>
    </div>

  </div>
</template>


      </div>
    </Transition>
  </div>
</template>

<style scoped>

.noble-grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  max-width: 95%;
  margin: 0 auto;
  padding: 2rem;
}

.noble-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  animation: cardAppear 0.6s ease;
}

.noble-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}

.noble-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.place-badge {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  font-family: 'Beryozki', sans-serif;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Цвета для мест */
.place-1 .place-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.place-2 .place-badge {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
  color: #000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.place-3 .place-badge {
  background: linear-gradient(135deg, #CD7F32, #B06A26);
  color: #000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.place-4 .place-badge,
.place-5 .place-badge,
.place-6 .place-badge {
  background: linear-gradient(135deg, #2C3E50, #34495E);
  color: #ECF0F1;
}

.noble-name {
  font-family: 'Beryozki', sans-serif;
  font-size: 5rem;
  font-weight: bold;
  color: #FFF;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  flex: 1;
}

.noble-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-family: 'Beryozki', monospace;
  font-size: 3rem;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  line-height: 1;
}

.stat-label {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-icon {
  font-size: 3rem;
  opacity: 0.8;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* Анимации */
@keyframes cardAppear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.noble-card:nth-child(odd) {
  animation-delay: 0.1s;
}

.noble-card:nth-child(even) {
  animation-delay: 0.2s;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .noble-grid-layout {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .noble-grid-layout {
    grid-template-columns: 1fr;
    max-width: 100%;
    padding: 1rem;
    gap: 1rem;
  }
  
  .noble-card {
    padding: 1.5rem;
  }
  
  .noble-header {
    gap: 1rem;
  }
  
  .place-badge {
    width: 40px;
    height: 40px;
    font-size: 1.4rem;
  }
  
  .noble-name {
    font-size: 1.8rem;
  }
  
  .stat-value {
    font-size: 2.2rem;
  }
  
  .stat-icon {
    font-size: 2.2rem;
  }
}

@media (max-width: 480px) {
  .noble-card {
    padding: 1rem;
  }
  
  .noble-name {
    font-size: 1.5rem;
  }
  
  .stat-value {
    font-size: 1.8rem;
  }
  
  .stat-label {
    font-size: 1rem;
  }
}

/* Дополнительные эффекты для призовых мест */
.place-1 {
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.2);
}

.place-2 {
  border: 2px solid rgba(192, 192, 192, 0.3);
  box-shadow: 0 8px 32px rgba(192, 192, 192, 0.2);
}

.place-3 {
  border: 2px solid rgba(205, 127, 50, 0.3);
  box-shadow: 0 8px 32px rgba(205, 127, 50, 0.2);
}

  .merchant-table {
  width: 90%;
  border-collapse: collapse;
  font-family: 'Beryozki', sans-serif;
  font-size:4rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.merchant-table th {
  background: rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  text-align: center;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.merchant-table td {
  padding: 1.2rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.merchant-table tr:last-child td {
  border-bottom: none;
}

.merchant-table tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Цвета для призовых мест */
.merchant-table tr.place-1 {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent);
}

.merchant-table tr.place-2 {
  background: linear-gradient(90deg, rgba(192, 192, 192, 0.1), transparent);
}

.merchant-table tr.place-3 {
  background: linear-gradient(90deg, rgba(205, 127, 50, 0.1), transparent);
}

/* Анимация появления строк */
.merchant-table tr {
  animation: slideIn 0.5s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .merchant-table {
    font-size: 1.8rem;
    width: 95%;
  }
  
  .merchant-table th,
  .merchant-table td {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .merchant-table {
    font-size: 1.4rem;
  }
  
  .merchant-table th,
  .merchant-table td {
    padding: 0.8rem;
  }
}
.fullscreen-text-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  text-align: center;
}

.fullscreen-results {
  font-family: 'Beryozki', sans-serif;
  font-size: 12rem;
  font-weight: bold;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
  line-height: 1;
  color: white;
}


.fullscreen-schedule-name {
  font-family: 'Beryozki', sans-serif;
  font-size: 6rem;
  font-weight: bold;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
  margin-bottom: 2rem;
  line-height: 1;
}

.fullscreen-place-title {
  font-family: 'Beryozki', sans-serif;
  font-size: 20rem;
  font-weight: bold;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
  margin-bottom: 1rem;
  line-height: 1;
}

.fullscreen-place-subtitle {
  font-family: 'Beryozki', sans-serif;
  font-size: 3rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* Списки результатов - УМЕНЬШЕНЫ ОТСТУПЫ */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.result-line {
  font-family: 'Beryozki', monospace;
  font-size: 3rem;
  font-feature-settings: "tnum";
  text-rendering: optimizeLegibility;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.winner-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.winner-line {
  font-family: 'Beryozki', monospace;
  font-size: 4rem;
  font-feature-settings: "tnum";
  text-rendering: optimizeLegibility;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.winner-name {
  font-size: 5rem;
  font-weight: bold;
  margin-bottom: 0.1rem;
}

.winner-stats {
  font-size: 5rem;
  opacity: 0.7;
  margin-top: 0.3rem
}

/* Цвета для призовых мест */
.gold .fullscreen-place-title {
  color: #FFD700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.silver .fullscreen-place-title {
  color: #C0C0C0;
  text-shadow: 0 0 20px rgba(192, 192, 192, 0.5);
}

.bronze .fullscreen-place-title {
  color: #CD7F32;
  text-shadow: 0 0 20px rgba(205, 127, 50, 0.5);
}

.place-1 .place-number { color: #FFD700; }
.place-2 .place-number { color: #C0C0C0; }
.place-3 .place-number { color: #CD7F32; }

/* Анимации как в таймере */
.place-section {
  animation: text-fade-enter 0.5s ease;
}

@keyframes text-fade-enter {
  from {
    opacity: 0;
    filter: blur(10px);
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}

.result-line,
.winner-line {
  animation: slide-up 0.6s ease;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .fullscreen-place-title {
    font-size: 5rem;
    margin-bottom: 0.5rem;
  }
  
  .fullscreen-place-subtitle {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }
  
  .fullscreen-schedule-name {
    font-size: 3rem;
    margin-bottom: 1.5rem;
  }
  
  .result-line {
    font-size: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .winner-line {
    font-size: 2.5rem;
    gap: 0.3rem;
  }
  
  .winner-name {
    font-size: 3rem;
    margin-bottom: 0.3rem;
  }
  
  .winner-stats {
    font-size: 1.8rem;
  }
  
  .results-list {
    gap: 0.8rem;
  }
  
  .winner-list {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .fullscreen-place-title {
    font-size: 3.5rem;
  }
  
  .fullscreen-place-subtitle {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .fullscreen-schedule-name {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .result-line {
    font-size: 1.6rem;
    gap: 0.8rem;
  }
  
  .winner-line {
    font-size: 2rem;
  }
  
  .winner-name {
    font-size: 2.5rem;
  }
  
  .winner-stats {
    font-size: 1.5rem;
  }
  
  .results-list {
    gap: 0.6rem;
  }
  
  .winner-list {
    gap: 0.8rem;
  }
}

/* Остальные стили остаются без изменений */
.management-mode {
  padding: 1rem;
}


.merch-placeholder-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Адаптивность */
@media (max-width: 768px) {
  .merch-placeholder-image {
    max-width: 95vw;
    max-height: 95vh;
  }
}

@media (max-width: 480px) {
  .merch-placeholder-image {
    max-width: 98vw;
    max-height: 98vh;
  }
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-selector {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.highlight-gold {
  color: #FFD700;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  animation: gold-pulse 2s ease-in-out infinite;
}

@keyframes gold-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; text-shadow: 0 0 15px rgba(255, 215, 0, 0.8); }
}

.preview-card {
  width: 280px;
  border: 2px solid #e1e1e1;
  border-radius: 12px;
  background: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  cursor: pointer;
}

.preview-card.active {
  border-color: #42b983;
  box-shadow: 0 0 0 3px #42b983;
}

.preview-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.preview-title {
  padding: 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e1e1e1;
  text-align: center;
}

.preview-title strong {
  font-size: 1.2rem;
  color: #333;
}

.preview-content {
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.screen-preview {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: 4px;
}

.timer-preview {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.preview-message {
  font-size: 0.9rem;
  color: #666;
  padding: 0.5rem;
}

.preview-schedule-name {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.preview-timer-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
  font-family: 'Roboto Mono', monospace;
}

.preview-controls {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  justify-content: center;
}

.timer-button {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

.timer-button.paused {
  background-color: #FF5722;
}

.timer-button.active {
  background-color: #4CAF50;
}

.timer-button.loading {
  background-color: #2196F3;
  cursor: progress;
}

.timer-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.timer-button.paused:not(:disabled):hover {
  background-color: #E64A19;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.timer-button.active:not(:disabled):hover {
  background-color: #388E3C;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.fullscreen-control {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.fullscreen-button {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background-color: #FF9800;
  color: white;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fullscreen-timer-value {
  font-family: 'Beryozki', monospace;
  font-size: 20rem;
  font-feature-settings: "tnum";
  text-rendering: optimizeLegibility;
  font-weight: bold;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  line-height: 0.8;
}


.fullscreen-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.fullscreen-mode {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #121212 url('@/assets/images/background/back.jpg') no-repeat center center/cover;
  z-index: 100;
  color: white;
}

.fullscreen-mode.active {
  display: flex;
  justify-content: center;
  align-items: center;
}

.fullscreen-content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.screen-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.timer-fade-enter-active,
.timer-fade-leave-active {
  transition: all 0.5s ease;
}

.timer-fade-enter-from,
.timer-fade-leave-to {
  opacity: 0;
}

.text-fade-enter-active,
.text-fade-leave-active {
  transition: all 0.5s ease;
}

.text-fade-enter-from,
.text-fade-leave-to {
  opacity: 0;
  filter: blur(5px);
}

.loader {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 20px;
  height: 20px;
  animation: rotate 1.5s linear infinite;
}

.path {
  stroke: white;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}

.merchant-controls-compact {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 8px;
}

.compact-button {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #4a5568;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compact-button:hover {
  border-color: #cbd5e0;
  background: #f7fafc;
  transform: translateY(-1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.compact-button.active {
  font-weight: 600;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

.compact-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.all-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.third-btn.active {
  background: #ed64a6;
  color: white;
  border-color: #ed64a6;
}

.second-third-btn.active {
  background: #4c51bf;
  color: white;
  border-color: #4c51bf;
}

.top-three-btn.active {
  background: #48bb78;
  color: white;
  border-color: #48bb78;
}

.compact-button.active {
  animation: mini-pulse 0.3s ease;
}

@keyframes mini-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@media (max-width: 480px) {
  .merchant-controls-compact {
    gap: 6px;
  }


  
  .compact-button {
    padding: 4px 8px;
    font-size: 11px;
    min-width: 36px;
    height: 24px;
  }
}

/* Стили для товарооборота */
.trade-turnover-fullscreen {
  margin-top: 30px;
  width: 100%;
  max-width: 1400px;
}

.countries-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  padding: 10px;
}

.country-turnover-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 25px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  min-height: 280px;
  position: relative;
}

.country-turnover-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.5);
}

.relations-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.6);
  padding: 6px;
  border-radius: 50%;
  backdrop-filter: blur(5px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  z-index: 10;
}

.relations-badge:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.relations-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
}

.country-flag-large {
  width: 140px;
  height: 105px;
  object-fit: contain;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.turnover-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.level-name-badge {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.3), rgba(21, 101, 192, 0.3));
  border: 2px solid rgba(33, 150, 243, 0.6);
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #FFF;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.turnover-amount {
  font-size: 2.2rem;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.6),
               0 0 40px rgba(255, 215, 0, 0.3);
  letter-spacing: 1px;
  font-family: 'Beryozki', 'Roboto Mono', monospace;
}

.progress-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-track {
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 15px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 13px;
  transition: all 0.5s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.progress-text {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.3px;
}

/* Анимация появления карточек */
.country-turnover-card {
  animation: cardFadeIn 0.6s ease;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Адаптивность */
@media (max-width: 1200px) {
  .countries-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .trade-turnover-fullscreen {
    margin-top: 20px;
    max-width: 100%;
  }
  
  .countries-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .country-turnover-card {
    padding: 20px;
    min-height: auto;
  }
  
  .relations-badge {
    top: 8px;
    left: 8px;
    padding: 4px;
  }
  
  .relations-icon {
    width: 32px;
    height: 32px;
  }
  
  .country-flag-large {
    width: 100px;
    height: 75px;
  }
  
  .level-name-badge {
    font-size: 1rem;
    padding: 6px 14px;
  }
  
  .turnover-amount {
    font-size: 1.8rem;
  }
  
  .progress-track {
    height: 25px;
  }
  
  .progress-text {
    font-size: 0.9rem;
  }
}
</style>