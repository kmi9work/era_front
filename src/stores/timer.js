import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import axios from 'axios'

export const useTimerStore = defineStore('timer', () => {
  // Состояния
  const isLoading = ref(false)
  const timerInterval = ref(null)
  const remainingTime = ref(0)
  const schedule = ref([])
  const presentTime = ref(Math.floor(Date.now()/1000))
  const timeNotice = ref("Перерыв")
  const isPaused = ref(true)
  const broadcastChannel = ref(null)

  // Инициализация Broadcast Channel
  const initBroadcastChannel = () => {
    broadcastChannel.value = new BroadcastChannel('timer_sync_channel')
    
    broadcastChannel.value.onmessage = async (event) => {
      if (event.data.type === 'TIMER_UPDATE') {
        // Обновляем состояние без триггера нового сообщения
        isPaused.value = event.data.isPaused
        remainingTime.value = event.data.remainingTime
        presentTime.value = event.data.presentTime
        
        if (!isPaused.value && !timerInterval.value) {
          startTimers()
        } else if (isPaused.value) {
          stopTimers()
        }
      }
      
      if (event.data.type === 'REQUEST_STATE') {
        // Отвечаем текущим состоянием
        broadcastChannel.value.postMessage({
          type: 'TIMER_UPDATE',
          isPaused: isPaused.value,
          remainingTime: remainingTime.value,
          presentTime: presentTime.value,
          timestamp: Date.now()
        })
      }
    }
  }

  // Отправка обновления состояния
  const broadcastState = () => {
    if (broadcastChannel.value) {
      broadcastChannel.value.postMessage({
        type: 'TIMER_UPDATE',
        isPaused: isPaused.value,
        remainingTime: remainingTime.value,
        presentTime: presentTime.value,
        timestamp: Date.now()
      })
    }
  }

  // Переключение таймера
  const toggleTimer = async () => {
    try {
      isLoading.value = true
      
      // Отправляем запрос на сервер
      await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/toggle_timer`)
      
      // Получаем актуальное расписание
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/show_schedule.json`)
      schedule.value = response.data.timer.schedule || []
      
      // Обновляем состояние

      isPaused.value = !(parseInt(response.data.timer.ticking) > 0)
      presentTime.value = Math.floor(Date.now() / 1000)
      
      if (currentScheduleItem.value) {
        remainingTime.value = Math.max(0, currentScheduleItem.value.unix_finish - presentTime.value)
      }
      
      // Управление таймерами
      if (!isPaused.value) {
        startTimers()
      } else if (isPaused.value) {
        stopTimers()
      }
      
      // Синхронизируем с другими вкладками
      broadcastState()
      
    } catch (error) {
      console.error('Ошибка при переключении таймера:', error)
      // В случае ошибки возвращаем предыдущее состояние
      isPaused.value = !isPaused.value
    } finally {
      isLoading.value = false
    }
  }

  // Форматированное время
  const formattedRemainingTime = computed(() => {
    if (isPaused.value) return timeNotice.value
    
    const pad = num => num.toString().padStart(2, '0')
    const hours = Math.floor(remainingTime.value / 3600)
    const minutes = Math.floor((remainingTime.value % 3600) / 60)
    const seconds = remainingTime.value % 60
    
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  })

  // Загрузка расписания
  const fetchSchedule = async () => {
    try {
      isLoading.value = true
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/show_schedule.json`)
      schedule.value = response.data.timer.schedule || []
      isPaused.value = !(parseInt(response.data.timer.ticking) > 0)
      presentTime.value = Math.floor(Date.now() / 1000)
      
      if (currentScheduleItem.value) {
        remainingTime.value = Math.max(0, currentScheduleItem.value.unix_finish - presentTime.value)
      }
      
      if (!isPaused.value) {
        startTimers()
      }
      
      // Запрашиваем состояние у других вкладок
      if (broadcastChannel.value) {
        broadcastChannel.value.postMessage({ type: 'REQUEST_STATE' })
      }
      
    } catch (error) {
      console.error('Ошибка при получении расписания:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Текущий элемент расписания
  const currentScheduleItem = computed(() => {
    return schedule.value.find(item => 
      item.unix_start <= presentTime.value && 
      presentTime.value <= item.unix_finish
    ) || null
  })

  const currentScheduleItemName = computed(() => {
    return currentScheduleItem.value?.identificator || timeNotice.value
  })

  // Запуск таймеров
  const startTimers = () => {
    stopTimers()
    
    presentTime.value = Math.floor(Date.now() / 1000)
    
    if (!currentScheduleItem.value) {
      isPaused.value = true
      broadcastState()
      return
    }
    
    remainingTime.value = Math.max(0, currentScheduleItem.value.unix_finish - presentTime.value)
    
    if (remainingTime.value <= 0) {
      isPaused.value = true
      broadcastState()
      return
    }
    
    timerInterval.value = setInterval(() => {
      presentTime.value = Math.floor(Date.now() / 1000)
      remainingTime.value = Math.max(0, currentScheduleItem.value.unix_finish - presentTime.value)
      
      if (remainingTime.value <= 0) {
        toggleTimer().catch(console.error)
      }
    }, 1000)
  }

  // Остановка таймеров
  const stopTimers = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  // Очистка
  onUnmounted(() => {
    stopTimers()
    if (broadcastChannel.value) {
      broadcastChannel.value.close()
    }
  })

  // Инициализация
  initBroadcastChannel()
  fetchSchedule()

  return {
    isLoading,
    isPaused,
    schedule,
    remainingTime,
    formattedRemainingTime,
    currentScheduleItemName,
    fetchSchedule,
    toggleTimer
  }
})