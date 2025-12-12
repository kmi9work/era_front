<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useTheme } from 'vuetify'
import { hexToRgb } from '@layouts/utils'

const vuetifyTheme = useTheme()

const loading = ref(false)
const errorMessage = ref('')
const audits = ref([])
const resources = ref([])
const caravans = ref([])
const selectedGuildForChart = ref('all')

// Маппинг identificator -> русское название
const resourceNames = computed(() => {
  const map = new Map()
  resources.value.forEach(resource => {
    if (resource.identificator && resource.name) {
      map.set(resource.identificator, resource.name)
    }
  })
  // Добавляем золото, если его нет в ресурсах
  if (!map.has('gold')) {
    map.set('gold', 'Золото')
  }
  return map
})

// URL для загрузки изображений ресурсов
const getResourceImageUrl = (identificator) => {
  if (!identificator) {
    identificator = 'unknown'
  }
  return `/images/resources/${identificator}.png`
}

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

// Фильтруем только предприятия, принадлежащие гильдиям
const plantAudits = computed(() => {
  return audits.value.filter(audit => 
    audit.auditable_type === 'Plant' && 
    (audit.economic_subject_type === 'Guild' || audit.guild_name)
  )
})

function parseActionDate(audit, offsetsByYear) {
  if (audit.created_at) {
    const realDate = new Date(audit.created_at)

    if (!Number.isNaN(realDate.getTime())) {
      return {
        date: realDate,
        year: realDate.getUTCFullYear(),
        hasPreciseDate: true,
      }
    }
  }

  const fallbackYear = audit.year || new Date().getUTCFullYear()
  const offset = offsetsByYear.get(fallbackYear) || 0
  const pseudoDate = new Date(Date.UTC(fallbackYear, 0, 1, offset * 3))

  offsetsByYear.set(fallbackYear, offset + 1)

  return {
    date: pseudoDate,
    year: fallbackYear,
    hasPreciseDate: false,
  }
}

function formatCost(cost) {
  if (!cost || typeof cost !== 'object') {
    return '—'
  }

  const parts = []
  
  // Золото
  if (cost.gold) {
    parts.push(`${cost.gold} золота`)
  }
  
  // Ресурсы
  const resources = Object.entries(cost)
    .filter(([key]) => key !== 'gold')
    .map(([key, value]) => `${value} ${key}`)
  
  if (resources.length > 0) {
    parts.push(...resources)
  }

  return parts.length > 0 ? parts.join(', ') : '—'
}

function calculateTotalCost(cost) {
  if (!cost || typeof cost !== 'object') {
    return { gold: 0, resources: {} }
  }

  const gold = cost.gold || 0
  const resources = { ...cost }
  delete resources.gold

  return { gold, resources }
}

const enrichedAudits = computed(() => {
  const offsetsByYear = new Map()

  return plantAudits.value
    .map((audit, index) => {
      const { date, year, hasPreciseDate } = parseActionDate(audit, offsetsByYear)
      // Используем данные из audit (которые уже обработаны в JSON builder)
      const guildName = audit.guild_name || 'Неизвестная гильдия'
      const plantTypeName = audit.plant_type_name || 'Неизвестный тип'
      const plantLevel = audit.plant_level_level || null
      const action = audit.action
      // Для upgrade используем new_cost, для create/destroy - cost
      const cost = (action === 'update' && audit.new_cost) ? audit.new_cost : (audit.cost || {})
      const gameYear = audit.year || year
      const timeLabel = hasPreciseDate ? timeFormatter.format(date) : '—'

      // Для upgrade определяем старый и новый уровень
      let oldLevel = null
      let newLevel = plantLevel
      let oldCost = null
      let newCost = cost
      let displayCost = cost
      let maxProducts = audit.max_products || []
      let oldMaxProducts = []
      let newMaxProducts = []

      if (action === 'update' && audit.old_plant_level_level !== undefined) {
        oldLevel = audit.old_plant_level_level
        newLevel = audit.new_plant_level_level || plantLevel
        oldCost = audit.old_cost || {}
        newCost = audit.new_cost || cost
        // Для upgrade показываем стоимость нового уровня
        displayCost = newCost
        oldMaxProducts = audit.old_max_products || []
        newMaxProducts = audit.new_max_products || audit.max_products || []
      } else {
        // Для create используем max_products напрямую
        maxProducts = audit.max_products || []
      }

      return {
        id: audit.id || index,
        auditableId: audit.auditable_plant_id || audit.auditable_id || null,
        date: date.getTime(),
        timeLabel,
        hasPreciseDate,
        year,
        gameYear,
        guildName,
        plantTypeName,
        plantLevel,
        oldLevel,
        newLevel,
        action,
        cost,
        oldCost,
        newCost,
        displayCost,
        formattedCost: formatCost(displayCost),
        totalCost: calculateTotalCost(displayCost),
        maxProducts,
        oldMaxProducts,
        newMaxProducts,
      }
    })
    .sort((a, b) => a.date - b.date)
})

const guildNames = computed(() => {
  const names = new Set(enrichedAudits.value.map(audit => audit.guildName))
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'ru'))
})

const guildOptions = computed(() => {
  const allOption = {
    label: 'Все гильдии',
    value: 'all',
  }

  const guildOptionsList = guildNames.value.map(guildName => ({
    label: guildName,
    value: guildName,
  }))

  return [allOption, ...guildOptionsList]
})

