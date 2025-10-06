<template>
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
          <div key="timer" class="timer-container">
            <DigitTimer :time-string="timerStore.formattedRemainingTime" />
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useTimerStore } from '@/stores/timer'
import DigitTimer from './DigitTimer.vue'

const timerStore = useTimerStore()
</script>

<style scoped>
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
  font-size: 6rem;
  font-weight: bold;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
  margin-bottom: 2rem;
  line-height: 1;
}

.timer-container {
  display: flex;
  justify-content: center;
  align-items: center;
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

/* Адаптивность */
@media (max-width: 768px) {
  .fullscreen-schedule-name {
    font-size: 3rem;
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .fullscreen-schedule-name {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
}
</style>
