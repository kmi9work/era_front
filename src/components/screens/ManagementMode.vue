<template>
  <div class="management-mode">
    <div class="preview-container">
      <div class="preview-selector">
        <div 
          v-for="screen in screens"
          :key="screen.id"
          class="preview-card"
          :class="{ active: selectedScreen === screen.id }"
          @click="changeScreen(screen.id)"
        >
          <div class="preview-title">
            <strong>{{ screen.label }}</strong>
          </div>
          
          <div class="preview-content">
            <component :is="screen.previewComponent" />
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
      <button class="fullscreen-button" @click="$emit('toggle-fullscreen')">
        <span>Вывести на экран</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useEndGameResultsStore } from '@/stores/end_game_results.js'
import PlaceholderPreview from './previews/PlaceholderPreview.vue'
import TimerPreview from './previews/TimerPreview.vue'
import MerchantResultsPreview from './previews/MerchantResultsPreview.vue'
import NobleResultsPreview from './previews/NobleResultsPreview.vue'

const props = defineProps({
  selectedScreen: {
    type: String,
    required: true
  },
  activeScreen: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['change-screen', 'toggle-fullscreen'])

const timerStore = useTimerStore()
const endGameResultsStore = useEndGameResultsStore()

const screens = computed(() => [
  { 
    id: 'placeholder', 
    label: 'Заглушка',
    previewComponent: PlaceholderPreview
  },
  { 
    id: 'timer', 
    label: 'Таймер',
    previewComponent: TimerPreview
  },
  { 
    id: 'merchant_results', 
    label: 'Результаты купцов',
    previewComponent: MerchantResultsPreview
  },
  { 
    id: 'noble_results', 
    label: 'Результаты знати',
    previewComponent: NobleResultsPreview
  }
])

const changeScreen = (screenId) => {
  emit('change-screen', screenId)
}
</script>

<style scoped>
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

.fullscreen-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
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
</style>
