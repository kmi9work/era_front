import { ref } from 'vue'
import axios from 'axios'

export function useTradeTurnover() {
  const tradeTurnovers = ref([])
  const tradeLevels = ref({})
  const allThresholds = ref({})

  // Загружаем товарообороты
  const fetchTradeTurnovers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/show_trade_turnover.json`)
      tradeTurnovers.value = response.data
      
      // Загружаем уровни торговли
      await fetchTradeLevels()
    } catch (error) {
      console.error('Error fetching trade turnovers:', error)
    }
  }

  // Загружаем текущие уровни торговли для всех стран (bulk)
  const fetchTradeLevels = async () => {
    try {
      const ids = tradeTurnovers.value.map(i => i.country_id)
      if (!ids.length) return
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/trade_levels_and_thresholds.json`, {
        params: { ids: ids.join(',') }
      })
      const items = response.data?.data || []
      items.forEach(({ country_id, level, thresholds }) => {
        if (level) tradeLevels.value[country_id] = level
        if (Array.isArray(thresholds) && thresholds.length > 0) allThresholds.value[country_id] = thresholds
      })
    } catch (error) {
      console.error('Error fetching trade levels (bulk):', error)
    }
  }

  // Форматирование товарооборота
  const formatTurnover = (turnover) => {
    // Если nil, undefined или 0 - возвращаем '0'
    if (turnover == null || turnover === 0 || turnover === '') return '0'
    return turnover.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Получение короткого названия страны (fallback для обратной совместимости)
  const getShortName = (name, shortName) => {
    return shortName || name
  }

  // Вычисление процента прогресса до следующего уровня
  const getProgressPercent = (countryId, tradeTurnover) => {
    const level = tradeLevels.value[countryId]
    const thresholds = allThresholds.value[countryId]
    
    if (!level || !thresholds || thresholds.length === 0) return 0
    
    // Обрабатываем nil/undefined как 0
    const safeTurnover = tradeTurnover || 0
    
    const currentLevel = level.current_level
    const nextThreshold = level.threshold
    
    // Находим порог ТЕКУЩЕГО уровня
    let currentThreshold = 0
    if (currentLevel > 0) {
      const currentLevelData = thresholds.find(t => t.level === currentLevel)
      if (currentLevelData) {
        currentThreshold = currentLevelData.threshold
      }
    }
    
    // Если достигнут максимальный уровень или следующего уровня нет
    if (nextThreshold <= currentThreshold) return 100
    
    // Вычисляем прогресс от текущего уровня до следующего
    const levelRange = nextThreshold - currentThreshold
    const currentProgress = safeTurnover - currentThreshold
    
    if (levelRange <= 0) return 0
    
    const percent = (currentProgress / levelRange) * 100
    
    return Math.min(Math.max(percent, 0), 100)
  }

  // Определение цвета прогресс-бара
  const getProgressColor = (level) => {
    if (!level) return '#808080'
    const currentLevel = level.current_level
    if (currentLevel >= 5) return '#4CAF50' // success green
    if (currentLevel >= 4) return '#2196F3' // primary blue
    if (currentLevel >= 2) return '#FF9800' // warning orange
    return '#00BCD4' // info cyan
  }

  // Получить название текущего уровня
  const getLevelName = (countryId) => {
    const level = tradeLevels.value[countryId]
    const thresholds = allThresholds.value[countryId]
    
    if (!level || !thresholds || thresholds.length === 0) return ''
    
    const currentLevel = level.current_level || 0
    
    // Ищем данные уровня с соответствующим номером
    const levelData = thresholds.find(t => t.level === currentLevel)
    
    return levelData?.name || ''
  }

  return {
    tradeTurnovers,
    tradeLevels,
    allThresholds,
    fetchTradeTurnovers,
    fetchTradeLevels,
    formatTurnover,
    getShortName,
    getProgressPercent,
    getProgressColor,
    getLevelName
  }
}

