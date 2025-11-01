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
          <p key="timer" class="fullscreen-timer-value">
            {{ timerStore.formattedRemainingTime }}
          </p>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  timerStore: {
    type: Object,
    required: true
  }
})
</script>

<style scoped lang="scss">
@import './Screen.style.scss';
</style>

