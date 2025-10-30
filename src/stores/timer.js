import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import axios from 'axios'

export const useTimerStore = defineStore('timer', () => {
  const isLoading = ref(false)
  const timerInterval = ref(null)
  const remainingTime = ref(0)
  const schedule = ref([])
  const presentTime = ref(Math.floor(Date.now() / 1000))
  const timeNotice = ref("Перерыв")
  const isPaused = ref(false)
  const range = ref({ start: 0, finish: 0 })
  const controller = new AbortController()
  const pollTime = 5000
  const pollInterval = ref(null)
  const lastToggleTime = ref(0)
  const activeItem = ref(null)

  const isOutOfRange = ref(false)
  const outOfRangeMessage = ref("Эпоха Перемен")
  const noScheduleInTheBase = ref(false)
  const noScheduleInTheBaseMessage = ref("В базе нет расписания")
  const autoStartNextCycle = ref(false)

  // Проверка выхода за временные границы
  const checkIfOutOfRange = () => {
    if (noScheduleInTheBase.value) {
      isOutOfRange.value = true
      return
    }
    const now = Math.floor(Date.now() / 1000)
    isOutOfRange.value = now < range.value.start || now > range.value.finish
  }

  // Текущий активный элемент расписания
  const currentScheduleItem = computed(() => {
    if (!Array.isArray(schedule.value) || schedule.value.length === 0) return null
    return schedule.value.find(item =>
      item.unix_start <= presentTime.value &&
      presentTime.value <= item.unix_finish
    )
  })

  // Имя текущего элемента расписания
  const currentScheduleItemName = computed(() => {
    return activeItem.value?.identificator ?? timeNotice.value
  })

  // Форматированное оставшееся время
  const formattedRemainingTime = computed(() => {
    if (isPaused.value || !activeItem.value) {
      return timeNotice.value
    }
    const pad = num => num.toString().padStart(2, '0')
    const hours = Math.floor(remainingTime.value / 3600)
    const minutes = Math.floor((remainingTime.value % 3600) / 60)
    const seconds = remainingTime.value % 60
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  })

  // Получаем актуальное состояние таймера с бэка
  const checkIfTimerRunning = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/show_schedule.json`,
        { signal: controller.signal }
      )
      if (!response.data?.timer) return

      schedule.value = response.data.timer.schedule || []
      isPaused.value = !(parseInt(response.data.timer.ticking) > 0)
      presentTime.value = Math.floor(Date.now() / 1000)
      noScheduleInTheBase.value = schedule.value.length === 0
      autoStartNextCycle.value = response.data.timer.auto_start_next_cycle || false

      if (schedule.value.length > 0) {
        range.value = {
          start: schedule.value[0].unix_start,
          finish: schedule.value[schedule.value.length - 1].unix_finish
        }
      }

      checkIfOutOfRange()
      activeItem.value = currentScheduleItem.value
      if (activeItem.value) {
        remainingTime.value = Math.max(0, activeItem.value.unix_finish - presentTime.value)
      }

      // Если включён автоматический режим и таймер на паузе, запускаем его автоматически
      if (autoStartNextCycle.value && isPaused.value && !isOutOfRange.value && activeItem.value) {
        console.log('[Timer] Auto-start mode enabled, starting timer automatically...')
        try {
          await axios.patch(
            `${import.meta.env.VITE_PROXY}/game_parameters/toggle_timer`,
            { request: 1 }
          )
          isPaused.value = false
          startTimers()
        } catch (error) {
          console.error('Ошибка при автоматическом запуске таймера:', error)
        }
      } else {
        isPaused.value ? stopTimers() : startTimers()
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error("Ошибка при проверке состояния таймера:", error)
      }
    }
  }

  // Запуск фонового опроса
  const startPolling = () => {
    if (pollInterval.value) return
    pollInterval.value = setInterval(checkIfTimerRunning, pollTime)
  }

  const stopPolling = () => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
  }

  // Переключение таймера с кнопки
  const toggleTimer = async () => {
    const now = Date.now()
    if (now - lastToggleTime.value < 1000) return
    lastToggleTime.value = now

    try {
      isLoading.value = true
      const requestData = isPaused.value ? 1 : 0
      await axios.patch(
        `${import.meta.env.VITE_PROXY}/game_parameters/toggle_timer`,
        { request: requestData }
      )
      await checkIfTimerRunning()
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Ошибка при переключении таймера:', error)
        isPaused.value = !isPaused.value
      }
    } finally {
      isLoading.value = false
    }
  }

  // Функция остановки таймера и уведомления бэка
  const stopAndNotifyBackend = async () => {
    stopTimers()
    
    // Если включён автоматический запуск следующего цикла
    if (autoStartNextCycle.value) {
      console.log('[Timer] Auto-start next cycle enabled, restarting timer...')
      timeNotice.value = "Автоматический переход к следующему циклу..."
      
      // Перезагружаем расписание с бэка
      await checkIfTimerRunning()
      
      // Если таймер остановлен на бэке, запускаем его
      if (isPaused.value) {
        try {
          await axios.patch(
            `${import.meta.env.VITE_PROXY}/game_parameters/toggle_timer`,
            { request: 1 }
          )
          await checkIfTimerRunning()
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.error("Ошибка при автоматическом запуске таймера:", error)
          }
        }
      }
      return
    }
    
    // Обычный режим - остановка таймера
    isPaused.value = true
    timeNotice.value = "Перерыв"

    try {
      await axios.patch(
        `${import.meta.env.VITE_PROXY}/game_parameters/toggle_timer`,
        { request: 0 }
      )
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error("Ошибка при уведомлении бэка о завершении таймера:", error)
      }
    }
  }

  // Запуск локального тикающего таймера
  const startTimers = () => {
    stopTimers()
    presentTime.value = Math.floor(Date.now() / 1000)
    activeItem.value = currentScheduleItem.value

    if (!activeItem.value) {
      stopAndNotifyBackend()
      return
    }

    remainingTime.value = Math.max(0, activeItem.value.unix_finish - presentTime.value)

    if (remainingTime.value <= 0) {
      stopAndNotifyBackend()
      return
    }

    timerInterval.value = setInterval(async () => {
      presentTime.value = Math.floor(Date.now() / 1000)
      remainingTime.value = Math.max(0, activeItem.value.unix_finish - presentTime.value)

      if (remainingTime.value <= 0) {
        await stopAndNotifyBackend()
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
    stopPolling()
    controller.abort()
  })

  // Инициализация
  checkIfTimerRunning()
  startPolling()

  return {
    isLoading,
    schedule,
    presentTime,
    remainingTime,
    formattedRemainingTime,
    currentScheduleItemName,
    isPaused,
    isOutOfRange,
    outOfRangeMessage,
    noScheduleInTheBase,
    noScheduleInTheBaseMessage,
    autoStartNextCycle,
    fetchSchedule: checkIfTimerRunning,
    stopTimers,
    toggleTimer,
    timeNotice
  }
})



