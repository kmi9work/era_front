<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import axios from 'axios'


defineProps({
  title: {
    type: String,
    default: 'Таймер'
  }
})

const isLoading = ref(false)
//Отметка о том, что таймер запущен
const timerTicking = ref (0)

//Осталось секунд
const remainingTime = ref(1)
let timerInterval = null // Для хранения идентификатора интервала


async function switchTimer() {
  try {
    await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/switch_timer`)
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/show_time.json`);
    timerTicking.value = response.data.timer.ticking
   } catch (error) {
    console.error('Ошибка при переключении таймера:', error)
  }
}

// Добавляем вотчер для remainingTime
watch(timerTicking, (newValue) => {
  // Останавливаем таймер при выключении
  if (!newValue && timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Запускаем таймер при включении и наличии времени
  if (newValue && remainingTime.value > 0) {
    startTimer();
  }
});

async function fetchRemainingTime() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/show_time.json`);
    remainingTime.value = response.data.timer.time 
    timerTicking.value = response.data.timer.ticking

    // Если таймер должен тикать, запускаем интервал
    if (timerTicking.value > 0) {
      startTimer()
    }

  } catch (error) {
    console.error('Ошибка при получении времени:', error)
  }
}

function startTimer() {
  // Очищаем предыдущий интервал, если он был
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // Запускаем новый интервал только если таймер активен
  if(timerTicking.value) { // Проверяем флаг активности таймера
    timerInterval = setInterval(() => {
      if (remainingTime.value > 0) {
        remainingTime.value -= 1;
      } else {
        // Если время вышло, очищаем интервал
        clearInterval(timerInterval);
        timerTicking.value = false; // Добавляем сброс флага
      }
    }, 1000);
  }
}

onMounted(() => {
  fetchRemainingTime()
})

const formattedTime = computed(() => {
  const hours = Math.floor(remainingTime.value / 3600);
  const minutes = Math.floor((remainingTime.value % 3600) / 60);
  const seconds = remainingTime.value % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});



</script>

<template>
  <div>
    <VCard>

      <VCardText>
        <div class="text-h2 text-center my-6">

          {{ formattedTime }} 
          
        </div>

  <button 
    @click="switchTimer"
    :disabled="isLoading"
    class="timer-switch-button"
  >
    <span v-if="!isLoading">
      {{ timerTicking > 0 ? 'Остановить таймер' : 'Запустить таймер' }}
    </span>
    <span v-else class="loader"></span>
  </button>


      </VCardText>

 
    </VCard>
  </div>
</template>

<style scoped>
/* Дополнительные стили при необходимости */
.gap-4 {
  gap: 16px;
}


.timer-switch-button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
  min-width: 160px;
  height: 40px;
}

.timer-switch-button:hover {
  background-color: #45a049;
}

.timer-switch-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}


</style>