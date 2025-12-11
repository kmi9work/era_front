import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useProductionStore = defineStore('production', () => {
  // State
  const plantLevelsInfo = ref([]) // Информация о всех предприятиях
  const selectedPlantTypeIndex = ref(null)
  const selectedPlantLevelIndex = ref(null)
  const calculationMode = ref('from') // 'from' или 'to'
  const inputResources = ref([])
  const result = ref({ from: [], to: [], change: [] })
  const isLoading = ref(false)

  // Computed
  const uniquePlantTypes = computed(() => {
    return [...new Set(plantLevelsInfo.value.map(plant => plant.name))]
  })

  const filteredPlantsByType = computed(() => {
    if (selectedPlantTypeIndex.value === null) return []
    const selectedType = uniquePlantTypes.value[selectedPlantTypeIndex.value]
    return plantLevelsInfo.value.filter(plant => plant.name === selectedType)
  })

  const selectedPlantId = computed(() => {
    if (selectedPlantLevelIndex.value === null) return null
    return filteredPlantsByType.value[selectedPlantLevelIndex.value]?.id || null
  })

  const selectedPlantLevel = computed(() => {
    return plantLevelsInfo.value.find(p => p.id === selectedPlantId.value)
  })

  const availableResources = computed(() => {
    if (!selectedPlantLevel.value) return []
    
    if (calculationMode.value === 'from') {
      return selectedPlantLevel.value.formula_from || []
    } else {
      return selectedPlantLevel.value.formula_to || []
    }
  })

  const resultDisplay = computed(() => {
    if (calculationMode.value === 'from') {
      return result.value.to.filter(r => r.count > 0)
    } else {
      return result.value.from.filter(r => r.count > 0)
    }
  })

  const changeDisplay = computed(() => {
    return result.value.change.filter(r => r.count !== 0)
  })

  /**
   * Получить предприятие по ID
   * @param {number} plantLevelId - ID предприятия
   * @returns {Object|undefined}
   */
  function getPlantLevelById(plantLevelId) {
    return plantLevelsInfo.value.find(p => p.id === plantLevelId)
  }

  /**
   * Установить данные о предприятиях
   * @param {Array} newPlantLevels - Массив предприятий
   */
  function setPlantLevels(newPlantLevels) {
    plantLevelsInfo.value = newPlantLevels
  }

  /**
   * Проверяет, не превышает ли количество хоть одного ресурса во втором массиве
   * количество такого же ресурса в первом.
   * @param {Array} resArray1 - Первый массив ресурсов
   * @param {Array} resArray2 - Второй массив ресурсов
   * @returns {boolean}
   */
  function isResArrayLess(resArray1, resArray2) {
    for (const res1 of resArray1) {
      const var2 = resArray2.find(res2 => res1.identificator === res2.identificator)
      if (!var2) return false
      if (res1.count > var2.count) return false
    }
    return true
  }

  /**
   * Умножает массив ресурсов на число
   * @param {Array} resArray - Массив ресурсов
   * @param {number} n - Множитель
   * @param {Object} plantLevel - Объект предприятия
   * @returns {Array}
   */
  function resArrayMult(resArray, n, plantLevel) {
    return resArray.map(res => ({
      ...res,
      count: res.count * n,
      name: res.name || lookUpRes(res.identificator, plantLevel)
    }))
  }

  /**
   * Складывает два массива ресурсов (модифицирует array1 in-place)
   * @param {Array} array1 - Первый массив (будет изменен)
   * @param {Array} array2 - Второй массив
   * @param {number} sign - Знак (+1 или -1)
   * @returns {Array}
   */
  function resArraySum(array1, array2, sign = 1) {
    const arr2Copy = JSON.parse(JSON.stringify(array2))
    
    // Проходим по array1 и добавляем/вычитаем совпадающие элементы из arr2Copy
    for (const res1 of array1) {
      for (let i = arr2Copy.length - 1; i >= 0; i--) {
        if (res1.identificator === arr2Copy[i].identificator) {
          res1.count += arr2Copy[i].count * sign
          arr2Copy.splice(i, 1)
        }
      }
    }
    
    // Добавляем оставшиеся элементы из arr2Copy в array1
    for (const res of arr2Copy) {
      array1.push({...res, count: res.count * sign})
    }
    
    return array1
  }

  /**
   * Поиск имени ресурса
   * @param {string} identificator - Идентификатор ресурса
   * @param {Object} plantLevel - Объект предприятия
   * @returns {string}
   */
  function lookUpRes(identificator, plantLevel) {
    // Ищем в formula_from
    const fromRes = plantLevel.formula_from?.find(r => r.identificator === identificator)
    if (fromRes) return fromRes.name
    
    // Ищем в formula_to
    const toRes = plantLevel.formula_to?.find(r => r.identificator === identificator)
    if (toRes) return toRes.name
    
    return identificator
  }

  /**
   * Основная функция подсчета для одной формулы
   * @param {Object} formula - Формула производства
   * @param {Array} request - Запрос на ресурсы
   * @param {string} way - Направление ('from' или 'to')
   * @param {Object} plantLevel - Объект предприятия
   * @returns {Object} {from, to}
   */
  function countRequest(formula, request, way, plantLevel) {
    let n = 0
    let bucket = JSON.parse(JSON.stringify(formula[way])) // deep copy
    const formulaPart = formula[way]

    while (
      isResArrayLess(bucket, request) && 
      isResArrayLess(resArrayMult(formula.to, n + 1, plantLevel), formula.max_product)
    ) {
      bucket = resArraySum(bucket, JSON.parse(JSON.stringify(formulaPart)))
      n += 1
    }

    const to = resArrayMult(formula.to, n, plantLevel)
    const from = resArrayMult(formula.from, n, plantLevel)

    return { from, to }
  }

  /**
   * Главная функция расчета производства (вариант с объектом plantLevel)
   * @param {Object} plantLevel - Объект предприятия
   * @param {Array} request - Запрос на ресурсы [{identificator, count}]
   * @param {string} way - Направление ('from' - из ресурсов, 'to' - сколько надо)
   * @returns {Object} {from, to, change}
   */
  function feedToPlantDirect(plantLevel, request, way = 'from') {
    const coof = plantLevel.tech_schools_open ? 1.5 : 1

    const requestCopy = request.map(req => ({
      identificator: req.identificator.toString(),
      count: way === 'to' ? Math.ceil(parseInt(req.count || 0) / coof) : parseInt(req.count || 0),
      name: lookUpRes(req.identificator, plantLevel)
    }))

    let resultingFrom = []
    let resultingTo = []

    // Проходим по всем формулам
    plantLevel.formulas.forEach(formula => {
      const { from, to } = countRequest(formula, requestCopy, way, plantLevel)
      
      // Вычитаем использованные ресурсы из request
      if (way === 'from') {
        resArraySum(requestCopy, from, -1)
      } else {
        resArraySum(requestCopy, to, -1)
      }

      resArraySum(resultingFrom, from)
      resArraySum(resultingTo, to)
    })

    // Применяем коэффициент к результату
    resultingTo.forEach(res => {
      res.count = res.count * coof
    })

    return {
      from: resultingFrom,
      to: resultingTo,
      change: requestCopy
    }
  }

  /**
   * Главная функция расчета производства (вариант с ID)
   * @param {number} plantLevelId - ID предприятия
   * @param {Array} request - Запрос на ресурсы [{identificator, count}]
   * @param {string} way - Направление ('from' - из ресурсов, 'to' - сколько надо)
   * @returns {Object} {from, to, change}
   */
  function feedToPlant(plantLevelId, request, way = 'from') {
    // Находим предприятие
    const plantLevel = plantLevelsInfo.value.find(p => p.id === plantLevelId)
    if (!plantLevel) {
      throw new Error(`PlantLevel with id ${plantLevelId} not found`)
    }

    return feedToPlantDirect(plantLevel, request, way)
  }

  /**
   * Получить отфильтрованные предприятия по типу
   * @param {string} plantType - Тип предприятия
   * @returns {Array}
   */
  function getPlantsByType(plantType) {
    return plantLevelsInfo.value.filter(plant => plant.name === plantType)
  }

  /**
   * Загрузить данные о предприятиях с сервера
   */
  async function fetchPlantLevels() {
    isLoading.value = true
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/plant_levels/prod_info_full.json`)
      plantLevelsInfo.value = response.data
    } catch (error) {
      console.error('Error fetching plant levels:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Инициализировать массив входных ресурсов
   */
  function initializeInputResources() {
    if (!selectedPlantLevel.value) return
    
    inputResources.value = availableResources.value.map(res => ({
      identificator: res.identificator,
      name: res.name,
      count: 0
    }))
  }

  /**
   * Рассчитать производство на основе введенных ресурсов
   */
  function calculateProduction() {
    if (!selectedPlantLevel.value) {
      throw new Error('Предприятие не выбрано')
    }
    
    const hasInput = inputResources.value.some(res => res.count > 0)
    if (!hasInput) {
      throw new Error('Введите количество ресурсов')
    }

    result.value = feedToPlantDirect(
      selectedPlantLevel.value, 
      inputResources.value, 
      calculationMode.value
    )

    return result.value
  }

  /**
   * Очистить все введенные данные и результаты
   */
  function clearProduction() {
    inputResources.value.forEach(res => res.count = 0)
    result.value = { from: [], to: [], change: [] }
  }

  /**
   * Установить количество ресурса по индексу
   * @param {number} index - Индекс ресурса в массиве inputResources
   * @param {number} count - Новое количество
   */
  function setResourceCount(index, count) {
    if (inputResources.value[index]) {
      inputResources.value[index].count = count
    }
  }

  /**
   * Сбросить выбор предприятия и все данные
   */
  function resetSelection() {
    selectedPlantTypeIndex.value = null
    selectedPlantLevelIndex.value = null
    inputResources.value = []
    result.value = { from: [], to: [], change: [] }
  }

  return {
    // State
    plantLevelsInfo,
    selectedPlantTypeIndex,
    selectedPlantLevelIndex,
    calculationMode,
    inputResources,
    result,
    isLoading,

    // Computed
    uniquePlantTypes,
    filteredPlantsByType,
    selectedPlantId,
    selectedPlantLevel,
    availableResources,
    resultDisplay,
    changeDisplay,

    // Getters
    getPlantLevelById,

    // Actions
    setPlantLevels,
    fetchPlantLevels,
    initializeInputResources,
    calculateProduction,
    clearProduction,
    setResourceCount,
    resetSelection,
    feedToPlant,
    getPlantsByType,
    
    // Helper functions
    isResArrayLess,
    resArrayMult,
    resArraySum,
    lookUpRes
  }
})
