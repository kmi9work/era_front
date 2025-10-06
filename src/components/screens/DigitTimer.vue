<template>
  <div class="digit-timer">
    <div class="timer-digits">
      <!-- Часы -->
      <div class="digit-group">
        <div class="digit" :class="{ 'digit-changed': digitChanged.hours[0] }">
          {{ hours[0] }}
        </div>
        <div class="digit" :class="{ 'digit-changed': digitChanged.hours[1] }">
          {{ hours[1] }}
        </div>
      </div>
      
      <!-- Разделитель -->
      <div class="separator">:</div>
      
      <!-- Минуты -->
      <div class="digit-group">
        <div class="digit" :class="{ 'digit-changed': digitChanged.minutes[0] }">
          {{ minutes[0] }}
        </div>
        <div class="digit" :class="{ 'digit-changed': digitChanged.minutes[1] }">
          {{ minutes[1] }}
        </div>
      </div>
      
      <!-- Разделитель -->
      <div class="separator">:</div>
      
      <!-- Секунды -->
      <div class="digit-group">
        <div class="digit" :class="{ 'digit-changed': digitChanged.seconds[0] }">
          {{ seconds[0] }}
        </div>
        <div class="digit" :class="{ 'digit-changed': digitChanged.seconds[1] }">
          {{ seconds[1] }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  timeString: {
    type: String,
    required: true
  }
})

// Предыдущие значения для отслеживания изменений
const prevDigits = ref({
  hours: ['0', '0'],
  minutes: ['0', '0'],
  seconds: ['0', '0']
})

// Отслеживание изменений цифр для анимации
const digitChanged = ref({
  hours: [false, false],
  minutes: [false, false],
  seconds: [false, false]
})

// Разбиваем строку времени на отдельные цифры
const timeDigits = computed(() => {
  const parts = props.timeString.split(':')
  if (parts.length !== 3) {
    return {
      hours: ['0', '0'],
      minutes: ['0', '0'],
      seconds: ['0', '0']
    }
  }
  
  return {
    hours: parts[0].split(''),
    minutes: parts[1].split(''),
    seconds: parts[2].split('')
  }
})

const hours = computed(() => timeDigits.value.hours)
const minutes = computed(() => timeDigits.value.minutes)
const seconds = computed(() => timeDigits.value.seconds)

// Отслеживаем изменения цифр
watch(timeDigits, (newDigits) => {
  // Проверяем изменения в часах
  digitChanged.value.hours[0] = newDigits.hours[0] !== prevDigits.value.hours[0]
  digitChanged.value.hours[1] = newDigits.hours[1] !== prevDigits.value.hours[1]
  
  // Проверяем изменения в минутах
  digitChanged.value.minutes[0] = newDigits.minutes[0] !== prevDigits.value.minutes[0]
  digitChanged.value.minutes[1] = newDigits.minutes[1] !== prevDigits.value.minutes[1]
  
  // Проверяем изменения в секундах
  digitChanged.value.seconds[0] = newDigits.seconds[0] !== prevDigits.value.seconds[0]
  digitChanged.value.seconds[1] = newDigits.seconds[1] !== prevDigits.value.seconds[1]
  
  // Сохраняем текущие значения
  prevDigits.value = { ...newDigits }
  
  // Сбрасываем флаги изменений через короткое время
  setTimeout(() => {
    digitChanged.value = {
      hours: [false, false],
      minutes: [false, false],
      seconds: [false, false]
    }
  }, 300)
}, { immediate: true })
</script>

<style scoped>
.digit-timer {
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Beryozki', monospace;
  font-size: 20rem;
  font-feature-settings: "tnum";
  text-rendering: optimizeLegibility;
  font-weight: bold;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  line-height: 0.8;
}

.timer-digits {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.digit-group {
  display: flex;
  gap: 0.1rem;
}

.digit {
  display: inline-block;
  width: 1.2em; /* Фиксированная ширина для каждой цифры */
  text-align: center;
  transition: all 0.3s ease;
  color: white;
}

.digit-changed {
  animation: digitChange 0.3s ease;
  color: #FFD700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
}

.separator {
  color: white;
  font-size: 0.8em;
  margin: 0 0.1rem;
  animation: blink 1s infinite;
}

@keyframes digitChange {
  0% {
    transform: scale(1);
    color: white;
  }
  50% {
    transform: scale(1.1);
    color: #FFD700;
  }
  100% {
    transform: scale(1);
    color: white;
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .digit-timer {
    font-size: 10rem;
  }
  
  .timer-digits {
    gap: 0.2rem;
  }
  
  .digit-group {
    gap: 0.05rem;
  }
  
  .digit {
    width: 1.1em;
  }
  
  .separator {
    margin: 0 0.05rem;
  }
}

@media (max-width: 480px) {
  .digit-timer {
    font-size: 8rem;
  }
  
  .timer-digits {
    gap: 0.15rem;
  }
  
  .digit-group {
    gap: 0.03rem;
  }
  
  .digit {
    width: 1em;
  }
  
  .separator {
    margin: 0 0.03rem;
  }
}
</style>