// Фильтрация аудитов по выбранной гильдии для второго графика
const filteredAuditsForChart = computed(() => {
  if (selectedGuildForChart.value === 'all') {
    return enrichedAudits.value
  }
  return enrichedAudits.value.filter(audit => audit.guildName === selectedGuildForChart.value)
})

// Данные для графика уровней предприятий по типам
const plantLevelsChartData = computed(() => {
  // Сортируем аудиты по дате
  const sortedAudits = [...filteredAuditsForChart.value].sort((a, b) => {
    if (a.gameYear !== b.gameYear) {
      return a.gameYear - b.gameYear
    }
    return a.date - b.date
  })

  const allPlantTypes = new Set()
  const allYears = new Set()
  
  // Собираем все типы и годы
  sortedAudits.forEach(audit => {
    if (audit.plantTypeName) {
      allPlantTypes.add(audit.plantTypeName)
    }
    allYears.add(audit.gameYear)
  })

  const sortedYears = Array.from(allYears).sort((a, b) => a - b)
  
  // Для каждого года вычисляем суммарный уровень предприятий каждого типа
  // Используем накопительный подход: отслеживаем состояние предприятий
  const yearLevels = new Map()
  
  // Храним текущее состояние предприятий: Map<auditableId, {type, level}>
  // Используем auditableId для отслеживания одного и того же предприятия
  const currentPlants = new Map()
  
  sortedYears.forEach(year => {
    // Получаем все события этого года
    const yearAudits = sortedAudits.filter(a => a.gameYear === year)
    
    // Обрабатываем события года
    yearAudits.forEach(audit => {
      // Используем auditableId для идентификации предприятия, или id аудита как fallback
      const plantKey = audit.auditableId || `audit_${audit.id}`
      const plantType = audit.plantTypeName
      
      if (!plantType) return
      
      if (audit.action === 'create') {
        const level = audit.newLevel || audit.plantLevel || 0
        currentPlants.set(plantKey, { type: plantType, level: level })
      } else if (audit.action === 'update' && audit.oldLevel !== null) {
        // Обновляем уровень существующего предприятия
        const existing = currentPlants.get(plantKey)
        if (existing) {
          existing.level = audit.newLevel || audit.plantLevel || 0
        } else {
          // Если предприятие не найдено, создаем его (на случай, если create был в другом году)
          const level = audit.newLevel || audit.plantLevel || 0
          currentPlants.set(plantKey, { type: plantType, level: level })
        }
      } else if (audit.action === 'destroy') {
        currentPlants.delete(plantKey)
      }
    })
    
    // Вычисляем суммарные уровни по типам на конец года
    const typeLevels = new Map()
    currentPlants.forEach(plant => {
      if (!typeLevels.has(plant.type)) {
        typeLevels.set(plant.type, 0)
      }
      typeLevels.set(plant.type, typeLevels.get(plant.type) + plant.level)
    })
    
    yearLevels.set(year, typeLevels)
  })
  
  // Формируем series для графика
  const series = Array.from(allPlantTypes).map(plantType => {
    const data = sortedYears.map(year => {
      const typeLevels = yearLevels.get(year)
      return typeLevels?.get(plantType) || 0
    })
    
    return {
      name: plantType,
      data: data,
    }
  })

  return {
    categories: sortedYears,
    series: series,
  }
})

// Данные для графика максимальной производительности
const maxProductionChartData = computed(() => {
  // Сортируем аудиты по дате
  const sortedAudits = [...enrichedAudits.value].sort((a, b) => {
    if (a.gameYear !== b.gameYear) {
      return a.gameYear - b.gameYear
    }
    return a.date - b.date
  })

  const allYears = new Set()
  const allResources = new Set()
  
  // Собираем все годы
  sortedAudits.forEach(audit => {
    allYears.add(audit.gameYear)
  })

  const sortedYears = Array.from(allYears).sort((a, b) => a - b)
  
  // Для каждого года вычисляем суммарную максимальную производительность по ресурсам
  const yearProduction = new Map()
  
  // Храним текущее состояние предприятий: Map<auditableId, {maxProducts}>
  const currentPlants = new Map()
  
  sortedYears.forEach(year => {
    // Получаем все события этого года
    const yearAudits = sortedAudits.filter(a => a.gameYear === year)
    
    // Обрабатываем события года
    yearAudits.forEach(audit => {
      const plantKey = audit.auditableId || `audit_${audit.id}`
      
      if (audit.action === 'create') {
        // При создании добавляем предприятие с его max_products
        const maxProducts = audit.maxProducts || []
        currentPlants.set(plantKey, { maxProducts: maxProducts })
        
        // Собираем все ресурсы
        maxProducts.forEach(product => {
          if (product.identificator) {
            allResources.add(product.identificator)
          }
        })
      } else if (audit.action === 'update' && audit.oldLevel !== null) {
        // При улучшении обновляем max_products
        const existing = currentPlants.get(plantKey)
        if (existing) {
          existing.maxProducts = audit.newMaxProducts || audit.maxProducts || []
        } else {
          // Если предприятие не найдено, создаем его
          const maxProducts = audit.newMaxProducts || audit.maxProducts || []
          currentPlants.set(plantKey, { maxProducts: maxProducts })
        }
        
        // Собираем все ресурсы
        const maxProducts = audit.newMaxProducts || audit.maxProducts || []
        maxProducts.forEach(product => {
          if (product.identificator) {
            allResources.add(product.identificator)
          }
        })
      } else if (audit.action === 'destroy') {
        currentPlants.delete(plantKey)
      }
    })
    
    // Вычисляем суммарную максимальную производительность по ресурсам на конец года
    const resourceProduction = new Map()
    currentPlants.forEach(plant => {
      plant.maxProducts.forEach(product => {
        if (product.identificator && product.count) {
          const currentValue = resourceProduction.get(product.identificator) || 0
          resourceProduction.set(product.identificator, currentValue + product.count)
        }
      })
    })
    
    yearProduction.set(year, resourceProduction)
  })
  
  // Формируем series для графика
  const series = Array.from(allResources).map(resourceId => {
    const data = sortedYears.map(year => {
      const resourceProduction = yearProduction.get(year)
      return resourceProduction?.get(resourceId) || 0
    })
    
    // Используем русское название из маппинга
    const resourceName = resourceNames.value.get(resourceId) || resourceId
    
    return {
      name: resourceName,
      data: data,
    }
  })

  return {
    categories: sortedYears,
    series: series,
  }
})

