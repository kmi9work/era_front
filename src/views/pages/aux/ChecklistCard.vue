<template>
  <div 
    class="country-turnover-card"
    :class="{ 'vassalage-established': checklist.vassalage_established }"
  >
    <!-- Иконка отношений в правом верхнем углу -->
    <div v-if="checklist.relations !== undefined" class="relations-badge">
      <img 
        :src="relationsIconSrc"
        class="relations-icon"
        :alt="`Отношения: ${checklist.relations}`"
        :title="`Отношения с Русью: ${checklist.relations}`"
        @error="handleRelationsError"
        @load="handleRelationsLoad"
      />
    </div>
    
    <!-- Информация о чек-листе -->
    <div class="turnover-info">
      <!-- Флаг и название страны -->
      <div class="country-name-row">
        <div class="country-flag-small-wrapper">
          <img 
            v-if="!showPlaceholder && !imageErrors.has(checklist.vassal_country?.id)"
            :src="countryFlagSrc"
            class="country-flag-small"
            :alt="checklist.vassal_country.name"
            @error="handleImageError"
            @load="handleImageLoad"
          />
          <div 
            v-else
            class="country-flag-small flag-placeholder"
            :title="checklist.vassal_country.name"
          >
            {{ getPlaceholderLetter() }}
          </div>
        </div>
        <span class="country-name-text">{{ checklist.vassal_country.short_name || checklist.vassal_country.name }}</span>
      </div>
      
      <!-- Статистика чек-листа -->
      <div class="checklist-stats">
        <div class="stats-row">
          <span class="stats-label">Выполнено:</span>
          <span class="stats-value completed">{{ checklist.completed_count || 0 }}</span>
        </div>
        <div class="stats-row">
          <span class="stats-label">Не выполнено:</span>
          <span class="stats-value not-completed">{{ (checklist.total_count || 0) - (checklist.completed_count || 0) }}</span>
        </div>
      </div>
      
      <!-- Прогресс-бар выполнения чек-листа -->
      <div class="progress-container">
        <div class="progress-track">
          <div 
            class="progress-fill"
            :style="{ 
              width: completionPercentage + '%',
              backgroundColor: progressColor
            }"
          >
            <div class="progress-shine"></div>
          </div>
        </div>
        <div class="progress-text">
          {{ completionPercentage }}% выполнено
        </div>
      </div>
      
      <!-- Индикатор вассалитета -->
      <div v-if="checklist.vassalage_established" class="vassalage-badge">
        ✓ Вассалитет установлен
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  checklist: {
    type: Object,
    required: true
  },
  getChecklistProgressColor: {
    type: Function,
    required: true
  }
})

const completionPercentage = computed(() => {
  return props.checklist.completion_percentage || 0
})

const progressColor = computed(() => {
  if (props.checklist.vassalage_established) {
    return '#4CAF50'
  }
  return props.getChecklistProgressColor(completionPercentage.value)
})

const countryFlagSrc = computed(() => {
  const flagImageName = props.checklist.vassal_country?.flag_image_name
  if (!flagImageName) return null
  
  // Используем flag_image_name из базы данных (латиница, без пробелов)
  return `/images/countries/${flagImageName}.png`
})

const showPlaceholder = computed(() => {
  return !countryFlagSrc.value
})

const relationsIconSrc = computed(() => {
  const relations = props.checklist.relations
  if (relations === undefined || relations === null) return ''
  return `/images/relations/${relations}.png`
})

const imageErrors = ref(new Set())

const handleImageError = (event) => {
  const countryId = props.checklist.vassal_country?.id
  if (countryId) {
    imageErrors.value.add(countryId)
  }
  console.warn('Flag image not found:', countryFlagSrc.value)
  console.warn('Country name:', props.checklist.vassal_country?.name)
}

const handleImageLoad = (event) => {
  console.log('Flag image loaded successfully:', countryFlagSrc.value)
}

const handleRelationsError = (event) => {
  console.error('Failed to load relations icon:', relationsIconSrc.value)
  console.error('Relations:', props.checklist.relations)
  console.error('Event target:', event.target)
}

const handleRelationsLoad = (event) => {
  console.log('Relations icon loaded successfully:', relationsIconSrc.value)
}

const getPlaceholderLetter = () => {
  const name = props.checklist.vassal_country?.short_name || props.checklist.vassal_country?.name
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}
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

