import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useTimerStore = defineStore('timer', () => {
  const isLoading = ref(false)
  const timerTicking = ref(0)
  const remainingTime = ref(1)
  const timerFinish = ref(0)
  let timerInterval = null

  ////Вычисляемое свойство для форматированного времени (без дублирования)
  const formattedTime = computed(() => {
    const hours = Math.floor(remainingTime.value / 3600)
    const minutes = Math.floor((remainingTime.value % 3600) / 60)
    const seconds = remainingTime.value % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  async function switchTimer() {
    try {
      isLoading.value = true      
      await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/switch_timer`)   
      await fetchRemainingTime()   
    } catch (error) {
      console.error('Ошибка при переключении таймера:', error)
    } finally {
      isLoading.value = false
    }
  }

  function startTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
    }

    if (timerTicking.value > 0) {
      timerInterval = setInterval(() => {
        if (remainingTime.value > 0 && timerTicking.value > 0) {
          remainingTime.value % 20 == 0? tickTimer() : remainingTime.value -= 1
          //remainingTime.value -= 1
          //tickTimer()
        } else {
          clearInterval(timerInterval)
          timerTicking.value = 0
        }
      }, 1000)
    }
  }

  async function tickTimer(){
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/show_time.json`)
    remainingTime.value = response.data.timer.time
  }

  async function fetchRemainingTime() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/show_time.json`)
      remainingTime.value = response.data.timer.time
      timerTicking.value = response.data.timer.ticking

      if (timerTicking.value > 0) {
        startTimer()
      }
    } catch (error) {
      console.error('Ошибка при получении времени:', error)
    }
  }

  // Инициализация таймера при первом использовании хранилища
  fetchRemainingTime()

  return {
    isLoading,
    timerTicking,
    remainingTime,
    formattedTime,
    switchTimer,
    fetchRemainingTime,
    timerFinish
  }
})