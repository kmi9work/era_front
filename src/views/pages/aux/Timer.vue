<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTimerStore } from '@/stores/timer'

const timerStore = useTimerStore()
const isFullscreen = ref(false)
const timerRunning = ref(false)

const enterFullscreen = () => {
  const element = document.getElementById('fullscreen-content')
  if (!element) return
  
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  }
}

const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  }
}

// Watcher для isPaused
watch(() => timerStore.isPaused, (newValue) => {
  timerRunning.value = timerStore.isPaused
 
})


const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    exitFullscreen()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('fullscreenchange', () => {})
})
</script>

<template>
  <!-- Основной контент -->
  <div v-if="!isFullscreen">
    <VCard>
      <VCardText>
        <div class="timer-container">
          <div v-if="timerStore.isOutOfRange">
            <p class="timer-value">{{ timerStore.outOfRangeMessage }}</p>
          </div>
          <div v-else>
            <p class="schedule-name">{{ timerStore.currentScheduleItemName }}</p>
            <p class="timer-value">{{ timerStore.formattedRemainingTime }}</p>
          </div>
        </div>
        
        <button 
          @click="timerStore.toggleTimer"
          :disabled="timerStore.isLoading"
          class="timer-button"
          :class="{ 
            'active': !timerStore.isPaused,
            'loading': timerStore.isLoading
          }"
        >
          <span v-if="!timerStore.isLoading">
            {{ timerStore.isPaused ? 'Запустить таймер' : 'Остановить таймер' }}
          </span>
          <span v-else class="loader">Загрузка...</span>
        </button>

        <button @click="enterFullscreen" class="fullscreen-button">
          Полный экран
        </button>
      </VCardText>
    </VCard>
  </div>

  <!-- Полноэкранный режим -->
  <div 
    id="fullscreen-content" 
    class="fullscreen-mode" 
    :class="{ 'active': isFullscreen }"
  >
    <div class="fullscreen-timer-container">
       <div v-if="timerStore.isOutOfRange">
        <p class="fullscreen-timer-value">{{ timerStore.outOfRangeMessage }}</p>
       </div>
       <div v-else>
        <p class="fullscreen-schedule-name">{{ timerStore.currentScheduleItemName }}</p>
        <p class="fullscreen-timer-value">{{ timerStore.formattedRemainingTime }}</p>
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
  font-weight: 500;
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

/* Кнопки */
.timer-button {
  display: block;
  width: 100%;
  max-width: 240px;
  margin: 2rem auto 0;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
}

.timer-button.active {
  background: linear-gradient(135deg, #F44336 0%, #C62828 100%);
}

.fullscreen-button {
  display: block;
  width: 100%;
  max-width: 240px;
  margin: 1rem auto 0;
  padding: 12px 24px;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}


/* Адаптивность */
@media (max-width: 768px) {
  .fullscreen-schedule-name {
    font-size: 2rem;
  }
  
  .fullscreen-timer-value {
    font-size: 5rem;
  }
  
  .schedule-name {
    font-size: 1.25rem;
  }
  
  .timer-value {
    font-size: 2.5rem;
  }
}
</style>