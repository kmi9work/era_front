import { ref } from 'vue'
import axios from 'axios'

export function useChecklists() {
  const checklists = ref([])

  // Загружаем чек-листы вассалитета
  const fetchChecklists = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/vassals_and_robbers/checklists.json`)
      checklists.value = response.data || []
    } catch (error) {
      console.error('Error fetching checklists:', error)
      checklists.value = []
    }
  }

  // Определение цвета прогресс-бара для чек-листов
  const getChecklistProgressColor = (percentage) => {
    if (percentage >= 100) return '#4CAF50' // success green
    if (percentage >= 75) return '#2196F3' // primary blue
    if (percentage >= 50) return '#FF9800' // warning orange
    if (percentage >= 25) return '#FFC107' // amber
    return '#F44336' // error red
  }

  return {
    checklists,
    fetchChecklists,
    getChecklistProgressColor
  }
}

