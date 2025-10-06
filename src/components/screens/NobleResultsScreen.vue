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
import { computed } from 'vue'
import { useEndGameResultsStore } from '@/stores/end_game_results.js'

const props = defineProps({
  activeScreen: {
    type: String,
    required: true
  },
  currentPlace: {
    type: Number,
    default: 0
  }
})

const endGameResultsStore = useEndGameResultsStore()

const nobleResults = computed(() => {
  if (props.currentPlace === 0) {
    return endGameResultsStore.nobleInfList
  } else {
    return endGameResultsStore.nobleInfList.filter(
      (noble) => noble.place === props.currentPlace
    )
  }
})
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

.fullscreen-place-title {
  font-family: 'Beryozki', sans-serif;
  font-size: 20rem;
  font-weight: bold;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
  margin-bottom: 1rem;
  line-height: 1;
}

.winner-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.winner-line {
  font-family: 'Beryozki', monospace;
  font-size: 4rem;
  font-feature-settings: "tnum";
  text-rendering: optimizeLegibility;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.winner-name {
  font-size: 5rem;
  font-weight: bold;
  margin-bottom: 0.1rem;
}

.winner-stats {
  font-size: 5rem;
  opacity: 0.7;
  margin-top: 0.3rem
}

.highlight-gold {
  color: #FFD700;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  animation: gold-pulse 2s ease-in-out infinite;
}

@keyframes gold-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; text-shadow: 0 0 15px rgba(255, 215, 0, 0.8); }
}

/* Цвета для призовых мест */
.gold .fullscreen-place-title {
  color: #FFD700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.silver .fullscreen-place-title {
  color: #C0C0C0;
  text-shadow: 0 0 20px rgba(192, 192, 192, 0.5);
}

.bronze .fullscreen-place-title {
  color: #CD7F32;
  text-shadow: 0 0 20px rgba(205, 127, 50, 0.5);
}

/* Анимации */
.place-section {
  animation: text-fade-enter 0.5s ease;
}

@keyframes text-fade-enter {
  from {
    opacity: 0;
    filter: blur(10px);
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}

.winner-line {
  animation: slide-up 0.6s ease;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Сетка для всех результатов */
.noble-grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  max-width: 95%;
  margin: 0 auto;
  padding: 2rem;
}

.noble-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  animation: cardAppear 0.6s ease;
}

.noble-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}

.noble-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.place-badge {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  font-family: 'Beryozki', sans-serif;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Цвета для мест */
.place-1 .place-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.place-2 .place-badge {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
  color: #000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.place-3 .place-badge {
  background: linear-gradient(135deg, #CD7F32, #B06A26);
  color: #000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.place-4 .place-badge,
.place-5 .place-badge,
.place-6 .place-badge {
  background: linear-gradient(135deg, #2C3E50, #34495E);
  color: #ECF0F1;
}

.noble-name {
  font-family: 'Beryozki', sans-serif;
  font-size: 5rem;
  font-weight: bold;
  color: #FFF;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  flex: 1;
}

.noble-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-family: 'Beryozki', monospace;
  font-size: 3rem;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  line-height: 1;
}

.stat-label {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-icon {
  font-size: 3rem;
  opacity: 0.8;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* Анимации */
@keyframes cardAppear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.noble-card:nth-child(odd) {
  animation-delay: 0.1s;
}

.noble-card:nth-child(even) {
  animation-delay: 0.2s;
}

/* Дополнительные эффекты для призовых мест */
.place-1 {
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.2);
}

.place-2 {
  border: 2px solid rgba(192, 192, 192, 0.3);
  box-shadow: 0 8px 32px rgba(192, 192, 192, 0.2);
}

.place-3 {
  border: 2px solid rgba(205, 127, 50, 0.3);
  box-shadow: 0 8px 32px rgba(205, 127, 50, 0.2);
}

/* Адаптивность */
@media (max-width: 1024px) {
  .noble-grid-layout {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .fullscreen-place-title {
    font-size: 5rem;
    margin-bottom: 0.5rem;
  }
  
  .winner-line {
    font-size: 2.5rem;
    gap: 0.3rem;
  }
  
  .winner-name {
    font-size: 3rem;
    margin-bottom: 0.3rem;
  }
  
  .winner-stats {
    font-size: 1.8rem;
  }
  
  .winner-list {
    gap: 1rem;
  }
  
  .noble-grid-layout {
    grid-template-columns: 1fr;
    max-width: 100%;
    padding: 1rem;
    gap: 1rem;
  }
  
  .noble-card {
    padding: 1.5rem;
  }
  
  .noble-header {
    gap: 1rem;
  }
  
  .place-badge {
    width: 40px;
    height: 40px;
    font-size: 1.4rem;
  }
  
  .noble-name {
    font-size: 1.8rem;
  }
  
  .stat-value {
    font-size: 2.2rem;
  }
  
  .stat-icon {
    font-size: 2.2rem;
  }
}

@media (max-width: 480px) {
  .fullscreen-place-title {
    font-size: 3.5rem;
  }
  
  .winner-line {
    font-size: 2rem;
  }
  
  .winner-name {
    font-size: 2.5rem;
  }
  
  .winner-stats {
    font-size: 1.5rem;
  }
  
  .winner-list {
    gap: 0.8rem;
  }
  
  .noble-card {
    padding: 1rem;
  }
  
  .noble-name {
    font-size: 1.5rem;
  }
  
  .stat-value {
    font-size: 1.8rem;
  }
  
  .stat-label {
    font-size: 1rem;
  }
}
</style>
