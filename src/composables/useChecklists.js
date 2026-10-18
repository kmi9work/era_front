import { ref } from 'vue'
import axios from 'axios'

/**
 * Чек-листы вассалитета (ТЗ № 2, § 7.1).
 *
 * Сюзерен — текущее государство: чек-листы загружаются с его country_id,
 * кеш сбрасывается при смене государства.
 */
export function useChecklists() {
  const checklists = ref([])
  const loadedCountryId = ref(null)

  // Загружаем чек-листы вассалитета текущего государства (сюзерен — оно)
  const fetchChecklists = async (countryId = null) => {
    const id = countryId ?? loadedCountryId.value
    try {
      const query = id ? `?country_id=${id}` : ''
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/vassals_and_robbers/checklists.json${query}`)
      checklists.value = response.data || []
      loadedCountryId.value = id
    } catch (error) {
      console.error('Error fetching checklists:', error)
      checklists.value = []
    }
    return checklists.value
  }

  // Сброс кеша — при смене государства данные перечитываются
  const resetChecklistsCache = () => {
    checklists.value = []
    loadedCountryId.value = null
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
    loadedCountryId,
    fetchChecklists,
    resetChecklistsCache,
    getChecklistProgressColor
  }
}
