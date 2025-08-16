<script setup>
import { ref } from 'vue'
import { useTimerStore } from '@/stores/timer'
import axios from 'axios'

import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'

const timerMessage = ref('Проверьте расписание. Либо его нет, либо циклы еще не начались, либо уже закончились')
const timerStore = useTimerStore()
const selectedScreen = ref('placeholder')
const isTransitioning = ref(false)

const changeScreen = async (screen) => {
  if (selectedScreen.value === screen || isTransitioning.value) return;

  try {
    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/toggle_screen`,
      { request: screen }
    );
    isTransitioning.value = true;
    setTimeout(() => {
      selectedScreen.value = screen;
      isTransitioning.value = false;
    }, 300);
  } catch (error) {
    console.error("Ошибка при смене экрана:", error);
  }
};
</script>

<template>
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
              <p class="preview-schedule-name">{{ timerStore.currentScheduleItemName || 'Название цикла' }}</p>
              <p class="preview-timer-value">{{ timerStore.formattedRemainingTime || '00:00:00' }}</p>
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
</template>

<style scoped>
/* Основные стили контейнера */
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Контейнер для карточек превью */
.preview-selector {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Карточка превью */
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

/* Заголовок превью */
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

/* Контент превью */
.preview-content {
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

/* Стили для превью заглушки */
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

/* Стили для превью таймера */
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

/* Кнопки управления */
.preview-controls {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  justify-content: center;
}

/* Стили для кнопки таймера */
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

/* Состояние по умолчанию (пауза) */
.timer-button.paused {
  background-color: #FF5722;
}

/* Активное состояние (таймер работает) */
.timer-button.active {
  background-color: #4CAF50;
}

/* Состояние загрузки */
.timer-button.loading {
  background-color: #2196F3;
  cursor: progress;
}

/* Состояние disabled */
.timer-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Эффекты при наведении */
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

/* Стили для индикатора загрузки */
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
</style>