// Настройки графика максимальной производительности
const maxProductionChartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledColor = `rgba(${ hexToRgb(currentTheme['on-surface']) },${ variableTheme['disabled-opacity'] })`
  const borderColor = `rgba(${ hexToRgb(String(variableTheme['border-color'])) },${ variableTheme['border-opacity'] })`
  
  // Генерируем цвета для линий
  const colors = [
    currentTheme.primary,
    currentTheme.success,
    currentTheme.error,
    currentTheme.warning,
    currentTheme.info,
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#9B59B6',
    '#E74C3C',
    '#3498DB',
  ]

  return {
    chart: {
      type: 'line',
      parentHeightOffset: 0,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    colors: colors,
    markers: {
      size: 4,
      hover: { size: 6 },
    },
    grid: {
      borderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
      padding: {
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
      },
    },
    xaxis: {
      categories: maxProductionChartData.value.categories,
      title: {
        text: 'Год',
        style: {
          color: disabledColor,
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: disabledColor,
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Максимальная производительность',
        style: {
          color: disabledColor,
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: disabledColor,
          fontSize: '12px',
        },
        formatter: (value) => {
          if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
          }
          return value.toLocaleString('ru-RU')
        },
      },
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '12px',
      fontFamily: 'inherit',
      fontWeight: 500,
      labels: {
        colors: disabledColor,
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: (value) => {
          return value !== null && value !== undefined ? value.toLocaleString('ru-RU') : '—'
        },
      },
    },
  }
})

// Настройки графика уровней предприятий
const plantLevelsChartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledColor = `rgba(${ hexToRgb(currentTheme['on-surface']) },${ variableTheme['disabled-opacity'] })`
  const borderColor = `rgba(${ hexToRgb(String(variableTheme['border-color'])) },${ variableTheme['border-opacity'] })`
  
  // Генерируем цвета для линий
  const colors = [
    currentTheme.primary,
    currentTheme.success,
    currentTheme.error,
    currentTheme.warning,
    currentTheme.info,
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#9B59B6',
    '#E74C3C',
    '#3498DB',
  ]

  return {
    chart: {
      type: 'line',
      parentHeightOffset: 0,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    colors: colors,
    markers: {
      size: 4,
      hover: { size: 6 },
    },
    grid: {
      borderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
      padding: {
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
      },
    },
    xaxis: {
      categories: plantLevelsChartData.value.categories,
      title: {
        text: 'Год',
        style: {
          color: disabledColor,
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: disabledColor,
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Суммарный уровень',
        style: {
          color: disabledColor,
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: disabledColor,
          fontSize: '12px',
        },
        formatter: (value) => {
          return value.toLocaleString('ru-RU')
        },
      },
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '12px',
      fontFamily: 'inherit',
      fontWeight: 500,
      labels: {
        colors: disabledColor,
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: (value) => {
          return value !== null && value !== undefined ? value.toLocaleString('ru-RU') : '—'
        },
      },
    },
  }
})

const timelineColumns = computed(() => {
  const columns = new Map()

  enrichedAudits.value.forEach(audit => {
    if (!columns.has(audit.date)) {
      columns.set(audit.date, {
        timestamp: audit.date,
        timeLabel: audit.timeLabel,
        gameYear: audit.gameYear,
      })
    }
  })

  return Array.from(columns.values()).sort((a, b) => a.timestamp - b.timestamp)
})

const enterpriseMatrix = computed(() => {
  const matrix = new Map()

  enrichedAudits.value.forEach(audit => {
    if (!matrix.has(audit.guildName)) {
      matrix.set(audit.guildName, new Map())
    }

    const row = matrix.get(audit.guildName)

    if (!row.has(audit.date)) {
      row.set(audit.date, [])
    }

    row.get(audit.date).push(audit)
  })

  return matrix
})

