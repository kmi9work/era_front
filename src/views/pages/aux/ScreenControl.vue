<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import axios from 'axios'

import previewTimer from '@/assets/images/preview_timer.jpg'
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
      <button 
        v-for="screen in [         
          { id: 'placeholder', label: 'Заглушка', icon: previewPlaceholder },
          { id: 'timer', label: 'Таймер', icon: previewTimer }
        ]"
        :key="screen.id"
        class="preview-item"
        :class="{ active: selectedScreen === screen.id }"
        @click="changeScreen(screen.id)"
        :disabled="isTransitioning"
      >
        <img :src="screen.icon" :alt="screen.label">
        <p>{{ screen.label }}</p>
      </button>
    </div>

    <!-- Кнопка под выбором экрана -->
    <div v-if="selectedScreen === 'timer'">
   <div class="preview-controls">
  <div class="buttons-container">
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


    <transition name="fade" mode="out-in">
      <div v-if="selectedScreen" class="preview-window" :key="selectedScreen">
        <template v-if="selectedScreen === 'timer'">
          <div class="preview-timer">
            <div v-if="timerStore.isOutOfRange ">
             <p class="preview-schedule-name"> {{timerMessage }} </p>              
            </div>
            <div v-else>
            <p class="preview-schedule-name">{{ timerStore.currentScheduleItemName }}</p>
            <p class="preview-timer-value">{{ timerStore.formattedRemainingTime }}</p>
            </div>
          </div>
        </template>

        <template v-else-if="selectedScreen === 'placeholder'">
          <img class="preview-image" :src="previewPlaceholder" alt="Заглушка">
        </template>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.preview-selector {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.buttons-container {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
  flex-wrap: wrap;
}

.preview-item {
  width: 200px;
  height: 150px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.preview-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.preview-item.active {
  border-color: #42b983;
  box-shadow: 0 0 0 2px #42b983;
}

.preview-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px 6px 0 0;
}

.preview-item p {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
}

.preview-window {
  width: 100%;
  min-height: 500px;
  border: 2px solid #e1e1e1;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.preview-timer {
  text-align: center;
  padding: 2rem;
  width: 100%;
}

.preview-schedule-name {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #333;
  font-weight: 500;
}

.preview-timer-value {
  font-size: 4rem;
  font-weight: bold;
  color: #2c3e50;
  font-family: 'Roboto Mono', monospace;
}

.preview-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
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
}

.timer-button.active {
  background-color: #4CAF50;
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 992px) {
  .preview-window {
    min-height: 400px;
  }
  
  .preview-timer-value {
    font-size: 3rem;
  }
}

@media (max-width: 768px) {
  .preview-selector {
    gap: 1rem;
  }
  
  .preview-item {
    width: 160px;
    height: 120px;
  }
  
  .preview-item img {
    height: 90px;
  }
  
  .preview-schedule-name {
    font-size: 1.4rem;
  }
  
  .preview-timer-value {
    font-size: 2.5rem;
  }
}

@media (max-width: 576px) {
  .preview-container {
    padding: 1rem;
  }
  
  .preview-item {
    width: 120px;
    height: 100px;
  }
  
  .preview-item img {
    height: 70px;
  }
  
  .preview-item p {
    font-size: 0.9rem;
  }
  
  .preview-window {
    min-height: 300px;
  }
}

.timer-button {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

/* Состояние по умолчанию (пауза) */
.timer-button.paused {
  background-color: #FF5722; /* Оранжевый */
}

/* Активное состояние (таймер работает) */
.timer-button.active {
  background-color: #4CAF50; /* Зеленый */
}

/* Состояние загрузки */
.timer-button.loading {
  background-color: #2196F3; /* Синий */
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