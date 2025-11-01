<script setup>
import { computed, onMounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useEndGameResultsStore } from '@/stores/end_game_results.js'
import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'

// Composables
import { useTradeTurnover } from '@/composables/useTradeTurnover.js'
import { useChecklists } from '@/composables/useChecklists.js'
import { useFullscreen } from '@/composables/useFullscreen.js'
import { useScreenManagement } from '@/composables/useScreenManagement.js'
import { useResultsFiltering } from '@/composables/useResultsFiltering.js'

// Components
import ScreenManagement from './ScreenManagement.vue'
import TimerScreen from './TimerScreen.vue'
import TradeTurnoverScreen from './TradeTurnoverScreen.vue'
import MerchantResultsScreen from './MerchantResultsScreen.vue'
import NobleResultsScreen from './NobleResultsScreen.vue'

// Stores
const timerStore = useTimerStore()
const endGameResultsStore = useEndGameResultsStore()

// Composables
const { isFullscreen, toggleFullscreen } = useFullscreen()

const {
  tradeTurnovers,
  tradeLevels,
  formatTurnover,
  getProgressPercent,
  getLevelName,
  getProgressColor,
  fetchTradeTurnovers,
  fetchTradeLevels
} = useTradeTurnover()

const {
  checklists,
  getChecklistProgressColor,
  fetchChecklists
} = useChecklists()

// Функция для polling товарооборотов и чек-листов
const pollingCallback = () => {
  fetchTradeTurnovers()
  fetchChecklists()
}

const {
  selectedScreen,
  timerMessage,
  changeScreen,
  startPolling
} = useScreenManagement(pollingCallback)

const {
  activeScreen,
  merchResults,
  nobleResults,
  filterMerchResults,
  filterNobleResults,
  toggleResultsDisplay
} = useResultsFiltering()

// Вычисляем текущий тип расписания (play/pause)
const currentScheduleType = computed(() => {
  return timerStore.activeItem?.type || 'play'
})

// Обработчик фильтрации результатов
const handleFilterResults = async (filter) => {
  if (typeof filter === 'string') {
    // Простая строка - только переключение экрана
    await toggleResultsDisplay(filter)
  } else if (filter && typeof filter === 'object') {
    // Объект с screen и place
    if (filter.screen.startsWith('merch')) {
      await filterMerchResults(filter.screen, filter.place)
    } else if (filter.screen.startsWith('noble')) {
      await filterNobleResults(filter.screen, filter.place)
    } else {
      await toggleResultsDisplay(filter.screen)
    }
  }
}

// Обработчик переключения таймера
const handleToggleTimer = () => {
  timerStore.toggleTimer()
}

onMounted(() => {
  startPolling()
  
  // Запускаем пулинг объединённого запроса результатов
  endGameResultsStore.startPolling()
  filterMerchResults('merchPlaceholder', 0)
})
</script>

<template>
  <!-- Режим управления (не полноэкранный) -->
  <ScreenManagement
    v-if="!isFullscreen"
    :selected-screen="selectedScreen"
    :active-screen="activeScreen"
    :timer-store="timerStore"
    :end-game-results-store="endGameResultsStore"
    :timer-message="timerMessage"
    @change-screen="changeScreen"
    @toggle-fullscreen="toggleFullscreen"
    @toggle-timer="handleToggleTimer"
    @filter-results="handleFilterResults"
  />

  <!-- Полноэкранный режим -->
  <div id="fullscreen-content" :class="['fullscreen-mode', { active: isFullscreen }]">
    <Transition name="fade" mode="out-in">
      <div class="fullscreen-content-wrapper" :key="selectedScreen">
        <!-- Заглушка -->
        <template v-if="selectedScreen === 'placeholder'">
          <div class="screen-content"> 
            <img class="fullscreen-image" :src="previewPlaceholder" alt="Заглушка">
          </div>
        </template>
        
        <!-- Таймер -->
        <template v-else-if="selectedScreen === 'timer'">
          <TimerScreen :timer-store="timerStore" />
        </template>

        <!-- Товарооборот -->
        <template v-else-if="selectedScreen === 'trade_turnover'">
          <TradeTurnoverScreen
            :trade-turnovers="tradeTurnovers"
            :checklists="checklists"
            :trade-levels="tradeLevels"
            :timer-store="timerStore"
            :current-schedule-type="currentScheduleType"
            :format-turnover="formatTurnover"
            :get-progress-percent="getProgressPercent"
            :get-level-name="getLevelName"
            :get-progress-color="getProgressColor"
            :get-checklist-progress-color="getChecklistProgressColor"
          />
        </template>

        <!-- Результаты купцов -->
        <template v-else-if="selectedScreen === 'merchant_results'">
          <MerchantResultsScreen
            :active-screen="activeScreen"
            :merch-results="merchResults"
          />
        </template>

        <!-- Результаты знати -->
        <template v-else-if="selectedScreen === 'noble_results'">
          <NobleResultsScreen
            :active-screen="activeScreen"
            :noble-results="nobleResults"
          />
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
@import './Screen.style.scss';
</style>
