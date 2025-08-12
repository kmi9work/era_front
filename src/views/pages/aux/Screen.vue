<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import axios from 'axios'

// Импортируем картинки
import previewTimer from '@/assets/images/preview_timer.jpg'
import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'
import previewResults from '@/assets/images/preview_results.jpg'

const timerStore = useTimerStore()
const isFullscreen = ref(false)
const selectedScreen = ref('timer')
const isTransitioning = ref(false)



const top3 = computed(() => playersList.value.slice(0, 3));

const positions = computed(() => {
  return {
    third: currentPlaceShown.value === 1 ? 50 : currentPlaceShown.value >= 2 ? 60 : 50,
    second: currentPlaceShown.value === 2 ? 40 : currentPlaceShown.value >= 3 ? 50 : 40,
    first: currentPlaceShown.value === 3 ? 30 : 30
  };
});



// Состояние для управления отображением результатов
const playersList = ref([])
const errorMessage = ref('')
const currentPlaceShown = ref(0) // 0 - не показывать, 1-3 - места, 4 - все
const showAllResults = ref(false)

// Загрузка списка игроков
const loadPlayers = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/show_sorted_results`)
    playersList.value = response.data || []
    // Сортируем по месту (place) в возрастающем порядке
    playersList.value.sort((a, b) => a.place - b.place)
  } catch (error) {
    console.error('Ошибка загрузки игроков:', error)
    errorMessage.value = 'Ошибка загрузки списка игроков'
  }
}

// Смена экрана с анимацией
const changeScreen = (screen) => {
  if (selectedScreen.value === screen || isTransitioning.value) return
  
  isTransitioning.value = true
  setTimeout(() => {
    selectedScreen.value = screen
    // Сбрасываем состояние результатов при переключении
    if (screen === 'results') {
      currentPlaceShown.value = 0
      showAllResults.value = false
    }
    isTransitioning.value = false
  }, 300)
}

// Полноэкранный режим
const enterFullscreen = () => {
  const element = document.getElementById('fullscreen-content')
  if (!element) return
  
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  }
}

// Выход из полноэкранного режима
const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  }
}

// Обработка клавиш
// Обновим обработчик Enter
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    exitFullscreen();
  }
  if (e.key === 'Enter' && isFullscreen.value && selectedScreen.value === 'results') {
    if (currentPlaceShown.value < 3) {
      currentPlaceShown.value++;
    } else if (currentPlaceShown.value === 3) {
      showAllResults.value = true;
    }
  }
};

// Инициализация
onMounted(() => {
  loadPlayers()
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
    // Сбрасываем состояние при выходе из полноэкранного режима
    if (!isFullscreen.value) {
      currentPlaceShown.value = 0
      showAllResults.value = false
    }
  })
})

// Убираем обработчики
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <!-- Обычный режим -->
  <div v-if="!isFullscreen" class="preview-container">
    <div class="preview-selector">
      <button 
        class="preview-item"
        :class="{ active: selectedScreen === 'timer' }"
        @click="changeScreen('timer')"
        :disabled="isTransitioning"
      >
        <img :src="previewTimer" alt="Таймер">
        <p>Таймер</p>
      </button>
      
      <button 
        class="preview-item"
        :class="{ active: selectedScreen === 'placeholder' }"
        @click="changeScreen('placeholder')"
        :disabled="isTransitioning"
      >
        <img :src="previewPlaceholder" alt="Заглушка">
        <p>Заглушка</p>
      </button>
      
      <button 
        class="preview-item"
        :class="{ active: selectedScreen === 'results' }"
        @click="changeScreen('results')"
        :disabled="isTransitioning"
      >
        <img :src="previewResults" alt="Результаты">
        <p>Результаты</p>
      </button>
    </div>

        <button 
      class="fullscreen-button" 
      @click="enterFullscreen"
      :disabled="isTransitioning"
    >
      <span>Полный экран</span>
    </button>

    <!-- Окно предпросмотра с анимацией -->
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

        <template v-else-if="selectedScreen === 'results'">
  <div class="results-preview">
    <h3>Результаты купцов</h3>
    <table class="preview-results-table">
      <thead>
        <tr>
          <th>Место</th>
          <th>Название</th>
          <th>Число игроков</th>
          <th>Общий капитал</th>
          <th>Капитал на игрока</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="player in playersList" :key="player.player_id">
          <td>{{ player.place }}</td>
          <td>{{ player.player }}</td>
          <td>{{ player.number_of_players }}</td>
          <td>{{ player.capital }}</td>
          <td>{{ player.cap_per_pl }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
      </div>
    </transition>


  </div>

  <!-- Полноэкранный режим -->
  <div v-show="isFullscreen" id="fullscreen-content" class="fullscreen">
    <transition name="fade" mode="out-in">
      <template v-if="selectedScreen === 'timer'">
        <div class="fullscreen-timer">
          <p>{{ timerStore.currentScheduleItemName }}</p>
          <p>{{ timerStore.formattedRemainingTime }}</p>
        </div>
      </template>

      <template v-else-if="selectedScreen === 'placeholder'">
        <img :src="previewPlaceholder" alt="Заглушка">
      </template>

<template v-else-if="selectedScreen === 'results'">
  <div class="fullscreen-results-container">
    <h2 class="results-title">Результаты Купцов</h2>

    <!-- Пошаговый показ топ-3 -->
    <div v-if="!showAllResults" class="top3-stage">
      <transition name="fade-slide">
        <div v-if="currentPlaceShown >= 1" key="third" class="place-line third-place" :style="{ top: positions.third + '%' }">
          {{ top3[2].place }} место — {{ top3[2].player }} — {{ top3[2].capital }}
        </div>
      </transition>

      <transition name="fade-slide">
        <div v-if="currentPlaceShown >= 2" key="second" class="place-line second-place" :style="{ top: positions.second + '%' }">
          {{ top3[1].place }} место — {{ top3[1].player }} — {{ top3[1].capital }}
        </div>
      </transition>

      <transition name="fade-slide">
        <div v-if="currentPlaceShown >= 3" key="first" class="place-line first-place" :style="{ top: positions.first + '%' }">
          {{ top3[0].place }} место — {{ top3[0].player }} — {{ top3[0].capital }}
        </div>
      </transition>
    </div>

    <!-- Полный список -->
    <transition name="fade">
      <table v-if="showAllResults" class="fullscreen-results-table">
        <thead>
          <tr>
            <th>Место</th>
            <th>Название</th>
            <th>Игроков</th>
            <th>Капитал</th>
            <th>Капитал/игрока</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in playersList" :key="player.player_id">
            <td>{{ player.place }}</td>
            <td>{{ player.player }}</td>
            <td>{{ player.number_of_players }}</td>
            <td>{{ player.capital }}</td>
            <td>{{ player.cap_per_pl }}</td>
          </tr>
        </tbody>
      </table>
    </transition>
  </div>
</template>




    </transition>
  </div>
</template>

<style scoped>
/* Основные стили */
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
  align-items: center;
}

.preview-selector {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
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
}

.preview-item:hover {
  transform: translateY(-2px);
}

.preview-item.active {
  border-color: #42b983;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px 6px 0 0;
}

.preview-item p {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  font-weight: 500;
}

/* Окно предпросмотра */
.preview-window {
  width: 1200px;
  height: 450px;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  margin-bottom: 2rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.preview-timer {
  text-align: center;
  padding: 1rem;
}

.preview-schedule-name {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.preview-timer-value {
  font-size: 3rem;
  font-weight: bold;
  color: #333;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
}

/* Стили для результатов в обычном режиме */
.results-preview {
  width: 100%;
  padding: 1rem;
}

.results-preview h3 {
  text-align: center;
  margin-bottom: 1rem;
  color: #333;
}

.preview-results {
  list-style: none;
  padding: 0;
}

.preview-results li {
  padding: 0.5rem;
  font-size: 1.2rem;
  color: #333;
  border-bottom: 1px solid #eee;
}

/* Кнопка полного экрана */
.fullscreen-button {
  width: 200px;
  padding: 0.75rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.fullscreen-button:hover {
  background-color: #3aa876;
}

.fullscreen-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Полноэкранные стили */
.fullscreen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #121212 url('@/assets/images/background/back.jpg') no-repeat center center;
  color: white;
}

.fullscreen-timer p {
  font-family: 'Beryozki', sans-serif;
  font-size: 12rem;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 1rem;
}

/* Стили для результатов в полноэкранном режиме */
.fullscreen-results-container {
  width: 100%;
  max-width: 800px;
  text-align: center;
}

.results-title {
  font-size: 4rem;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.fullscreen-results {
  list-style: none;
  padding: 0;
  font-size: 3rem;
}

.fullscreen-results li {
  margin-bottom: 1rem;
  padding: 1rem;
  transition: all 0.3s ease;
}

.third-place {
  color: #cd7f32; /* Бронза */
  font-weight: bold;
}

.second-place {
  color: #c0c0c0; /* Серебро */
  font-weight: bold;
}

.first-place {
  color: #ffd700; /* Золото */
  font-weight: bold;
}

.highlighted {
  animation: highlight 0.5s ease;
}

.press-enter {
  font-size: 2rem;
  margin-top: 2rem;
  opacity: 0.7;
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

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

@keyframes highlight {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Адаптивность */
@media (max-width: 900px) {
  .preview-window {
    width: 95%;
    height: 400px;
  }
}

@media (max-width: 768px) {
  .results-title {
    font-size: 2.5rem;
  }
  
  .fullscreen-results {
    font-size: 2rem;
  }
  
  .fullscreen-results li {
    padding: 0.5rem;
  }
  
  .press-enter {
    font-size: 1.5rem;
  }
}

@media (max-width: 600px) {
  .preview-selector {
  display: flex;
  gap: 1.5rem; /* было 1rem */
  justify-content: center;
  margin-bottom: 2rem;
}
  
  .preview-window {
    height: 300px;
  }
  
  .preview-schedule-name {
    font-size: 1.2rem;
  }
  
  .preview-timer-value {
    font-size: 2rem;
  }
  
  .fullscreen-timer p {
    font-size: 6rem;
  }
}

.preview-results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.2rem;
  color: #333;
}

.preview-results-table th,
.preview-results-table td {
  border: 1px solid #eee;
  padding: 0.5rem 1rem;
  text-align: left;
}

.preview-results-table th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.preview-results-table tr:nth-child(even) {
  background-color: #fafafa;
}

.top3-stage {
  position: relative;
  width: 100%;
  height: 60vh;
}

.place-line {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 3.5rem;
  font-weight: bold;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
}

.first-place { color: #ffd700; }
.second-place { color: #c0c0c0; }
.third-place { color: #cd7f32; }

.fade-slide-enter-active {
  transition: all 0.6s ease, opacity 0.6s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}
.fade-slide-enter-to {
  opacity: 1;
  transform: translate(-50%, 0);
}

.fullscreen-results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 2rem;
  margin-top: 2rem;
}

.fullscreen-results-table th,
.fullscreen-results-table td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.fullscreen-results-table th {
  text-align: center;
}








</style>