// Подсчет суммарных затрат по гильдиям за каждый год (для таблицы)
const yearlyCosts = computed(() => {
  const costs = new Map()

  enrichedAudits.value.forEach(audit => {
    const key = `${audit.guildName}_${audit.gameYear}`
    
    if (!costs.has(key)) {
      costs.set(key, {
        guildName: audit.guildName,
        year: audit.gameYear,
        totalGold: 0,
        totalResources: {},
      })
    }

    const costData = costs.get(key)
    const totalCost = audit.totalCost

    costData.totalGold += totalCost.gold
    Object.entries(totalCost.resources).forEach(([key, value]) => {
      costData.totalResources[key] = (costData.totalResources[key] || 0) + value
    })
  })

  return costs
})

// Подготовка данных для графика: агрегация по годам для всех ресурсов
const chartData = computed(() => {
  const yearData = new Map()
  const allResources = new Set(['gold'])

  // Собираем все годы и ресурсы
  enrichedAudits.value.forEach(audit => {
    const year = audit.gameYear
    if (!yearData.has(year)) {
      yearData.set(year, { gold: 0 })
    }
    
    const yearCosts = yearData.get(year)
    yearCosts.gold += audit.totalCost.gold
    
    Object.entries(audit.totalCost.resources).forEach(([key, value]) => {
      allResources.add(key)
      if (!yearCosts[key]) {
        yearCosts[key] = 0
      }
      yearCosts[key] += value
    })
  })

  // Сортируем годы
  const sortedYears = Array.from(yearData.keys()).sort((a, b) => a - b)
  
  // Вычисляем максимальные значения для каждого ресурса
  const resourceMaxValues = new Map()
  Array.from(allResources).forEach(resource => {
    const values = sortedYears.map(year => {
      const yearCosts = yearData.get(year)
      return yearCosts[resource] || 0
    })
    const max = Math.max(...values, 0)
    resourceMaxValues.set(resource, max)
  })
  
  // Определяем ресурсы с большими значениями (те, у которых максимальное значение больше порога)
  const allMaxValues = Array.from(resourceMaxValues.values()).filter(v => v > 0)
  if (allMaxValues.length === 0) {
    return {
      categories: sortedYears,
      series: [],
      useDualAxis: false,
    }
  }
  
  const medianMax = allMaxValues.sort((a, b) => a - b)[Math.floor(allMaxValues.length / 2)]
  const threshold = medianMax * 5 // Порог для разделения на большие/малые значения
  
  const largeScaleResources = new Set()
  const smallScaleResources = new Set()
  
  Array.from(allResources).forEach(resource => {
    const maxValue = resourceMaxValues.get(resource) || 0
    if (maxValue >= threshold) {
      largeScaleResources.add(resource)
    } else {
      smallScaleResources.add(resource)
    }
  })
  
  // Если есть ресурсы в обеих группах, используем две оси
  const useDualAxis = largeScaleResources.size > 0 && smallScaleResources.size > 0
  
  // Формируем series для графика
  const series = Array.from(allResources).map(resource => {
    const data = sortedYears.map(year => {
      const yearCosts = yearData.get(year)
      return yearCosts[resource] || 0
    })
    
    // Используем русское название из маппинга, или identificator как fallback
    const resourceName = resourceNames.value.get(resource) || resource
    
    const seriesItem = {
      name: resourceName,
      data: data,
    }
    
    // Назначаем ось Y для ресурсов с большими значениями
    if (useDualAxis && largeScaleResources.has(resource)) {
      seriesItem.yAxisIndex = 0 // Левая ось для больших значений
    } else if (useDualAxis) {
      seriesItem.yAxisIndex = 1 // Правая ось для маленьких значений
    }
    
    return seriesItem
  })

  return {
    categories: sortedYears,
    series: series,
    useDualAxis: useDualAxis,
  }
})

// Настройки графика
const chartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledColor = `rgba(${ hexToRgb(currentTheme['on-surface']) },${ variableTheme['disabled-opacity'] })`
  const borderColor = `rgba(${ hexToRgb(String(variableTheme['border-color'])) },${ variableTheme['border-opacity'] })`
  
  // Генерируем цвета для линий
  const colors = [
    currentTheme.warning, // Золото
    currentTheme.primary,
    currentTheme.success,
    currentTheme.error,
    currentTheme.info,
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
  ]

  return {
    chart: {
      type: 'line',
      parentHeightOffset: 0,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    colors: colors,
    markers: {
      size: 4,
      hover: { size: 6 },
    },
    grid: {
      borderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
      padding: {
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
      },
    },
    xaxis: {
      categories: chartData.value.categories,
      title: {
        text: 'Год',
        style: {
          color: disabledColor,
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: disabledColor,
          fontSize: '12px',
        },
      },
    },
    yaxis: (() => {
      const useDual = chartData.value.useDualAxis
      return useDual ? [
      {
        // Левая ось для больших значений (золото, зерно)
        title: {
          text: 'Количество (большие значения)',
          style: {
            color: disabledColor,
            fontSize: '14px',
          },
        },
        labels: {
          style: {
            colors: disabledColor,
            fontSize: '12px',
          },
          formatter: (value) => {
            if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}k`
            }
            return value.toLocaleString('ru-RU')
          },
        },
      },
      {
        // Правая ось для маленьких значений (остальные ресурсы)
        opposite: true,
        title: {
          text: 'Количество (малые значения)',
          style: {
            color: disabledColor,
            fontSize: '14px',
          },
        },
        labels: {
          style: {
            colors: disabledColor,
            fontSize: '12px',
          },
          formatter: (value) => {
            if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}k`
            }
            return value.toLocaleString('ru-RU')
          },
        },
      },
    ] : {
      title: {
        text: 'Количество',
        style: {
          color: disabledColor,
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: disabledColor,
          fontSize: '12px',
        },
        formatter: (value) => {
          if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
          }
          return value.toLocaleString('ru-RU')
        },
      },
    }
    })(),
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '12px',
      fontFamily: 'inherit',
      fontWeight: 500,
      labels: {
        colors: disabledColor,
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: (value) => {
          return value !== null && value !== undefined ? value.toLocaleString('ru-RU') : '—'
        },
      },
    },
  }
})

