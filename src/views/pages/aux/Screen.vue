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
    <div v-if="onScreen === 0"> 
      <img class="fullscreen-image" :src="previewPlaceholder" alt="Заглушка">
    </div>
    <div v-else-if="onScreen === 1"> 
      <div class="fullscreen-timer-container">
       <div v-if="timerStore.isOutOfRange || timerStore.noScheduleInTheBase">
        <p class="fullscreen-timer-value">{{ timerStore.outOfRangeMessage }}</p>
       </div>
       <div v-else>
        <p class="fullscreen-schedule-name">{{ timerStore.currentScheduleItemName }}</p>
        <p class="fullscreen-timer-value">{{ timerStore.formattedRemainingTime }}</p>
      </div>
    </div>
  </div>
 


  </div>
</template>

<style scoped>
.preview-container {
  /* Ваши стили для обычного режима */
}

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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
}

.fullscreen-mode.active {
  display: flex;
}

.fullscreen-schedule-name {
  font-family: 'Beryozki', sans-serif;
  font-size: 12rem;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 1rem;
}

.fullscreen-timer-value {
  font-family: 'Beryozki', sans-serif;
  font-size: 25rem;
  font-weight: bold;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
  line-height: 1;
}

.fullscreen-button {
  /* Стили для кнопки */
}

.fullscreen-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
</style>