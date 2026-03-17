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
        <div v-if="currentScheduleType === 'play'" key="turnovers">
          <div class="countries-grid">
            <CountryTurnoverCard
              v-for="item in tradeTurnovers.filter(i => i.country_id !== 9)"
              :key="item.country_id"
              :item="item"
              :trade-levels="tradeLevels"
              :format-turnover="formatTurnover"
              :get-progress-percent="getProgressPercent"
              :get-level-name="getLevelName"
              :get-progress-color="getProgressColor"
            />
          </div>
          
          <!-- Вятка - одной строкой под всеми странами -->
          <div v-if="getVyatkaData()" class="vyatka-line">
            <div class="vyatka-content">
              <img 
                v-if="getVyatkaFlagSrc()"
                :src="getVyatkaFlagSrc()"
                class="vyatka-flag"
                alt="Вятка"
                width="67"
                height="49"
              />
              <div 
                v-else
                class="vyatka-flag flag-placeholder"
              >
                В
              </div>
              <span class="vyatka-name">Товарооборот Вятки</span>
              <span class="vyatka-turnover">{{ formatTurnover(getVyatkaTurnover()) }}</span>
              <div class="vyatka-progress">
                <div class="progress-track">
                  <div class="progress-fill" style="width: 100%; background-color: #1976d2;">
                    <div class="progress-shine"></div>
                  </div>
                </div>
                <span class="vyatka-progress-text">До следующего уровня {{ formatTurnover(getVyatkaToNextLevel()) }}</span>
              </div>
            </div>
          </div>
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

const props = defineProps({
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

// Helper functions for Vyatka
const getVyatkaData = () => {
  return props.tradeTurnovers.find(item => item.country_id === 9)
}

const getVyatkaTurnover = () => {
  const vyatka = getVyatkaData()
  return vyatka?.trade_turnover || 0
}

const getVyatkaToNextLevel = () => {
  const vyatka = getVyatkaData()
  if (vyatka && props.tradeLevels[9]) {
    return props.tradeLevels[9].to_next_level || 0
  }
  return 0
}

const getVyatkaFlagSrc = () => {
  const vyatka = getVyatkaData()
  if (vyatka?.flag_image_name) {
    return `/images/countries/${vyatka.flag_image_name}.png`
  }
  return null
}
</script>

<style scoped lang="scss">
@import './Screen.style.scss';

.vyatka-line {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.vyatka-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vyatka-flag {
  width: 67px;
  height: 49px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.flag-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(120, 120, 140, 0.5), rgba(80, 80, 100, 0.5));
  color: rgba(255, 255, 255, 1);
  font-size: 1.5rem;
  font-weight: bold;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.vyatka-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.vyatka-turnover {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  min-width: 120px;
  text-align: right;
}

.vyatka-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
}

.progress-track {
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  position: relative;
}

.progress-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.vyatka-progress-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}
</style>

