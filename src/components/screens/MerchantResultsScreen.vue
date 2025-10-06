<template>
  <div class="results-screen">
    <!-- Заглушка -->
    <div v-if="activeScreen === 'merchPlaceholder'" class="all-results-container">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты купцов</div>
      </div>
    </div>

    <!-- Текстовые заголовки -->
    <div v-else-if="activeScreen === 'thirdPlaceMerch'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Третье место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondPlaceMerch'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Второе место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstPlaceMerch'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Первое место</div> 
      </div>
    </div>

    <!-- Детальные результаты -->
    <div v-else-if="activeScreen === 'thirdMerch'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <span class="winner-stats">
              {{ team.capital.toLocaleString() }}💰 • 
              {{ team.number_of_players }}👥 • 
              <span class="highlight-gold">{{ (team.cap_per_pl || 0).toLocaleString() }}</span> •
              <span class="highlight-gold">{{ team.boyar_favor || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondMerch'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <span class="winner-stats">
              {{ team.capital.toLocaleString() }}💰 • 
              {{ team.number_of_players }}👥 • 
              <span class="highlight-gold">{{ (team.cap_per_pl || 0).toLocaleString() }}</span> •
              <span class="highlight-gold">{{ team.boyar_favor || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstMerch'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <span class="winner-stats">
              {{ team.capital.toLocaleString() }}💰 • 
              {{ team.number_of_players }}👥 • 
              <span class="highlight-gold">{{ (team.cap_per_pl || 0).toLocaleString() }}</span> •
              <span class="highlight-gold">{{ team.boyar_favor || 0 }}⚜️</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица всех результатов -->
    <div v-else-if="activeScreen === 'allMerch'" class="all-results-container">
      <div class="fullscreen-text-container">
        <table class="merchant-table">
          <thead>
            <tr>
              <th class="place-col">Место</th>
              <th class="name-col">Команда</th>
              <th class="capital-col">Капитал</th>
              <th class="players-col">Игроков</th>
              <th class="capital-per-player-col">На игрока</th>
              <th class="favor-col">Боярская милость</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(team, index) in merchResults" 
              :key="team.player_id || index"
              :class="'place-' + team.place"
            >
              <td class="place-number">{{ team.place }}</td>
              <td class="team-name">{{ team.player }}</td>
              <td class="team-capital">{{ team.capital.toLocaleString() }}💰</td>
              <td class="team-players">{{ team.number_of_players }}👥</td>
              <td class="team-capital-per-player">{{ (team.cap_per_pl || 0).toLocaleString() }}💰</td>
              <td class="team-favor">{{ team.boyar_favor || 0 }}⚜️</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fallback -->
    <div v-else class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты купцов</div>
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

const merchResults = computed(() => {
  if (props.currentPlace === 0) {
    return endGameResultsStore.merchantsList
  } else {
    return endGameResultsStore.merchantsList.filter(
      (merchant) => merchant.place === props.currentPlace
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

.place-1 .place-number { color: #FFD700; }
.place-2 .place-number { color: #C0C0C0; }
.place-3 .place-number { color: #CD7F32; }

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

/* Таблица результатов */
.merchant-table {
  width: 90%;
  border-collapse: collapse;
  font-family: 'Beryozki', sans-serif;
  font-size: 4rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.merchant-table th {
  background: rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  text-align: center;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.merchant-table td {
  padding: 1.2rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.merchant-table tr:last-child td {
  border-bottom: none;
}

.merchant-table tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Цвета для призовых мест */
.merchant-table tr.place-1 {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent);
}

.merchant-table tr.place-2 {
  background: linear-gradient(90deg, rgba(192, 192, 192, 0.1), transparent);
}

.merchant-table tr.place-3 {
  background: linear-gradient(90deg, rgba(205, 127, 50, 0.1), transparent);
}

/* Анимация появления строк */
.merchant-table tr {
  animation: slideIn 0.5s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Адаптивность */
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
  
  .merchant-table {
    font-size: 1.8rem;
    width: 95%;
  }
  
  .merchant-table th,
  .merchant-table td {
    padding: 1rem;
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
  
  .merchant-table {
    font-size: 1.4rem;
  }
  
  .merchant-table th,
  .merchant-table td {
    padding: 0.8rem;
  }
}
</style>
