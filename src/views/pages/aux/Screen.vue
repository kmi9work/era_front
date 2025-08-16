<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'
import { useTimerStore } from '@/stores/timer'



// Состояния
const isFullscreen = ref(false)
const timerRunning = ref(false)
const onScreen = ref(0)
const pollInterval = ref(null)
const pollTime = 5000 // 5 секунд - интервал опроса сервера
const timerStore = useTimerStore()


import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'
import previewTimer from '@/assets/images/preview_timer.jpg'

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
    onScreen.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  }
}

// Запуск периодической проверки
const startPolling = () => {
  loadScreen()
  pollInterval.value = setInterval(loadScreen, pollTime)
}

// Наблюдатель за состоянием таймера
watch(() => timerStore.isPaused, (newValue) => {
  timerRunning.value = !newValue // Исправлено: isPaused -> timerRunning
})

// Хуки жизненного цикла
onMounted(() => {
  startPolling()
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
  }
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('fullscreenchange', () => {})
})
</script>

<template>
  <!-- Обычный режим -->
  <div v-if="!isFullscreen" class="preview-container">
    <button class="fullscreen-button" @click="toggleFullscreen">
      <span>Полный экран</span>
    </button>

    <div>
      <VCard>
        {{ onScreen }}
      </VCard>
    </div>
  </div>

  <!-- Полноэкранный режим -->
  <div id="fullscreen-content" :class="['fullscreen-mode', { active: isFullscreen }]">
    <div class="fullscreen-content-wrapper">
      <div v-if="onScreen === 0"> 
        <img class="fullscreen-image" :src="previewPlaceholder" alt="Заглушка">
      </div>

      <div v-else-if="onScreen === 1" class="fullscreen-text-container"> 
        <div v-if="timerStore.isOutOfRange">
          <p class="fullscreen-timer-value">{{ timerStore.outOfRangeMessage }}</p>
        </div>
        <div v-else class="fullscreen-text-content">
          <p class="fullscreen-schedule-name">{{ timerStore.currentScheduleItemName }}</p>
          <p class="fullscreen-timer-value">{{ timerStore.formattedRemainingTime }}</p>
        </div>
      </div> 

    </div>
  </div>


</template>

<style scoped>
/* Общие стили для контейнера */
.timer-container,
.fullscreen-timer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
}

/* Стили для обычного режима */
.schedule-name {
  font-size: 1.5rem;
  font-weight: 500;
  color: inherit;
}

.timer-value {
  font-size: 3rem;
  font-weight: bold;
}

/* Стили для полноэкранного режима */
.fullscreen-mode {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #121212 url('@/assets/images/background/back.jpg') no-repeat center center;
  background-size: cover;
  z-index: 1000;
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
  width: 100%;
  height: 100%;
}

.fullscreen-text-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.fullscreen-schedule-name {
  font-family: 'Beryozki', sans-serif;
  font-size: 20rem;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 1);
  margin-bottom: 1rem;
  text-align: center;
}

.fullscreen-timer-value {
  font-family: 'Beryozki', sans-serif;
  font-size: 35rem;
  font-weight: bold;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
  line-height: 1;
  text-align: center;
}

/* Остальные стили остаются без изменений */
.buttons-container {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
  flex-wrap: wrap;
}

.timer-button {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.timer-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.timer-button.active {
  background-color: #4CAF50;
  color: white;
}

.timer-button:not(.active):not(.secondary):not(.fullscreen-button) {
  background-color: #f44336;
  color: white;
}

.timer-button.secondary {
  background-color: #2196F3;
  color: white;
}

.timer-button.fullscreen-button {
  background-color: #FF9800;
  color: white;
}

.timer-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.loader {
  display: inline-flex;
  align-items: center;
}

/* Адаптивность */
@media (max-width: 768px) {
  .fullscreen-schedule-name {
    font-size: 8rem;
  }
  
  .fullscreen-timer-value {
    font-size: 15rem;
  }
  
  .schedule-name {
    font-size: 1.25rem;
  }
  
  .timer-value {
    font-size: 2.5rem;
  }

  .buttons-container {
    flex-direction: column;
    align-items: center;
  }

  .timer-button {
    width: 100%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .fullscreen-schedule-name {
    font-size: 4rem;
  }
  
  .fullscreen-timer-value {
    font-size: 8rem;
  }
}
</style>