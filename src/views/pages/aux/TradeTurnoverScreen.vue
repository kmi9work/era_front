<template>
  <div class="fullscreen-text-container">
    <!-- Верхняя часть: таймер или "Эпоха перемен" -->
    <Transition name="timer-fade" mode="out-in">
      <div :key="timerStore.isOutOfRange ? 'out-of-range' : 'active'">
        <!-- Если вне расписания - показываем "Эпоха перемен" -->
        <div v-if="timerStore.isOutOfRange">
          <p class="fullscreen-timer-value">{{ timerStore.outOfRangeMessage }}</p>
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
        <!-- Режим PLAY - показываем товарооборот -->
        <div v-if="currentScheduleType === 'play'" key="turnovers" class="countries-grid">
          <CountryTurnoverCard
            v-for="item in tradeTurnovers"
            :key="item.country_id"
            :item="item"
            :trade-levels="tradeLevels"
            :format-turnover="formatTurnover"
            :get-progress-percent="getProgressPercent"
            :get-level-name="getLevelName"
            :get-progress-color="getProgressColor"
          />
        </div>
        
        <!-- Режим PAUSE - показываем чек-листы -->
        <div v-else key="checklists" class="countries-grid">
          <ChecklistCard
            v-for="checklist in checklists"
            :key="checklist.id"
            :checklist="checklist"
            :get-checklist-progress-color="getChecklistProgressColor"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import CountryTurnoverCard from './CountryTurnoverCard.vue'
import ChecklistCard from './ChecklistCard.vue'

defineProps({
  tradeTurnovers: {
    type: Array,
    required: true
  },
  checklists: {
    type: Array,
    required: true
  },
  tradeLevels: {
    type: Object,
    required: true
  },
  timerStore: {
    type: Object,
    required: true
  },
  currentScheduleType: {
    type: String,
    required: true
  },
  formatTurnover: {
    type: Function,
    required: true
  },
  getProgressPercent: {
    type: Function,
    required: true
  },
  getLevelName: {
    type: Function,
    required: true
  },
  getProgressColor: {
    type: Function,
    required: true
  },
  getChecklistProgressColor: {
    type: Function,
    required: true
  }
})
</script>

<style scoped lang="scss">
@import './Screen.style.scss';
</style>