const totalEnterprises = computed(() => enrichedAudits.value.length)

// Данные для графика импорта ресурсов
const importChartData = computed(() => {
  const allYears = new Set()
  const allResources = new Set()
  
  // Собираем все годы и ресурсы из караванов
  caravans.value.forEach(caravan => {
    if (caravan.year) {
      allYears.add(caravan.year)
    }
    
    // Ресурсы, которые импортируются (игрок получает)
    if (caravan.resources_import && Array.isArray(caravan.resources_import)) {
      caravan.resources_import.forEach(res => {
        if (res.identificator) {
          allResources.add(res.identificator)
        }
      })
    }
    
    // Золото тоже считается импортом
    if (caravan.gold_import && caravan.gold_import > 0) {
      allResources.add('gold')
    }
  })
  
  const sortedYears = Array.from(allYears).sort((a, b) => a - b)
  
  // Агрегируем данные по годам
  const yearData = new Map()
  
  sortedYears.forEach(year => {
    const resourceTotals = new Map()
    
    caravans.value
      .filter(c => c.year === year)
      .forEach(caravan => {
        // Ресурсы из resources_import
        if (caravan.resources_import && Array.isArray(caravan.resources_import)) {
          caravan.resources_import.forEach(res => {
            if (res.identificator && res.count) {
              const current = resourceTotals.get(res.identificator) || 0
              resourceTotals.set(res.identificator, current + res.count)
            }
          })
        }
        
        // Золото из gold_import
        if (caravan.gold_import && caravan.gold_import > 0) {
          const current = resourceTotals.get('gold') || 0
          resourceTotals.set('gold', current + caravan.gold_import)
        }
      })
    
    yearData.set(year, resourceTotals)
  })
  
  // Формируем series для графика
  const series = Array.from(allResources).map(resourceId => {
    const data = sortedYears.map(year => {
      const resourceTotals = yearData.get(year)
      return resourceTotals?.get(resourceId) || 0
    })
    
    const resourceName = resourceNames.value.get(resourceId) || resourceId
    
    return {
      name: resourceName,
      data: data,
    }
  })
  
  return {
    categories: sortedYears,
    series: series,
  }
})

// Данные для графика экспорта ресурсов
const exportChartData = computed(() => {
  const allYears = new Set()
  const allResources = new Set()
  
  // Собираем все годы и ресурсы из караванов
  caravans.value.forEach(caravan => {
    if (caravan.year) {
      allYears.add(caravan.year)
    }
    
    // Ресурсы, которые экспортируются (игрок отправляет)
    if (caravan.resources_export && Array.isArray(caravan.resources_export)) {
      caravan.resources_export.forEach(res => {
        if (res.identificator) {
          allResources.add(res.identificator)
        }
      })
    }
    
    // Золото тоже считается экспортом
    if (caravan.gold_export && caravan.gold_export > 0) {
      allResources.add('gold')
    }
  })
  
  const sortedYears = Array.from(allYears).sort((a, b) => a - b)
  
  // Агрегируем данные по годам
  const yearData = new Map()
  
  sortedYears.forEach(year => {
    const resourceTotals = new Map()
    
    caravans.value
      .filter(c => c.year === year)
      .forEach(caravan => {
        // Ресурсы из resources_export
        if (caravan.resources_export && Array.isArray(caravan.resources_export)) {
          caravan.resources_export.forEach(res => {
            if (res.identificator && res.count) {
              const current = resourceTotals.get(res.identificator) || 0
              resourceTotals.set(res.identificator, current + res.count)
            }
          })
        }
        
        // Золото из gold_export
        if (caravan.gold_export && caravan.gold_export > 0) {
          const current = resourceTotals.get('gold') || 0
          resourceTotals.set('gold', current + caravan.gold_export)
        }
      })
    
    yearData.set(year, resourceTotals)
  })
  
  // Формируем series для графика
  const series = Array.from(allResources).map(resourceId => {
    const data = sortedYears.map(year => {
      const resourceTotals = yearData.get(year)
      return resourceTotals?.get(resourceId) || 0
    })
    
    const resourceName = resourceNames.value.get(resourceId) || resourceId
    
    return {
      name: resourceName,
      data: data,
    }
  })
  
  return {
    categories: sortedYears,
    series: series,
  }
})

