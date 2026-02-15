<template>
    <div class="fullscreen-text-container">
      <!-- Верхняя часть: таймер или "Артель -->
      <Transition name="timer-fade" mode="out-in">
        <div :key="timerStore.isOutOfRange ? 'out-of-range' : 'active'">
          <!-- Если вне расписания - показываем "Артель" -->
          <div v-if="timerStore.isOutOfRange">
            <p class="fullscreen-timer-value">Артель</p>
          </div>
          
          <!-- Если в расписании - показываем таймер -->
          <div v-else>
            <Transition name="text-fade" mode="out-in">
              <p key="title" class="fullscreen-schedule-name">
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
      
      <!-- Товарооборот или Чек-листы в зависимости от типа расписания -->
      <div class="trade-turnover-fullscreen">
        <Transition name="text-fade" mode="out-in">
          <div key="turnovers" class="countries-grid">
            <IntelligenceData
              :intelligence-data-status="intelligenceDataStatus"
            />
          </div>
        </Transition>
      </div>
    </div>
  </template>
  
  <script setup>
import IntelligenceData from './IntelligenceData.vue'
  
defineProps({
  timerStore: {
    type: Object,
    required: true,
  },
  intelligenceDataStatus: {
    type: Object,
    required: true,
  },
})
  </script>
  
  <style scoped lang="scss">
  @import './Screen.style.scss';
  </style>
  
  