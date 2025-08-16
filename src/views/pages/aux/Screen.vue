<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { useTimerStore } from '@/stores/timer'
import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'

// Состояния
const isFullscreen = ref(false)
const selectedScreen = ref('placeholder')
const timerStore = useTimerStore()
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

// Хуки жизненного цикла
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
  startPolling()
})

onBeforeUnmount(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
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
            { id: 'timer', label: 'Таймер' }
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
      <button class="fullscreen-button" @click="toggleFullscreen">
        <span>Вывести на экран</span>
      </button>
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
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Общие стили */
.management-mode {
  padding: 1rem;
}

/* Стили для превью экранов */
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

/* Кнопка управления таймером */
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

/* Кнопка полноэкранного режима */
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

.fullscreen-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* Полноэкранный режим */
.fullscreen-mode {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #121212;
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

.fullscreen-text-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  text-align: center;
}

.fullscreen-schedule-name {
  font-family: 'Beryozki', sans-serif;
  font-size: 12rem;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 6rem;
  line-height: 1;
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

.screen-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Анимации */
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

/* Индикатор загрузки */
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

/* Адаптивность */
@media (max-width: 768px) {
  .fullscreen-schedule-name {
    font-size: 6rem;
    margin-bottom: 3rem;
  }
  
  .fullscreen-timer-value {
    font-size: 10rem;
  }
  
  .preview-card {
    width: 220px;
  }
}

@media (max-width: 480px) {
  .fullscreen-schedule-name {
    font-size: 4rem;
    margin-bottom: 2rem;
  }
  
  .fullscreen-timer-value {
    font-size: 6rem;
  }
  
  .preview-selector {
    flex-direction: column;
    align-items: center;
  }
  
  .preview-card {
    width: 100%;
    max-width: 280px;
  }
  
  .timer-button {
    min-width: 160px;
    font-size: 13px;
    padding: 8px 16px;
  }
}
</style>