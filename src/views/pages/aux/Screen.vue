<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { useTimerStore } from '@/stores/timer'
import { useMerchantResultsStore } from '@/stores/merchant_results'
import { storeToRefs } from 'pinia'

import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'
import previewMerchResults from '@/assets/images/preview_merch_results.jpg'

// Состояния
const isFullscreen = ref(false)
const selectedScreen = ref('placeholder')
const timerStore = useTimerStore()
const merchantStore = useMerchantResultsStore()
const { showResultsLevel, isLoading: merchantsLoading, errorMessage: merchantsError } = storeToRefs(merchantStore)
const isTransitioning = ref(false)
const timerMessage = ref('Проверьте расписание. Либо его нет, либо циклы еще не начались, либо уже закончились')
const pollInterval = ref(null)


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

const merchants = computed(() => {
  return merchantStore.merchantsList
})


const currentMerchPlace = ref(0)

// Синхронизация с store
watch(() => merchantStore.currentMerchantsResultsScreen, (newScreen) => {
  currentMerchPlace.value = newScreen
})

const results = computed(() => {
  if (currentMerchPlace.value === 0) {
    return merchantStore.merchantsList
  } else {
    return merchantStore.merchantsList.filter(
      (merchant) => merchant.place === currentMerchPlace.value
    )
  }
})

const filterMerchResults = async (pl) => {
  currentMerchPlace.value = pl
  await changeMerchResScreen(pl) // Ждем завершения запроса
}




// const results = ref([])
// const currentMerchPlace = ref(0)

// const filterMerchResults = (pl) => {
//   currentMerchPlace.value = pl
//   if (pl === 0) {
//     results.value  =  merchantStore.merchantsList
//   }else{
//     results.value  =  merchantStore.merchantsList.filter(merchant => merchant.place === pl)
//   }
// }

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
  pollInterval.value = setInterval(loadScreen, 5000)
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

const changeMerchResScreen = async (merch_screen) => {
  try {
    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/change_curr_merch_res_screen`,
      { request: merch_screen }
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
  merchantStore.startPolling()
  filterMerchResults(0)
  
  // Если нужно сразу загрузить данные
  merchantStore.fetchMerchantResults().catch(error => {
    console.error('Ошибка загрузки merchants:', error)
  })
})

onBeforeUnmount(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
  
  merchantStore.stopPolling()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('fullscreenchange', () => {})
})
</script>

<template>

{{results}}

  <!-- Режим управления (не полноэкранный) -->
  <div v-if="!isFullscreen" class="management-mode">
    <div class="preview-container">
      <div class="preview-selector">
        <div 
          v-for="screen in [         
            { id: 'placeholder', label: 'Заглушка' },
            { id: 'timer', label: 'Таймер' },
            { id: 'merchant_results', label: 'Результаты купцов' }
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

            <div v-else-if="screen.id === 'merchant_results'" class="results-preview">
              <div class="preview-message">
     
              </div>

              <div class="merchant-controls-compact">
                <button 
                  @click="() => { filterMerchResults(0); changeMerchResScreen(0); }"
                  :class="{ active: currentMerchPlace === 0 }"
                  class="compact-button all-btn"
                  :disabled="merchantStore.isLoading"
                  title="Показать все результаты"
                >
                  Все
                </button>
                
                <button 
                  @click="() => { filterMerchResults(3); changeMerchResScreen(3); }"
                  :class="{ active: currentMerchPlace === 3 }"
                  class="compact-button third-btn"
                  :disabled="merchantStore.isLoading"
                  title="Только третье место"
                >
                  3
                </button>
                
                <button 
                  @click="() => { filterMerchResults(2); changeMerchResScreen(2); }"
                  :class="{ active: currentMerchPlace === 2 }"
                  class="compact-button second-third-btn"
                  :disabled="merchantStore.isLoading"
                  title="Второе и третье места"
                >
                  2
                </button>
                
                <button 
                  @click="() => { filterMerchResults(1); changeMerchResScreen(1); }"
                  :class="{ active: currentMerchPlace === 1 }"
                  class="compact-button top-three-btn"
                  :disabled="merchantStore.isLoading"
                  title="Топ 3 места"
                >
                  1
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

        <template v-else-if="selectedScreen === 'merchant_results'">
          <div class="results-screen">
            <!-- Все места -->
            <div v-if="merchantStore.currentMerchantsResultsScreen === 0" class="all-results-container">
              <div class="fullscreen-text-container">
                <h1 class="fullscreen-results">Результаты купцов</h1>
                <div class="results-list">
                  <div 
                    v-for="(team, index) in results" 
                    :key="team.player_id || index" 
                    class="result-line"
                    :class="'place-' + team.place"
                  >
                    <span class="place-number">{{ team.place }}.</span>
                    <span class="team-name">{{ team.player }}</span>
                    <span class="team-capital">{{ team.capital.toLocaleString() }}💰</span>
                    <span class="team-players">{{ team.number_of_players }}👥</span>
                    <span class="team-capital"> {{ (team.cap_per_pl || 0).toLocaleString() }}💰</span>
                    <span class="team-favor">{{ team.boyar_favor || 0 }}⚜️</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Отдельные места -->
            <div v-else class="single-place-fullscreen">
              <div class="fullscreen-text-container">
                <!-- Третье место -->
                <div v-if="merchantStore.currentMerchantsResultsScreen === 3" class="place-section bronze">
                  <div class="fullscreen-place-title"> Третье место</div>
                  <div class="winner-list">
                    <div 
                      v-for="(team, index) in results" 
                      :key="team.player_id || index" 
                      class="winner-line"
                    >
                      <span class="winner-name">{{ team.player }}</span>
                      <span class="winner-stats">
                        {{ team.capital.toLocaleString() }}💰 • 
                        {{ (team.cap_per_pl || 0).toLocaleString() }} •
                        {{ team.number_of_players }}👥 • 
                        {{ team.boyar_favor || 0 }}⚜️

                      </span>
                    </div>
                  </div>
                </div>

                <!-- Второе место -->
                <div v-else-if="merchantStore.currentMerchantsResultsScreen === 2" class="place-section silver">
                  <div class="fullscreen-place-title"> Второе место</div>
                  <div class="winner-list">
                    <div 
                      v-for="(team, index) in results" 
                      :key="team.player_id || index" 
                      class="winner-line"
                    >
                      <span class="winner-name">{{ team.player }}</span>
                      <span class="winner-stats">
                        {{ team.capital.toLocaleString() }}💰 • 
                        {{ team.number_of_players }}👥 • 
                        {{ (team.cap_per_pl || 0).toLocaleString() }} •
                        {{ team.boyar_favor || 0 }}⚜️
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Первое место -->
                <div v-else-if="merchantStore.currentMerchantsResultsScreen === 1" class="place-section gold">
                  <div class="fullscreen-place-title"> Первое место</div>

                  <div class="winner-list">
                    <div 
                      v-for="(team, index) in results" 
                      :key="team.player_id || index" 
                      class="winner-line"
                    >
                      <span class="winner-name">{{ team.player }}</span>
                      <span class="winner-stats">
                        {{ team.capital.toLocaleString() }}💰 • 
                        {{ team.number_of_players }}👥 • 
                        {{ (team.cap_per_pl || 0).toLocaleString() }} •
                        {{ team.boyar_favor || 0 }}⚜️
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
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
  margin-bottom: 2rem;
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
  font-size: 8rem;
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
</style>