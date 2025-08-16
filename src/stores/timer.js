
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
  const isPaused = ref(false)
  const range = ref({ start: 0, finish: 0 }) // Добавлено отсутствующее объявление
  const controller = new AbortController() // Для отмены запросов
  const pollTime = 5000
  const isTimerRunning = ref(false)

  const checkIfTimerRunning = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/show_schedule.json`
      );
      
      // Проверка структуры ответа
      if (response.data?.timer?.ticking !== undefined) {
        isPaused.value.value = !Number(response.data.timer.ticking) > 0;
      }
      
      console.error('Неверная структура ответа:', response.data);
      return false;
      
    } catch (error) {
      console.error('Ошибка при проверке таймера:', error);
      return false;
    }
};



  const isOutOfRange = ref(false)
  const outOfRangeMessage = ref("Эпоха Перемен")
  const noScheduleInTheBase = ref(false)
  const noScheduleInTheBaseMessage = ref("В базе нет расписания")
  const lastToggleTime = ref(0) // Защита от частых переключений

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

  // Название текущего элемента расписания
  const currentScheduleItemName = computed(() => {
    return currentScheduleItem.value?.identificator ?? timeNotice.value
  })

  // Форматированное оставшееся время
  const formattedRemainingTime = computed(() => {
    if (isPaused.value || !currentScheduleItem.value) {
      return timeNotice.value
    }

    const pad = num => num.toString().padStart(2, '0')
    const hours = Math.floor(remainingTime.value / 3600)
    const minutes = Math.floor((remainingTime.value % 3600) / 60)
    const seconds = remainingTime.value % 60

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  })

  // Переключение состояния таймера
  const toggleTimer = async () => {
    const now = Date.now()
    if (now - lastToggleTime.value < 1000) return // Защита от спама
    lastToggleTime.value = now

    try {
      isLoading.value = true
      await axios.patch(
        `${import.meta.env.VITE_PROXY}/game_parameters/toggle_timer`,
        null,
        { signal: controller.signal }
      )

      await fetchSchedule()
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Ошибка при переключении таймера:', error)
        isPaused.value = !isPaused.value
      }
    } finally {
      isLoading.value = false
    }
  }

  // Загрузка расписания
  const fetchSchedule = async () => {
    try {
      isLoading.value = true
      const response = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/show_schedule.json`,
        { signal: controller.signal }
      )

      if (!response.data?.timer) {
        throw new Error('Неверный формат ответа сервера')
      }

      schedule.value = response.data.timer.schedule || []
      isPaused.value = !(parseInt(response.data.timer.ticking) > 0)
      presentTime.value = Math.floor(Date.now() / 1000)
      noScheduleInTheBase.value = schedule.value.length === 0

      if (schedule.value.length > 0) {
        range.value = {
          start: schedule.value[0].unix_start,
          finish: schedule.value[schedule.value.length - 1].unix_finish
        }
      }

      checkIfOutOfRange()

      if (currentScheduleItem.value) {
        remainingTime.value = Math.max(0, currentScheduleItem.value.unix_finish - presentTime.value)
      }

      isPaused.value ? stopTimers() : startTimers()
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Ошибка при получении расписания:', error)
        noScheduleInTheBase.value = true
      }
    } finally {
      isLoading.value = false
    }
  }

  // Запуск таймеров
  const startTimers = () => {
    stopTimers()

    const now = Math.floor(Date.now() / 1000)
    presentTime.value = now

    if (!currentScheduleItem.value) {
      isPaused.value = true
      return
    }

    remainingTime.value = Math.max(0, currentScheduleItem.value.unix_finish - now)

    if (remainingTime.value <= 0) {
      isPaused.value = true
      return
    }

    timerInterval.value = setInterval(async () => {
      const now = Math.floor(Date.now() / 1000)
      presentTime.value = now
      remainingTime.value = Math.max(0, currentScheduleItem.value.unix_finish - now)

      if (remainingTime.value <= 0) {
        try {
          await axios.patch(
            `${import.meta.env.VITE_PROXY}/game_parameters/toggle_timer`,
            null,
            { signal: controller.signal }
          )
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.error('Ошибка при остановке таймера:', error)
          }
        } finally {
          isPaused.value = true
          stopTimers()
        }
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

  // Очистка при демонтировании
  onUnmounted(() => {
    stopTimers()
    controller.abort()
  })

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
    isOutOfRange,
    outOfRangeMessage,
    noScheduleInTheBase,
    noScheduleInTheBaseMessage,
    fetchSchedule,
    stopTimers,
    toggleTimer,
    timeNotice
  }
})