<template>
  <div class="results-preview">
    <div class="preview-message"></div>
    <div class="merchant-controls-compact">
      <button 
        @click="() => {filterNobleResults('noblePlaceholder'); }"
        :class="{ active: activeScreen === 'noblePlaceholder'}"
        class="compact-button all-btn"
        :disabled="endGameResultsStore.isLoading"
        title="Показать все результаты"
      >
        Заглушка
      </button>

      <button 
        @click="() => {filterNobleResults('thirdPlaceNoble'); }"
        :class="{ active: activeScreen === 'thirdPlaceNoble' }"
        class="compact-button third-btn"
        :disabled="endGameResultsStore.isLoading"
        title="Только третье место"
      >
        '3.1'
      </button>
      
      <button 
        @click="() => { filterNobleResults('thirdNoble', 3); }"
        :class="{  active: activeScreen === 'thirdNoble' }"
        class="compact-button third-btn"
        :disabled="endGameResultsStore.isLoading"
        title="Только третье место"
      >
        3
      </button>

      <button 
        @click="() => {filterNobleResults('secondPlaceNoble'); }"
        :class="{ active: activeScreen === 'secondPlaceNoble' }"
        class="compact-button third-btn"
        :disabled="endGameResultsStore.isLoading"
        title="Только третье место"
      >
        '2.1'
      </button>
      
      <button 
        @click="() => { filterNobleResults('secondNoble', 2);}"
        :class="{  active: activeScreen  === 'secondNoble' }"
        class="compact-button second-third-btn"
        :disabled="endGameResultsStore.isLoading"
        title="Второе и третье места"
      >
        2
      </button>
      
      <button 
        @click="() => {filterNobleResults('firstPlaceNoble'); }"
        :class="{ active: activeScreen === 'firstPlaceNoble' }"
        class="compact-button third-btn"
        :disabled="endGameResultsStore.isLoading"
        title="Только третье место"
      >
        '1.1'
      </button>

      <button 
        @click="() => { filterNobleResults('firstNoble', 1)}"
        :class="{ active: activeScreen  === 'firstNoble' }"
        class="compact-button top-three-btn"
        :disabled="endGameResultsStore.isLoading"
        title="Топ 3 места"
      >
        1
      </button>

      <button 
        @click="() => {filterNobleResults('allNoble', 0); }"
        :class="{ active: activeScreen === 'allNoble' }"
        class="compact-button third-btn"
        :disabled="endGameResultsStore.isLoading"
        title="Только третье место"
      >
        Вся знать
      </button>
    </div>
  </div>
</template>

<script setup>
import { useEndGameResultsStore } from '@/stores/end_game_results.js'

const endGameResultsStore = useEndGameResultsStore()

// Эти функции должны быть переданы из родительского компонента
// Пока что создаем заглушки
const filterNobleResults = (display, place = null) => {
  console.log('Filter noble results:', display, place)
}
</script>

<style scoped>
.results-preview {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.preview-message {
  margin-bottom: 1rem;
}

.merchant-controls-compact {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 8px;
}

.compact-button {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #4a5568;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compact-button:hover {
  border-color: #cbd5e0;
  background: #f7fafc;
  transform: translateY(-1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.compact-button.active {
  font-weight: 600;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

.compact-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.all-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.third-btn.active {
  background: #ed64a6;
  color: white;
  border-color: #ed64a6;
}

.second-third-btn.active {
  background: #4c51bf;
  color: white;
  border-color: #4c51bf;
}

.top-three-btn.active {
  background: #48bb78;
  color: white;
  border-color: #48bb78;
}

.compact-button.active {
  animation: mini-pulse 0.3s ease;
}

@keyframes mini-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@media (max-width: 480px) {
  .merchant-controls-compact {
    gap: 6px;
  }
  
  .compact-button {
    padding: 4px 8px;
    font-size: 11px;
    min-width: 36px;
    height: 24px;
  }
}
</style>
