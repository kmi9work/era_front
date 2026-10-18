<template>
  <div class="results-screen">
    <!-- Год и источник результатов: текущий год — живой расчёт, прошедшие — снимок года -->
    <div v-if="resultsYear || sourceLabel" class="results-meta">
      <span v-if="resultsYear" class="results-meta-year">Итоги года {{ resultsYear }}</span>
      <span v-if="resultsYear && sourceLabel" class="results-meta-sep">•</span>
      <span v-if="sourceLabel" class="results-meta-source">{{ sourceLabel }}</span>
    </div>

    <!-- Заглушка -->
    <div v-if="activeScreen === 'noblePlaceholder'" class="all-results-container">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты знати</div>
      </div>
    </div>

    <!-- Текстовые заголовки мест -->
    <div v-else-if="activeScreen === 'thirdPlaceNoble'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Третье место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondPlaceNoble'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Второе место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstPlaceNoble'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Первое место</div> 
      </div>
    </div>

    <!-- Детальные результаты по местам (числовые) -->
    <div v-else-if="activeScreen === 'thirdNoble'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(noble, index) in nobleResults" 
            :key="index" 
            class="winner-line"
          >
            <span class="winner-name">{{ noble.noble_name }}</span>
            <span class="winner-stats">
              <span class="highlight-gold">{{ noble.noble_influence || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondNoble'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(noble, index) in nobleResults" 
            :key="index" 
            class="winner-line"
          >
            <span class="winner-name">{{ noble.noble_name }}</span>
            <span class="winner-stats">
              <span class="highlight-gold">{{ noble.noble_influence || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstNoble'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(noble, index) in nobleResults" 
            :key="index" 
            class="winner-line"
          >
            <span class="winner-name">{{ noble.noble_name }}</span>
            <span class="winner-stats">
              <span class="highlight-gold">{{ noble.noble_influence || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Все результаты -->
    <div v-else-if="activeScreen === 'allNoble'" class="all-results-container">
      <div class="fullscreen-text-container">
        <div class="noble-grid-layout">
          <div 
            v-for="(noble, index) in nobleResults"  
            :key="index" 
            class="noble-card"
            :class="'place-' + noble.place" 
          >
            <div class="noble-header">
              <span class="place-badge">{{ noble.place }}</span>
              <span class="noble-name">{{ noble.noble_name }}</span>
            </div>
            <div class="noble-stats">
              <div class="stat-item">
                <span class="stat-value">{{ noble.noble_influence || 0 }}</span>
                <span class="stat-label">Влияние</span>
              </div>
              <div class="stat-icon">⚜️</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fallback если ничего не подошло -->
    <div v-else class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты знати</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeScreen: {
    type: String,
    required: true
  },
  nobleResults: {
    type: Array,
    required: true
  },
  // Год результатов и признак источника (живой расчёт / снимок года)
  resultsYear: {
    type: [Number, String],
    default: null
  },
  sourceLabel: {
    type: String,
    default: ''
  }
})
</script>

<style scoped lang="scss">
@import './Screen.style.scss';

/* Год результатов и признак источника (живой расчёт / снимок года) */
.results-screen {
  position: relative;
}

.results-meta {
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.results-meta-source {
  opacity: 0.85;
  text-transform: lowercase;
}
</style>