// Настройки графика импорта
const importChartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledColor = `rgba(${ hexToRgb(currentTheme['on-surface']) },${ variableTheme['disabled-opacity'] })`
  const borderColor = `rgba(${ hexToRgb(String(variableTheme['border-color'])) },${ variableTheme['border-opacity'] })`
  
  const colors = [
    currentTheme.primary,
    currentTheme.success,
    currentTheme.error,
    currentTheme.warning,
    currentTheme.info,
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#9B59B6',
    '#E74C3C',
    '#3498DB',
  ]

  return {
    chart: {
      type: 'line',
      parentHeightOffset: 0,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    colors: colors,
    markers: {
      size: 4,
      hover: { size: 6 },
    },
    grid: {
      borderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
      padding: {
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
      },
    },
    xaxis: {
      categories: importChartData.value.categories,
      title: {
        text: 'Год',
        style: {
          color: disabledColor,
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: disabledColor,
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Количество ресурса',
        style: {
          color: disabledColor,
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: disabledColor,
          fontSize: '12px',
        },
        formatter: (value) => {
          if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
          }
          return value.toLocaleString('ru-RU')
        },
      },
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '12px',
      fontFamily: 'inherit',
      fontWeight: 500,
      labels: {
        colors: disabledColor,
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: (value) => {
          return value !== null && value !== undefined ? value.toLocaleString('ru-RU') : '—'
        },
      },
    },
  }
})

// Настройки графика экспорта
const exportChartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledColor = `rgba(${ hexToRgb(currentTheme['on-surface']) },${ variableTheme['disabled-opacity'] })`
  const borderColor = `rgba(${ hexToRgb(String(variableTheme['border-color'])) },${ variableTheme['border-opacity'] })`
  
  const colors = [
    currentTheme.primary,
    currentTheme.success,
    currentTheme.error,
    currentTheme.warning,
    currentTheme.info,
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#9B59B6',
    '#E74C3C',
    '#3498DB',
  ]

  return {
    chart: {
      type: 'line',
      parentHeightOffset: 0,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    colors: colors,
    markers: {
      size: 4,
      hover: { size: 6 },
    },
    grid: {
      borderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
      padding: {
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
      },
    },
    xaxis: {
      categories: exportChartData.value.categories,
      title: {
        text: 'Год',
        style: {
          color: disabledColor,
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: disabledColor,
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Количество ресурса',
        style: {
          color: disabledColor,
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: disabledColor,
          fontSize: '12px',
        },
        formatter: (value) => {
          if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
          }
          return value.toLocaleString('ru-RU')
        },
      },
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '12px',
      fontFamily: 'inherit',
      fontWeight: 500,
      labels: {
        colors: disabledColor,
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: (value) => {
          return value !== null && value !== undefined ? value.toLocaleString('ru-RU') : '—'
        },
      },
    },
  }
})

const totalCosts = computed(() => {
  const total = { gold: 0, resources: {} }

  enrichedAudits.value.forEach(audit => {
    total.gold += audit.totalCost.gold
    Object.entries(audit.totalCost.resources).forEach(([key, value]) => {
      total.resources[key] = (total.resources[key] || 0) + value
    })
  })

  return total
})


