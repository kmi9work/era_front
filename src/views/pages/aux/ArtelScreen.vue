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

      <!-- Текущее государство: цены, караваны и предприятия артели — его (ТЗ № 2, § 7.4) -->
      <p v-if="countryName" class="fullscreen-country-name">
        {{ countryName }}
      </p>
    </div>
  </template>
  
  <script setup>
import { computed, onBeforeMount, watch } from 'vue'
import { useCurrentCountry } from '@/composables/useCurrentCountry'
import { useEndGameResultsStore } from '@/stores/end_game_results.js'
import IntelligenceData from './IntelligenceData.vue'

/**
 * Полноэкранный экран «Артель» (ТЗ № 2, § 7.4).
 *
 * Экран работает в разрезе текущего государства: предприятия гильдии, цены и
 * караваны считаются на бэкенде для текущего государства, поэтому при смене
 * государства данные перечитываются, а его название подписано на экране.
 */
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

const { currentCountry, reloadToken, loadCurrentCountry } = useCurrentCountry()
const endGameResultsStore = useEndGameResultsStore()

const countryName = computed(() => currentCountry.value?.name || '')

onBeforeMount(() => {
  loadCurrentCountry()
})

// Смена государства: разведданные артели относятся к новому государству
watch(reloadToken, () => {
  endGameResultsStore.fetchScreenBundle()
})
  </script>
  
  <style scoped lang="scss">
  @import './Screen.style.scss';

  .fullscreen-country-name {
    margin-top: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
  }
  </style>
  
  