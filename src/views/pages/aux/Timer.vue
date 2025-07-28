  <script setup>
  // Таймер
  import { useTimerStore } from '@/stores/timer'
  import { onMounted } from 'vue'

  const timerStore = useTimerStore()



</script>

<template>

<div>
    <VCard>
      <VCardText>
        <div class="text-h2 text-center my-6">

          <div>
            {{timerStore.formattedRemainingTime}}
            </div>   
        </div>
 <button 
    @click="timerStore.toggleTimer"
    :disabled="timerStore.isLoading"
    class="timer-button"
   :class="{ 
          'active': timerStore.toggleTimer,
          'loading': timerStore.isLoading
        }"
  >
    <span v-if="!timerStore.isLoading">
      {{ timerStore.isPaused ? 'Запустить таймер' :  'Остановить таймер'}}
    </span>
    <span v-else class="loader"></span>
  </button> 
      </VCardText>
 
    </VCard>
  </div>
</template>

<style scoped>

.timer-button {
  display: block;
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.timer-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.timer-button:active {
  transform: translateY(0);
}

.timer-button.active {
  background: linear-gradient(135deg, #F44336 0%, #C62828 100%);
}

.timer-button.loading {
  background: #607D8B;
  cursor: not-allowed;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loader {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Эффект волны при клике */
.timer-button::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.timer-button:focus:not(:active)::after {
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}
</style>