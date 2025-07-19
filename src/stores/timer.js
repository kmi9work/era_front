import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import axios from 'axios'

export const useTimerStore = defineStore('timer', () => {
  const isLoading = ref(false)
  const timerInterval = ref(null)
  const remainingTime = ref(0)
  const schedule = ref([])
  const presentTime = ref(Math.floor(Date.now()/1000))
  const timeNotice = ref("Перерыв")
  const isPaused = ref(false)

  async function toggleTimer() {
  try {
    isLoading.value = true      
    await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/toggle_timer`)
    
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/show_schedule.json`)
    schedule.value = response.data.timer.schedule || []
    isPaused.value = !(parseInt(response.data.timer.ticking) > 0)

    // При перезапуске обновляем текущее время
    const now = Math.floor(Date.now() / 1000)
    presentTime.value = now
    
    if (currentScheduleItem.value) {
      remainingTime.value = Math.max(0, currentScheduleItem.value.unix_finish - now)
    }

    if (isPaused.value) {
      stopTimers()
    } else {
      startTimers()
    }
  } catch (error) {
    console.error('Ошибка при переключении таймера:', error)
    isPaused.value = !isPaused.value
  } finally {
    isLoading.value = false
  }
}

  // Форматированное оставшееся время
  const formattedRemainingTime = computed(() => {
    if (isPaused.value) {
      return timeNotice.value
    }
    
    const pad = num => num.toString().padStart(2, '0')
    const hours = Math.floor(remainingTime.value / 3600)
    const minutes = Math.floor((remainingTime.value % 3600) / 60)
    const seconds = remainingTime.value % 60
    
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  })

  // Загрузка расписания
  async function fetchSchedule() {
    try {
      isLoading.value = true
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/show_schedule.json`)
      schedule.value = response.data.timer.schedule
      isPaused.value = !(parseInt(response.data.timer.ticking) > 0)

      if (!isPaused.value) {
        startTimers()
      }
    } catch (error) {
      console.error('Ошибка при получении расписания:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Текущий активный элемент расписания
  const currentScheduleItem = computed(() => {
    if (!Array.isArray(schedule.value)) return null
    return schedule.value.find(item => 
      item.unix_start <= presentTime.value && 
      presentTime.value <= item.unix_finish
    )
  })

  const currentScheduleItemName = computed(() => {
    return currentScheduleItem.value?.identificator ?? null
  })

  // Запуск таймера
function startTimers() {
  stopTimers()
  
  // Сначала обновляем текущее время
  const now = Math.floor(Date.now() / 1000)
  presentTime.value = now
  
  // Проверяем наличие активного элемента
  if (currentScheduleItem.value) {
    // Обновляем оставшееся время
    remainingTime.value = Math.max(0, currentScheduleItem.value.unix_finish - now)
    
    // Если время уже истекло, ставим на паузу
    if (remainingTime.value <= 0) {
      isPaused.value = true
      stopTimers()
      return
    }
    
    // Запускаем интервал
    timerInterval.value = setInterval(async () => {
      const now = Math.floor(Date.now() / 1000)
      presentTime.value = now
      remainingTime.value = Math.max(0, currentScheduleItem.value.unix_finish - now)
      
      if (remainingTime.value <= 0) {
        try {
          await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/toggle_timer`)
          isPaused.value = true
          stopTimers()
        } catch (error) {
          console.error('Ошибка при остановке таймера:', error)
          isPaused.value = true
          stopTimers()
        }
      }
    }, 1000)
  } else {
    isPaused.value = true
  }
}
  // Остановка таймера
  function stopTimers() {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  // Очистка при демонтировании
  onUnmounted(stopTimers)

  // Инициализация
  fetchSchedule()

  return {
    isLoading,
    schedule,
    presentTime,
    remainingTime,
    formattedRemainingTime,
    currentScheduleItemName,
    isPaused,
    fetchSchedule,
    stopTimers,
    toggleTimer
  }
})