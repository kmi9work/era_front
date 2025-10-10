import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCaravanStore = defineStore('caravan', () => {
  // State
  const resources = ref([]) // Все ресурсы с ценами
  const countries = ref([]) // Все страны

  // Getters
  const getResourceByIdentificator = computed(() => {
    return (identificator) => {
      return resources.value.find(r => r.identificator === identificator)
    }
  })

  const getCountryById = computed(() => {
    return (countryId) => {
      return countries.value.find(c => c.id === countryId)
    }
  })

  // Actions
  function setResources(newResources) {
    resources.value = newResources
  }

  function setCountries(newCountries) {
    countries.value = newCountries
  }

  /**
   * Фильтрует ресурсы по стране (оставляет только те, что принимает данная страна)
   * @param {number} countryId - ID страны
   * @param {Array} resourcesList - Массив ресурсов [{identificator, count, ...}]
   * @returns {Array} Отфильтрованный массив ресурсов
   */
  function countryFilter(countryId, resourcesList) {
    if (!countryId || !resourcesList || !Array.isArray(resourcesList)) {
      return []
    }

    // Получаем все ресурсы, которые принимает эта страна
    // Ресурс может иметь country_id или country.id
    const countryResources = resources.value.filter(r => 
      r.country_id === countryId || r.country?.id === countryId
    )
    const countryIdentificators = countryResources.map(r => r.identificator)

    // Фильтруем входящий список
    return resourcesList.filter(res => 
      countryIdentificators.includes(res.identificator)
    )
  }

  /**
   * Вычисляет стоимость транзакции
   * @param {string} transactionType - 'buy' (игрок продает) или 'sale' (игрок покупает)
   * @param {number} amount - Количество ресурса
   * @param {Object} resource - Объект ресурса с ценами
   * @returns {Object} {identificator, count, cost, embargo}
   */
  function calculateCost(transactionType, amount, resource) {
    // Определяем ID страны (может быть country_id или country.id)
    const countryId = resource.country_id || resource.country?.id
    
    if (!resource || !countryId) {
      return { 
        identificator: resource?.identificator, 
        count: amount, 
        cost: null, 
        embargo: 0 
      }
    }

    const country = getCountryById.value(countryId)
    if (!country) {
      return { 
        identificator: resource.identificator, 
        count: amount, 
        cost: null, 
        embargo: 0 
      }
    }

    const relations = country.relations?.toString() || '0'
    
    // Определяем, какое поле с ценой использовать
    // Для 'buy' (игрок продает) используем sell_price
    // Для 'sale' (игрок покупает) используем buy_price
    let unitCost
    if (transactionType === 'buy') {
      // Игрок продает рынку - ищем sell_price
      unitCost = resource.params?.buy_price?.[relations] || resource.sell_price
    } else {
      // Игрок покупает с рынка - ищем buy_price
      unitCost = resource.params?.sale_price?.[relations] || resource.buy_price
    }

    if (unitCost !== undefined && unitCost !== null) {
      return {
        identificator: resource.identificator,
        count: amount,
        cost: unitCost * parseInt(amount),
        embargo: country.params?.embargo || 0
      }
    }

    return {
      identificator: resource.identificator,
      count: amount,
      cost: null,
      embargo: country.params?.embargo || 0
    }
  }

  /**
   * Основная функция расчета караванов (аналог send_caravan на бэкенде)
   * @param {number} countryId - ID страны
   * @param {Array} resPlSells - Ресурсы, которые игрок продает [{identificator, count, name}]
   * @param {Array} resPlBuys - Ресурсы, которые игрок покупает [{identificator, count, name}]
   * @returns {Object} {res_to_player: [...]}
   */
  function sendCaravan(countryId, resPlSells = [], resPlBuys = []) {
    // Валидация
    if (!countryId) {
      throw new Error('country_id is required')
    }
    if (!Array.isArray(resPlSells)) {
      throw new Error('res_pl_sells must be an array')
    }
    if (!Array.isArray(resPlBuys)) {
      throw new Error('res_pl_buys must be an array')
    }

    // Извлекаем золото из ресурсов, которые игрок продает
    const goldItem = resPlSells.find(d => d.identificator === 'gold')
    let gold = goldItem?.count || 0

    // Обрабатываем ресурсы, которые игрок продает рынку
    const eligibleSellResources = countryFilter(countryId, resPlSells)
    
    eligibleSellResources.forEach(res => {
      if (res.identificator === 'gold') return // Пропускаем золото
      if (!res.count || res.count <= 0) return // Пропускаем пустые значения

      const resourceObj = resources.value.find(r => 
        r.identificator === res.identificator && 
        (r.country_id === countryId || r.country?.id === countryId)
      )
      if (!resourceObj) return // Пропускаем несуществующие ресурсы

      const costResult = calculateCost('buy', res.count, resourceObj)
      if (costResult.cost) {
        gold += costResult.cost
      }
    })

    // Обрабатываем ресурсы, которые игрок покупает с рынка
    const resToPlayer = []
    const eligibleBuyResources = countryFilter(countryId, resPlBuys)

    eligibleBuyResources.forEach(res => {
      if (!res.count || res.count <= 0) return // Пропускаем пустые значения

      const resourceObj = resources.value.find(r => 
        r.identificator === res.identificator && 
        (r.country_id === countryId || r.country?.id === countryId)
      )
      if (!resourceObj) return // Пропускаем несуществующие ресурсы

      const costResult = calculateCost('sale', res.count, resourceObj)
      if (!costResult.cost) return // Пропускаем ресурсы, которые нельзя купить

      gold -= costResult.cost
      resToPlayer.push({
        name: resourceObj.name,
        identificator: resourceObj.identificator,
        count: parseInt(costResult.count)
      })
    })

    // Добавляем итоговое золото к результату
    const goldAsRes = resources.value.find(r => r.identificator === 'gold')
    if (gold !== 0) {
      resToPlayer.push({
        name: goldAsRes?.name || 'Золото',
        identificator: 'gold',
        count: gold
      })
    }

    return { res_to_player: resToPlayer }
  }

  return {
    // State
    resources,
    countries,
    
    // Getters
    getResourceByIdentificator,
    getCountryById,
    
    // Actions
    setResources,
    setCountries,
    countryFilter,
    calculateCost,
    sendCaravan
  }
})

