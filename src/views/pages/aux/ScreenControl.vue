<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import axios from 'axios'

import Timer from '@/views/pages/aux/Timer.vue'

import previewTimer from '@/assets/images/preview_timer.jpg'
import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'
import previewResults from '@/assets/images/preview_results.jpg'
import nobleIcon from '@/assets/images/noble.jpeg'

const timerStore = useTimerStore()
const selectedScreen = ref('timer')
const isTransitioning = ref(false)
const playersList = ref([])
const noblesList = ref([])
const errorMessage = ref('')




const formatNumber = (num) => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0'
}

const loadPlayers = async () => {
  try {
    const playersRes = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/show_sorted_results`);
    playersList.value = (playersRes.data || []).sort((a, b) => a.place - b.place);

    const nobResponse = await axios.get(`${import.meta.env.VITE_PROXY}/players.json`);
    const nobles = (nobResponse.data || [])
      .filter(player => player?.player_type?.id === 2)
      .map(player => ({
        ...player,
        influence: player.influence || 0
      }))
      .sort((a, b) => b.influence - a.influence);

    let currentRank = 1;
    nobles.forEach((noble, index) => {
      if (index > 0 && noble.influence < nobles[index - 1].influence) {
        currentRank = index + 1;
      }
      noble.place = currentRank;
    });

    noblesList.value = nobles;

  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    errorMessage.value = 'Ошибка загрузки данных';
  }
};

const changeScreen = async (screen) => {
  if (selectedScreen.value === screen || isTransitioning.value) return;
  const getScreenType = (screen) => {
    switch (screen) {
      case "placeholder": return 0;
      case "timer": return 1;
      case "results": return 2;
      case "nobles": return 3;
      default: return 0;
    }
  };
  const typeOfScreen = getScreenType(screen);

  try {
    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/toggle_screen`,
      { request: typeOfScreen }
    );
    isTransitioning.value = true;
    setTimeout(() => {
      selectedScreen.value = screen;
      isTransitioning.value = false;
    }, 300);
  } catch (error) {
    console.error("Ошибка при смене экрана:", error);
  }
};

onMounted(() => {
  loadPlayers()
})
</script>

