<template>
  <div class="country-turnover-card">
    <!-- Иконка отношений в верхнем правом углу -->
    <div v-if="item.relations !== undefined" class="relations-badge">
      <v-img 
        :src="`/images/relations/${item.relations}.png`"
        class="relations-icon"
        :alt="`Отношения: ${item.relations}`"
        :title="`Отношения с Русью: ${item.relations}`"
        width="40"
        height="40"
        contain
      />
    </div>
    
    <!-- Информация об уровне и товарообороте -->
    <div v-if="tradeLevels[item.country_id]" class="turnover-info">
      <!-- Флаг и название страны -->
      <div class="country-name-row">
        <div class="country-flag-small-wrapper">
          <v-img 
            v-if="countryFlagSrc"
            :src="countryFlagSrc"
            class="country-flag-small"
            :alt="item.country_name"
            width="67"
            height="49"
            contain
            style="border-radius: 6px;"
          />
          <div 
            v-else
            class="country-flag-small flag-placeholder"
            :title="item.country_name"
          >
            {{ (item.short_name || item.country_name)?.charAt(0)?.toUpperCase() || '?' }}
          </div>
        </div>
        <span class="country-name-text">{{ item.short_name || item.country_name }}</span>
      </div>
      
      <!-- Название уровня -->
      <div class="level-name-badge" :class="{ 'empty': !levelName }">
        {{ levelName }}
      </div>
      
      <div class="turnover-amount">
        {{ formatTurnover(item.trade_turnover) }}
      </div>
      
      <!-- Прогресс-бар -->
      <div class="progress-container">
        <div class="progress-track">
          <div 
            class="progress-fill"
            :style="{ 
              width: progressPercent + '%',
              backgroundColor: progressColor
            }"
          >
            <div class="progress-shine"></div>
          </div>
        </div>
        <div class="progress-text">
          До следующего уровня: {{ formatTurnover(toNextLevel) }}
        </div>
      </div>
    </div>
    
    <!-- Если данные еще не загружены -->
    <div v-else class="turnover-info">
      <!-- Флаг и название страны -->
      <div class="country-name-row">
        <div class="country-flag-small-wrapper">
          <v-img 
            v-if="countryFlagSrc"
            :src="countryFlagSrc"
            class="country-flag-small"
            :alt="item.country_name"
            width="67"
            height="49"
            contain
            style="border-radius: 6px;"
          />
          <div 
            v-else
            class="country-flag-small flag-placeholder"
            :title="item.country_name"
          >
            {{ (item.short_name || item.country_name)?.charAt(0)?.toUpperCase() || '?' }}
          </div>
        </div>
        <span class="country-name-text">{{ item.short_name || item.country_name }}</span>
      </div>
      
      <div class="turnover-amount">
        {{ formatTurnover(item.trade_turnover) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  tradeLevels: {
    type: Object,
    default: () => ({})
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
  }
})

const levelName = computed(() => {
  return props.getLevelName(props.item.country_id)
})

const progressPercent = computed(() => {
  return props.getProgressPercent(props.item.country_id, props.item.trade_turnover)
})

const progressColor = computed(() => {
  return props.getProgressColor(props.tradeLevels[props.item.country_id])
})

const toNextLevel = computed(() => {
  const level = props.tradeLevels[props.item.country_id]
  return level?.to_next_level || 0
})

const countryFlagSrc = computed(() => {
  const flagImageName = props.item.flag_image_name
  if (!flagImageName) return null
  return `/images/countries/${flagImageName}.png`
})
</script>

<style scoped lang="scss">
@import './Screen.style.scss';

// Стили для placeholder флагов
.flag-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(120, 120, 140, 0.5), rgba(80, 80, 100, 0.5));
  color: rgba(255, 255, 255, 1);
  font-size: 2.5rem;
  font-weight: bold;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>

