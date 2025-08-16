<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'
import { useTimerStore } from '@/stores/timer'

// Состояния
const isFullscreen = ref(false)
const timerRunning = ref(false)
const selectedScreen = ref('placeholder')
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
    selectedScreen.value = response.data
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
  timerRunning.value = !newValue
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
  <!-- Обычный режим - только кнопка -->
  <div v-if="!isFullscreen" class="preview-container">
    <VCard>
    <button class="fullscreen-button" @click="toggleFullscreen">
      <span>Вывести на экран</span>
    </button>
  </VCard>
  </div>

 <div id="fullscreen-content" :class="['fullscreen-mode', { active: isFullscreen }]">
    <Transition name="fade" mode="out-in">
      <div class="fullscreen-content-wrapper" :key="selectedScreen">
        <template v-if="selectedScreen === 'placeholder'">
          <Transition name="slide-fade">
            <div class="screen-content"> 
              <img class="fullscreen-image" :src="previewPlaceholder" alt="Заглушка">
            </div>
          </Transition>
        </template>
        
        <template v-else-if="selectedScreen === 'timer'">
          <Transition name="slide-fade">
            <div class="fullscreen-text-container"> 
              <div v-if="timerStore.isOutOfRange">
                <p class="fullscreen-timer-value">{{ timerStore.outOfRangeMessage }}</p>
              </div>
              <div v-else class="fullscreen-text-content">
                <p class="fullscreen-schedule-name">{{ timerStore.currentScheduleItemName }}</p>
                <p class="fullscreen-timer-value">{{ timerStore.formattedRemainingTime }}</p>
              </div>
            </div>
          </Transition>
        </template>
      </div>
    </Transition>
  </div>

</template>

<style scoped>
/* Общие стили для контейнера */


.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10vh;
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

/* Адаптивность */
@media (max-width: 768px) {
  .fullscreen-schedule-name {
    font-size: 8rem;
  }
  
  .fullscreen-timer-value {
    font-size: 15rem;
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

/* Анимации */
.fade-enter-active,
.fade-leave-active,
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Для плавного перехода в полноэкранный режим */
.fullscreen-mode {
  transition: opacity 0.3s ease;
}

.screen-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>