function formatCostForTooltip(cost) {
  if (!cost || typeof cost !== 'object') {
    return []
  }

  const items = []
  
  // Золото
  if (cost.gold) {
    items.push({ type: 'gold', value: cost.gold, identificator: 'gold' })
  }
  
  // Ресурсы
  Object.entries(cost).forEach(([key, value]) => {
    if (key !== 'gold' && value > 0) {
      items.push({ type: 'resource', value, identificator: key })
    }
  })

  return items
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''

  try {
    // Загружаем данные параллельно
    const [auditsResponse, resourcesResponse, caravansResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_PROXY}/audits/plants.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/resources.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/caravans/all.json`),
    ])
    
    audits.value = auditsResponse.data || []
    resources.value = resourcesResponse.data || []
    caravans.value = caravansResponse.data || []
  } catch (error) {
    console.error('Ошибка при загрузке данных по предприятиям:', error)
    errorMessage.value = 'Не удалось загрузить данные. Попробуйте обновить страницу.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <VCard class="mt-4">
    <VCardItem>
      <VCardTitle>Постройка предприятий по времени</VCardTitle>
      <VCardSubtitle>Матрица «гильдия × момент» с указанием типа предприятия, уровня и затрат</VCardSubtitle>
    </VCardItem>

    <VCardText v-if="loading" class="text-center py-8">
      <VProgressCircular indeterminate color="primary" />
      <div class="mt-2">Загрузка данных...</div>
    </VCardText>

    <VCardText v-else-if="errorMessage" class="py-6">
      <VAlert
        type="error"
        title="Ошибка загрузки"
        :text="errorMessage"
        border="start"
        variant="tonal"
      />
    </VCardText>

    <VCardText
      v-else-if="!enrichedAudits.length"
      class="text-center py-8"
    >
      <VIcon icon="ri-building-3-line" size="48" class="text-disabled mb-2" />
      <div class="text-body-1 text-disabled">Нет данных о предприятиях гильдий</div>
    </VCardText>

    <template v-else>
      <VCardText class="pb-0">
        <VRow>
          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="primary" variant="tonal">
              <VIcon icon="ri-building-3-line" size="24" class="me-3 text-primary" />
              <div>
                <div class="text-caption text-medium-emphasis">Количество событий</div>
                <div class="text-h6 mb-0">{{ totalEnterprises }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="warning" variant="tonal">
              <VIcon icon="ri-copper-coin-fill" size="24" class="me-3 text-warning" />
              <div>
                <div class="text-caption text-medium-emphasis">Суммарное золото</div>
                <div class="text-h6 mb-0">{{ totalCosts.gold.toLocaleString('ru-RU') }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="success" variant="tonal">
              <VIcon icon="ri-box-3-line" size="24" class="me-3 text-success" />
              <div>
                <div class="text-caption text-medium-emphasis">Типов ресурсов</div>
                <div class="text-h6 mb-0">{{ Object.keys(totalCosts.resources).length }}</div>
              </div>
            </VSheet>
          </VCol>
        </VRow>
      </VCardText>

      <VCardText class="pt-4">
        <div class="table-wrapper">
          <VTable class="enterprise-table">
            <thead>
              <tr>
                <th class="guild-column">Гильдия</th>
                <th
                  v-for="column in timelineColumns"
                  :key="column.timestamp"
                >
                  <div class="column-header">
                    <span>{{ column.timeLabel }}</span>
                    <small class="text-medium-emphasis">
                      Год {{ column.gameYear }}
                    </small>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="guildName in guildNames"
                :key="guildName"
              >
                <td class="guild-column">
                  <div class="guild-name">{{ guildName }}</div>
                </td>
                <td
                  v-for="column in timelineColumns"
                  :key="`${guildName}-${column.timestamp}`"
                  class="data-cell"
                >
                  <template v-if="enterpriseMatrix.get(guildName)?.get(column.timestamp)">
                    <div class="cell-items">
                      <VMenu
                        v-for="item in enterpriseMatrix.get(guildName).get(column.timestamp)"
                        :key="item.id"
                        location="top"
                        :close-on-content-click="false"
                        offset="8"
                        open-on-hover
                      >
                        <template #activator="{ props: menuProps }">
                          <VChip
                            v-bind="menuProps"
                            size="small"
                            :color="item.action === 'create' ? 'success' : item.action === 'update' ? 'primary' : 'error'"
                            variant="flat"
                            class="enterprise-chip"
                          >
                            <div class="enterprise-chip-content">
                              <div class="enterprise-chip-line">{{ item.plantTypeName }}</div>
                              <div class="enterprise-chip-line text-caption">Ур.{{ item.newLevel || item.plantLevel }}</div>
                            </div>
                          </VChip>
                        </template>

                        <VCard class="enterprise-tooltip">
                          <VCardText class="pa-3">
                            <div class="tooltip-content">
                              <div class="tooltip-header mb-2">
                                <div class="text-h6">{{ item.plantTypeName }}</div>
                                <div class="text-caption text-medium-emphasis">
                                  Уровень: {{ item.newLevel || item.plantLevel }}
                                  <span v-if="item.action === 'update' && item.oldLevel">
                                    ({{ item.oldLevel }} → {{ item.newLevel }})
                                  </span>
                                </div>
                                <div class="text-caption text-medium-emphasis mt-1">
                                  <VChip
                                    size="x-small"
                                    :color="item.action === 'create' ? 'success' : item.action === 'update' ? 'primary' : 'error'"
                                    variant="flat"
                                  >
                                    {{ item.action === 'create' ? 'Создание' : item.action === 'update' ? 'Улучшение' : 'Удаление' }}
                                  </VChip>
                                </div>
                              </div>
                              
                              <VDivider class="my-2" />
                              
                              <div class="tooltip-cost">
                                <div class="text-caption text-medium-emphasis mb-1">Стоимость:</div>
                                <div class="d-flex flex-wrap gap-2">
                                  <div
                                    v-for="costItem in formatCostForTooltip(item.displayCost)"
                                    :key="costItem.identificator"
                                    class="cost-item"
                                  >
                                    <VImg
                                      :src="getResourceImageUrl(costItem.identificator)"
                                      width="20"
                                      height="20"
                                      class="cost-icon"
                                    />
                                    <span class="cost-value">{{ costItem.value }}</span>
                                  </div>
                                  <span v-if="formatCostForTooltip(item.displayCost).length === 0" class="text-caption text-disabled">—</span>
                                </div>
                              </div>
                            </div>
                          </VCardText>
                        </VCard>
                      </VMenu>
                    </div>
                  </template>
                  <span
                    v-else
                    class="text-disabled text-caption"
                  >
                    —
                  </span>
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCardText>

      <!-- График затрат по годам -->
      <VCardText class="pt-4">
        <VCardTitle class="mb-4">Затраты по гильдиям по годам</VCardTitle>
        <div v-if="chartData.categories.length > 0">
          <VueApexCharts
            type="line"
            :options="chartOptions"
            :series="chartData.series"
            :height="400"
          />
        </div>
        <div v-else class="text-center py-8">
          <VIcon icon="ri-line-chart-line" size="48" class="text-disabled mb-2" />
          <div class="text-body-1 text-disabled">Нет данных для графика</div>
        </div>
      </VCardText>

      <!-- График уровней предприятий по типам -->
      <VCardText class="pt-4">
        <VCardItem>
          <VCardTitle>Суммарный уровень предприятий по типам</VCardTitle>
          <VCardSubtitle>Динамика суммарного уровня всех предприятий каждого типа</VCardSubtitle>

          <template #append>
            <VSelect
              v-model="selectedGuildForChart"
              :items="guildOptions"
              label="Гильдия"
              item-title="label"
              item-value="value"
              density="compact"
              :disabled="loading || !guildNames.length"
              style="min-width: 200px"
            />
          </template>
        </VCardItem>

        <div v-if="plantLevelsChartData.categories.length > 0" class="mt-4">
          <VueApexCharts
            type="line"
            :options="plantLevelsChartOptions"
            :series="plantLevelsChartData.series"
            :height="400"
          />
        </div>
        <div v-else class="text-center py-8">
          <VIcon icon="ri-line-chart-line" size="48" class="text-disabled mb-2" />
          <div class="text-body-1 text-disabled">Нет данных для графика</div>
        </div>
      </VCardText>

      <!-- График максимальной производительности -->
      <VCardText class="pt-4">
        <VCardItem>
          <VCardTitle>Максимальная производительность предприятий</VCardTitle>
          <VCardSubtitle>Суммарная максимальная производительность всех предприятий по ресурсам</VCardSubtitle>
        </VCardItem>

        <div v-if="maxProductionChartData.categories.length > 0" class="mt-4">
          <VueApexCharts
            type="line"
            :options="maxProductionChartOptions"
            :series="maxProductionChartData.series"
            :height="400"
          />
        </div>
        <div v-else class="text-center py-8">
          <VIcon icon="ri-line-chart-line" size="48" class="text-disabled mb-2" />
          <div class="text-body-1 text-disabled">Нет данных для графика</div>
        </div>
      </VCardText>

      <!-- График импорта ресурсов -->
      <VCardText class="pt-4">
        <VCardItem>
          <VCardTitle>Импорт ресурсов в караванах</VCardTitle>
          <VCardSubtitle>Количество ресурсов, импортированных через караваны по годам</VCardSubtitle>
        </VCardItem>

        <div v-if="importChartData.categories.length > 0" class="mt-4">
          <VueApexCharts
            type="line"
            :options="importChartOptions"
            :series="importChartData.series"
            :height="400"
          />
        </div>
        <div v-else class="text-center py-8">
          <VIcon icon="ri-line-chart-line" size="48" class="text-disabled mb-2" />
          <div class="text-body-1 text-disabled">Нет данных для графика</div>
        </div>
      </VCardText>

      <!-- График экспорта ресурсов -->
      <VCardText class="pt-4">
        <VCardItem>
          <VCardTitle>Экспорт ресурсов в караванах</VCardTitle>
          <VCardSubtitle>Количество ресурсов, экспортированных через караваны по годам</VCardSubtitle>
        </VCardItem>

        <div v-if="exportChartData.categories.length > 0" class="mt-4">
          <VueApexCharts
            type="line"
            :options="exportChartOptions"
            :series="exportChartData.series"
            :height="400"
          />
        </div>
        <div v-else class="text-center py-8">
          <VIcon icon="ri-line-chart-line" size="48" class="text-disabled mb-2" />
          <div class="text-body-1 text-disabled">Нет данных для графика</div>
        </div>
      </VCardText>
    </template>
  </VCard>
</template>

<style scoped>
.summary-chip {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
}

.table-wrapper {
  overflow-x: auto;
}

.enterprise-table,
.costs-table {
  min-width: 720px;
}

.enterprise-table th,
.enterprise-table td,
.costs-table th,
.costs-table td {
  white-space: nowrap;
  text-align: center;
  padding: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.enterprise-table thead th,
.costs-table thead th {
  position: sticky;
  top: 0;
  background: rgb(var(--v-theme-surface));
  z-index: 1;
}

.guild-column {
  text-align: left;
  min-width: 180px;
  background: rgb(var(--v-theme-surface-variant), 0.4);
  font-weight: 600;
}

.guild-name {
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}

.column-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-cell {
  min-width: 160px;
  vertical-align: top;
}

.cell-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.enterprise-chip {
  max-width: 160px;
  min-height: 48px;
  height: auto;
  white-space: normal;
  word-break: break-word;
  padding: 6px 12px;
}

.enterprise-chip-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.enterprise-chip-line {
  line-height: 1.2;
  text-align: center;
  width: 100%;
}

.costs-table th:first-child,
.costs-table td:first-child {
  text-align: left;
  min-width: 180px;
}

.costs-table th:nth-child(2),
.costs-table td:nth-child(2) {
  min-width: 80px;
}

.costs-table th:nth-child(3),
.costs-table td:nth-child(3) {
  min-width: 120px;
}

.costs-table th:nth-child(4),
.costs-table td:nth-child(4) {
  text-align: left;
  min-width: 200px;
}

.resource-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid rgba(var(--v-border-color), 0.3);
  border-radius: 4px;
  background: rgba(var(--v-theme-surface-variant), 0.2);
}

.resource-icon-small {
  border-radius: 2px;
  flex-shrink: 0;
}

.resource-count {
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
}

.enterprise-tooltip {
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tooltip-content {
  min-width: 200px;
}

.tooltip-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-cost {
  margin-top: 8px;
}

.cost-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 4px;
  border: 1px solid rgba(var(--v-border-color), 0.2);
}

.cost-icon {
  border-radius: 2px;
  flex-shrink: 0;
}

.cost-value {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
}
</style>

