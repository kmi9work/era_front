<template>
  <div class="timer-preview">
    <div v-if="timerStore.isOutOfRange" class="preview-message">
      {{ timerMessage }}
    </div>
    <div v-else>
      <p class="preview-schedule-name">{{ timerStore.currentScheduleItemName }}</p>
      <div class="preview-timer-digits">
        <span 
          v-for="(digit, index) in timerDigits" 
          :key="index" 
          class="preview-digit"
        >
          {{ digit }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'

const timerStore = useTimerStore()
const timerMessage = 'Проверьте расписание. Либо его нет, либо циклы еще не начались, либо уже закончились'

// Разбиваем время на отдельные символы для фиксированной ширины
const timerDigits = computed(() => {
  return timerStore.formattedRemainingTime.split('')
})
</script>

<style scoped>
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

.preview-timer-digits {
  display: flex;
  gap: 0.1rem;
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
  font-family: 'Roboto Mono', monospace;
}

.preview-digit {
  display: inline-block;
  width: 1.2em; /* Фиксированная ширина для каждой цифры */
  text-align: center;
}
</style>
