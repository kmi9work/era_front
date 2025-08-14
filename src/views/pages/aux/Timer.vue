<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useTimerStore } from '@/stores/timer'

const timerStore = useTimerStore()
const isFullscreen = ref(false)

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

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    exitFullscreen()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<template>
  <div v-if="!isFullscreen">
    <VCard>
      <VCardText>
        <div class="timer-container">
          <div v-if="timerStore.noScheduleInTheBase">
            <p class="timer-value">{{ timerStore.noScheduleInTheBaseMessage }}</p>
          </div>
          <div v-else-if="timerStore.isOutOfRange">
            <p class="timer-value">{{ timerStore.outOfRangeMessage }}</p>
          </div>
          <div v-else>
            <p class="schedule-name">{{ timerStore.currentScheduleItemName }}</p>
            <p class="timer-value">{{ timerStore.formattedRemainingTime }}</p>
          </div>
        </div>

        <div class="buttons-container">
          <!-- Кнопка управления таймером (отображается всегда) -->
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

          <!-- Кнопка создания расписания (только когда нет расписания) -->
          <button 
            v-if="timerStore.noScheduleInTheBase"
            @click="timerStore.createSchedule"
            :disabled="timerStore.isLoading"
            class="timer-button secondary"
          >
            <span>Создать расписание</span>
          </button>

          <!-- Кнопка полноэкранного режима (отображается всегда) -->
          <button 
            @click="enterFullscreen" 
            class="timer-button fullscreen-button"
          >
            <span>Полный экран</span>
          </button>
        </div>
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
      <div v-if="timerStore.isOutOfRange || timerStore.noScheduleInTheBase">
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