<template>
  <div class="preview-container">
    <!-- Выбор экрана -->
    <div class="preview-selector">
      <button 
        v-for="screen in [
          { id: 'timer', label: 'Таймер', icon: previewTimer },
          { id: 'placeholder', label: 'Заглушка', icon: previewPlaceholder },
          { id: 'results', label: 'Результаты', icon: previewResults },
          { id: 'nobles', label: 'Знать', icon: nobleIcon },
        ]"
        :key="screen.id"
        class="preview-item"
        :class="{ active: selectedScreen === screen.id }"
        @click="changeScreen(screen.id)"
        :disabled="isTransitioning"
      >
        <img :src="screen.icon" :alt="screen.label">
        <p>{{ screen.label }}</p>
      </button>
    </div>

    <!-- Кнопка под выбором экрана -->
    <div v-if="selectedScreen === 'timer'" class="preview-controls">
    <div class="preview-controls">
      <div class="buttons-container">
      <button 
        @click="timerStore.toggleTimer"
        :disabled="timerStore.isLoading"
        class="timer-button"
        :class="{ 
          'active': !timerStore.isPaused,
          'loading': timerStore.isLoading
        }"
      >
        <span v-if="!timerStore.isLoading">
          {{ timerStore.isPaused ? 'Запустить таймер' : 'Остановить таймер' }}
        </span>
        <span v-else class="loader">Загрузка...</span>
      </button>
    </div>
    <p class="timer-value">{{ timerStore.noScheduleInTheBaseMessage }}</p>
  </div>
    </div>

    <!-- Окно предпросмотра -->
    <transition name="fade" mode="out-in">
      <div v-if="selectedScreen" class="preview-window" :key="selectedScreen">
        <template v-if="selectedScreen === 'timer'">
          <div class="preview-timer">
            <p class="preview-schedule-name">{{ timerStore.currentScheduleItemName }}</p>
            <p class="preview-timer-value">{{ timerStore.formattedRemainingTime }}</p>
          </div>
        </template>

        <template v-else-if="selectedScreen === 'placeholder'">
          <img class="preview-image" :src="previewPlaceholder" alt="Заглушка">
        </template>

        <template v-else-if="selectedScreen === 'nobles'">
          <div class="results-preview">
            <h3>Результаты дворян</h3>
            <div class="table-container">
              <table class="preview-results-table">
                <thead>
                  <tr>
                    <th>Место</th>
                    <th>Имя</th>
                    <th>Влияние</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(noble, index) in noblesList" :key="`noble-${noble.id}-${index}`">
                    <td>{{ noble.place }}</td>
                    <td>{{ noble.name }}</td>
                    <td>{{ formatNumber(noble.influence) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template v-else-if="selectedScreen === 'results'">
          <div class="results-preview">
            <h3>Результаты купцов</h3>
            <div class="table-container">
              <table class="preview-results-table">
                <thead>
                  <tr>
                    <th>Место</th>
                    <th>Название</th>
                    <th>Игроков</th>
                    <th>Капитал</th>
                    <th>На игрока</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="player in playersList" :key="`player-${player.player_id}`">
                    <td>{{ player.place }}</td>
                    <td>{{ player.player }}</td>
                    <td>{{ player.number_of_players }}</td>
                    <td>{{ formatNumber(player.capital) }}</td>
                    <td>{{ formatNumber(player.cap_per_pl) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>





<style scoped>
/* здесь оставил только стили для предпросмотра */
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.preview-selector {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}
.buttons-container {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
  flex-wrap: wrap;
}

.preview-item {
  width: 200px;
  height: 150px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.preview-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.preview-item.active {
  border-color: #42b983;
  box-shadow: 0 0 0 2px #42b983;
}

.preview-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px 6px 0 0;
}

.preview-item p {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
}

/* Окно предпросмотра */
.preview-window {
  width: 100%;
  min-height: 500px;
  border: 2px solid #e1e1e1;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.preview-timer {
  text-align: center;
  padding: 2rem;
  width: 100%;
}

.preview-schedule-name {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #333;
  font-weight: 500;
}

.preview-timer-value {
  font-size: 4rem;
  font-weight: bold;
  color: #2c3e50;
  font-family: 'Roboto Mono', monospace;
}

.preview-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
}

/* Стили таблиц */
.results-preview {
  width: 100%;
  padding: 1.5rem;
}

.results-preview h3 {
  text-align: center;
  margin: 1.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 3rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  background: white;
}

.preview-results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.1rem;
  min-width: 800px;
}

.preview-results-table th {
  background-color: #f5f7fa;
  position: sticky;
  top: 0;
  z-index: 10;
  font-weight: 600;
  color: #4a5568;
}

.preview-results-table th,
.preview-results-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.preview-results-table tr:hover {
  background-color: #f8fafc;
}

.preview-results-table tr:nth-child(even) {
  background-color: #fafafa;
}

.schedule-name {
  font-size: 3rem;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.timer-value {
  font-size: 10rem;
  font-weight: bold;
  font-family: 'Roboto Mono', monospace;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
}

.fullscreen-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}



.results-title {
  font-size: 3.5rem;
  margin-bottom: 3rem;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  color: #fff;
}

.top3-stage {
  position: relative;
  width: 100%;
  height: 60vh;
  margin-bottom: 3rem;
}

.place-line {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 3.5rem;
  font-weight: bold;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  padding: 1rem 2rem;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.3);
}

.first-place { 
  color: #ffd700;
  background-color: rgba(255, 215, 0, 0.1);
}

.second-place { 
  color: #c0c0c0;
  background-color: rgba(192, 192, 192, 0.1);
}

.third-place { 
  color: #cd7f32;
  background-color: rgba(205, 127, 50, 0.1);
}

.fullscreen-tables {
  width: 90%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  margin: 2rem auto;
}


.press-enter {
  font-size: 1.8rem;
  margin-top: 3rem;
  text-align: center;
  opacity: 0.7;
  animation: pulse 2s infinite;
}

/* Стили для графика влияния */
.influence-graph-container {
  width: 100%;
  margin-bottom: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 2rem;
}

.influence-graph {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 15px;
  height: 250px;
  padding: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 60px;
  transition: height 0.5s ease;
}

.bar {
  width: 40px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  position: relative;
  animation: grow 0.8s ease-out forwards;
  transform-origin: bottom;
}

.bar.positive {
  background: linear-gradient(to top, #4CAF50, #81C784);
}

.bar.negative {
  background: linear-gradient(to top, #F44336, #E57373);
}

.bar-image {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.bar-label {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  display: flex;
  flex-direction: column;
}

.influence-value {
  font-weight: bold;
  margin-top: 5px;
}

/* Анимации */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active {
  transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.fade-slide-leave-to {
  opacity: 0;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

@keyframes grow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

/* Полоса прокрутки */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .fullscreen-table {
    font-size: 1.5rem;
  }
  
  .place-line {
    font-size: 3rem;
  }
}

@media (max-width: 992px) {
  .preview-window {
    min-height: 400px;
  }
  
  .preview-timer-value {
    font-size: 3rem;
  }
  
  .timer-value {
    font-size: 8rem;
  }
  
  .fullscreen-table {
    font-size: 1.3rem;
  }
  
  .place-line {
    font-size: 2.5rem;
    white-space: normal;
    text-align: center;
    width: 90%;
  }
  
  .influence-graph {
    gap: 10px;
    height: 200px;
  }
  
  .bar-container {
    width: 50px;
  }
  
  .bar {
    width: 35px;
  }
  
  .bar-image {
    width: 35px;
    height: 35px;
    top: -20px;
  }
}

@media (max-width: 768px) {
  .preview-selector {
    gap: 1rem;
  }
  
  .preview-item {
    width: 160px;
    height: 120px;
  }
  
  .preview-item img {
    height: 90px;
  }
  
  .preview-schedule-name {
    font-size: 1.4rem;
  }
  
  .preview-timer-value {
    font-size: 2.5rem;
  }
  
  .schedule-name {
    font-size: 2rem;
  }
  
  .timer-value {
    font-size: 6rem;
  }
  
  .results-title {
    font-size: 2.5rem;
  }
  
  .fullscreen-table {
    font-size: 1.1rem;
  }
  
  .place-line {
    font-size: 2rem;
    padding: 0.8rem 1rem;
  }
  
  .press-enter {
    font-size: 1.4rem;
  }
  
  .influence-graph {
    gap: 8px;
    height: 180px;
  }
  
  .bar-container {
    width: 40px;
  }
  
  .bar {
    width: 30px;
  }
  
  .bar-image {
    width: 30px;
    height: 30px;
    top: -15px;
  }
  
  .bar-label {
    font-size: 12px;
  }
}

@media (max-width: 576px) {
  .preview-container {
    padding: 1rem;
  }
  
  .preview-item {
    width: 120px;
    height: 100px;
  }
  
  .preview-item img {
    height: 70px;
  }
  
  .preview-item p {
    font-size: 0.9rem;
  }
  
  .preview-window {
    min-height: 300px;
  }
  
  .timer-value {
    font-size: 4rem;
  }
  
  .place-line {
    font-size: 1.6rem;
  }
  
  .influence-graph {
    gap: 5px;
    height: 150px;
  }
  
  .bar-container {
    width: 30px;
  }
  
  .bar {
    width: 25px;
  }
  
  .bar-image {
    width: 25px;
    height: 25px;
    top: -12px;
  }
  
  .bar-label {
    font-size: 10px;
  }
}
</style>