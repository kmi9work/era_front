<template>
  <div class="results-screen">
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
  }
})
</script>

<style scoped lang="scss">
@import './Screen.style.scss';
</style>

