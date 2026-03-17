<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import MerchantGuildsStats from './MerchantGuildsStats.vue'
import RobbedCaravansStats from './RobbedCaravansStats.vue'
import IncomeStats from './IncomeStats.vue'
import PlantTimeline from './PlantTimeline.vue'
import PlantCostsChart from './PlantCostsChart.vue'
import PlantLevelsChart from './PlantLevelsChart.vue'
import MaxProductionChart from './MaxProductionChart.vue'
import ImportExportCharts from './ImportExportCharts.vue'

const loading = ref(false)
const errorMessage = ref('')
const audits = ref([])
const resources = ref([])
const caravans = ref([])
const selectedGuildForChart = ref('all')
const merchantGuildsStats = ref(null)
const robbedCaravansStats = ref(null)
const incomeStats = ref(null)
const summaryStats = ref(null)
const troopPaymentsStats = ref(null)
const troopPurchasesStats = ref(null)

// Маппинг identificator -> русское название
const resourceNames = computed(() => {
  const map = new Map()
  resources.value.forEach(resource => {
    if (resource.identificator && resource.name) {
      map.set(resource.identificator, resource.name)
    }
  })
  if (!map.has('gold')) {
    map.set('gold', 'Золото')
  }
  return map
})

// Фильтруем только предприятия, принадлежащие гильдиям
const plantAudits = computed(() => {
  return audits.value.filter(audit => 
    audit.auditable_type === 'Plant' && 
    (audit.economic_subject_type === 'Guild' || audit.guild_name)
  )
})

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
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
  if (cost.gold) {
    parts.push(`${cost.gold} золота`)
  }
  
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
      const guildName = audit.guild_name || 'Неизвестная гильдия'
      const plantTypeName = audit.plant_type_name || 'Неизвестный тип'
      const plantLevel = audit.plant_level_level || null
      const action = audit.action
      const cost = (action === 'update' && audit.new_cost) ? audit.new_cost : (audit.cost || {})
      const gameYear = audit.year || year
      const timeLabel = hasPreciseDate ? timeFormatter.format(date) : '—'

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
        displayCost = newCost
        oldMaxProducts = audit.old_max_products || []
        newMaxProducts = audit.new_max_products || audit.max_products || []
      } else {
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

const filteredAuditsForChart = computed(() => {
  if (selectedGuildForChart.value === 'all') {
    return enrichedAudits.value
  }
  return enrichedAudits.value.filter(audit => audit.guildName === selectedGuildForChart.value)
})

// Данные для графика уровней предприятий по типам
const plantLevelsChartData = computed(() => {
  const sortedAudits = [...filteredAuditsForChart.value].sort((a, b) => {
    if (a.gameYear !== b.gameYear) {
      return a.gameYear - b.gameYear
    }
    return a.date - b.date
  })

  const allPlantTypes = new Set()
  const allYears = new Set()
  
  sortedAudits.forEach(audit => {
    if (audit.plantTypeName) {
      allPlantTypes.add(audit.plantTypeName)
    }
    allYears.add(audit.gameYear)
  })

  const sortedYears = Array.from(allYears).sort((a, b) => a - b)
  const yearLevels = new Map()
  const currentPlants = new Map()
  
  sortedYears.forEach(year => {
    const yearAudits = sortedAudits.filter(a => a.gameYear === year)
    
    yearAudits.forEach(audit => {
      const plantKey = audit.auditableId || `audit_${audit.id}`
      const plantType = audit.plantTypeName
      
      if (!plantType) return
      
      if (audit.action === 'create') {
        const level = audit.newLevel || audit.plantLevel || 0
        currentPlants.set(plantKey, { type: plantType, level: level })
      } else if (audit.action === 'update' && audit.oldLevel !== null) {
        const existing = currentPlants.get(plantKey)
        if (existing) {
          existing.level = audit.newLevel || audit.plantLevel || 0
        } else {
          const level = audit.newLevel || audit.plantLevel || 0
          currentPlants.set(plantKey, { type: plantType, level: level })
        }
      } else if (audit.action === 'destroy') {
        currentPlants.delete(plantKey)
      }
    })
    
    const typeLevels = new Map()
    currentPlants.forEach(plant => {
      if (!typeLevels.has(plant.type)) {
        typeLevels.set(plant.type, 0)
      }
      typeLevels.set(plant.type, typeLevels.get(plant.type) + plant.level)
    })
    
    yearLevels.set(year, typeLevels)
  })
  
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
  const sortedAudits = [...enrichedAudits.value].sort((a, b) => {
    if (a.gameYear !== b.gameYear) {
      return a.gameYear - b.gameYear
    }
    return a.date - b.date
  })

  const allYears = new Set()
  const allResources = new Set()
  
  sortedAudits.forEach(audit => {
    allYears.add(audit.gameYear)
  })

  const sortedYears = Array.from(allYears).sort((a, b) => a - b)
  const yearProduction = new Map()
  const currentPlants = new Map()
  
  sortedYears.forEach(year => {
    const yearAudits = sortedAudits.filter(a => a.gameYear === year)
    
    yearAudits.forEach(audit => {
      const plantKey = audit.auditableId || `audit_${audit.id}`
      
      if (audit.action === 'create') {
        const maxProducts = audit.maxProducts || []
        currentPlants.set(plantKey, { maxProducts: maxProducts })
        
        maxProducts.forEach(product => {
          if (product.identificator) {
            allResources.add(product.identificator)
          }
        })
      } else if (audit.action === 'update' && audit.oldLevel !== null) {
        const existing = currentPlants.get(plantKey)
        if (existing) {
          existing.maxProducts = audit.newMaxProducts || audit.maxProducts || []
        } else {
          const maxProducts = audit.newMaxProducts || audit.maxProducts || []
          currentPlants.set(plantKey, { maxProducts: maxProducts })
        }
        
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
  
  const series = Array.from(allResources).map(resourceId => {
    const data = sortedYears.map(year => {
      const resourceProduction = yearProduction.get(year)
      return resourceProduction?.get(resourceId) || 0
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

// Подготовка данных для графика затрат
const chartData = computed(() => {
  const yearData = new Map()
  const allResources = new Set(['gold'])

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

  const sortedYears = Array.from(yearData.keys()).sort((a, b) => a - b)
  
  const resourceMaxValues = new Map()
  Array.from(allResources).forEach(resource => {
    const values = sortedYears.map(year => {
      const yearCosts = yearData.get(year)
      return yearCosts[resource] || 0
    })
    const max = Math.max(...values, 0)
    resourceMaxValues.set(resource, max)
  })
  
  const allMaxValues = Array.from(resourceMaxValues.values()).filter(v => v > 0)
  if (allMaxValues.length === 0) {
    return {
      categories: sortedYears,
      series: [],
      useDualAxis: false,
    }
  }
  
  const medianMax = allMaxValues.sort((a, b) => a - b)[Math.floor(allMaxValues.length / 2)]
  const threshold = medianMax * 5
  
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
  
  const useDualAxis = largeScaleResources.size > 0 && smallScaleResources.size > 0
  
  const series = Array.from(allResources).map(resource => {
    const data = sortedYears.map(year => {
      const yearCosts = yearData.get(year)
      return yearCosts[resource] || 0
    })
    
    const resourceName = resourceNames.value.get(resource) || resource
    
    const seriesItem = {
      name: resourceName,
      data: data,
    }
    
    if (useDualAxis && largeScaleResources.has(resource)) {
      seriesItem.yAxisIndex = 0
    } else if (useDualAxis) {
      seriesItem.yAxisIndex = 1
    }
    
    return seriesItem
  })

  return {
    categories: sortedYears,
    series: series,
    useDualAxis: useDualAxis,
  }
})

// Данные для графика импорта ресурсов
const importChartData = computed(() => {
  const allYears = new Set()
  const allResources = new Set()
  
  caravans.value.forEach(caravan => {
    if (caravan.year) {
      allYears.add(caravan.year)
    }
    
    if (caravan.resources_import && Array.isArray(caravan.resources_import)) {
      caravan.resources_import.forEach(res => {
        if (res.identificator) {
          allResources.add(res.identificator)
        }
      })
    }
    
    if (caravan.gold_import && caravan.gold_import > 0) {
      allResources.add('gold')
    }
  })
  
  const sortedYears = Array.from(allYears).sort((a, b) => a - b)
  
  const yearData = new Map()
  
  sortedYears.forEach(year => {
    const resourceTotals = new Map()
    
    caravans.value
      .filter(c => c.year === year)
      .forEach(caravan => {
        if (caravan.resources_import && Array.isArray(caravan.resources_import)) {
          caravan.resources_import.forEach(res => {
            if (res.identificator && res.count) {
              const current = resourceTotals.get(res.identificator) || 0
              resourceTotals.set(res.identificator, current + res.count)
            }
          })
        }
        
        if (caravan.gold_import && caravan.gold_import > 0) {
          const current = resourceTotals.get('gold') || 0
          resourceTotals.set('gold', current + caravan.gold_import)
        }
      })
    
    yearData.set(year, resourceTotals)
  })
  
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
  
  caravans.value.forEach(caravan => {
    if (caravan.year) {
      allYears.add(caravan.year)
    }
    
    if (caravan.resources_export && Array.isArray(caravan.resources_export)) {
      caravan.resources_export.forEach(res => {
        if (res.identificator) {
          allResources.add(res.identificator)
        }
      })
    }
    
    if (caravan.gold_export && caravan.gold_export > 0) {
      allResources.add('gold')
    }
  })
  
  const sortedYears = Array.from(allYears).sort((a, b) => a - b)
  
  const yearData = new Map()
  
  sortedYears.forEach(year => {
    const resourceTotals = new Map()
    
    caravans.value
      .filter(c => c.year === year)
      .forEach(caravan => {
        if (caravan.resources_export && Array.isArray(caravan.resources_export)) {
          caravan.resources_export.forEach(res => {
            if (res.identificator && res.count) {
              const current = resourceTotals.get(res.identificator) || 0
              resourceTotals.set(res.identificator, current + res.count)
            }
          })
        }
        
        if (caravan.gold_export && caravan.gold_export > 0) {
          const current = resourceTotals.get('gold') || 0
          resourceTotals.set('gold', current + caravan.gold_export)
        }
      })
    
    yearData.set(year, resourceTotals)
  })
  
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

async function loadData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [auditsResponse, resourcesResponse, caravansResponse, merchantStatsResponse, robbedStatsResponse, incomeStatsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_PROXY}/audits/plants.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/resources.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/caravans/all.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/caravans/merchant_guilds_stats.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/caravans/robbed_caravans_stats.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/caravans/income_stats.json`),
    ])
    
    audits.value = auditsResponse.data || []
    resources.value = resourcesResponse.data || []
    caravans.value = caravansResponse.data || []
    merchantGuildsStats.value = merchantStatsResponse.data || { by_guild_and_year: [], totals_by_year: [], overall_totals: { total_income: 0, total_expense: 0, net_cashflow: 0 } }
    robbedCaravansStats.value = robbedStatsResponse.data || { by_year_and_guild: [], total_robbed_caravans: 0, total_lost_gold: 0, caravans: [] }
    
    // Income stats response now contains both income_stats and summary_stats
    if (incomeStatsResponse.data.income_stats) {
      incomeStats.value = incomeStatsResponse.data.income_stats
      summaryStats.value = incomeStatsResponse.data.summary_stats
      troopPaymentsStats.value = incomeStatsResponse.data.troop_payments_stats
      troopPurchasesStats.value = incomeStatsResponse.data.troop_purchases_stats
    } else {
      incomeStats.value = incomeStatsResponse.data || { by_year: [], total_all_time_income: 0, total_income_events: 0, top_nobles: [] }
      summaryStats.value = { total_trade_income: 0, total_trade_outcome: 0, total_noble_income: 0, political_actions_cost: 0, merchant_political_actions_cost: 0, troop_payments_cost: 0, troop_payments_count: 0, troop_purchases_cost: 0, total_cashflow: 0 }
      troopPaymentsStats.value = { by_year: [], total_payments: 0, total_cost: 0 }
      troopPurchasesStats.value = { by_year: [], total_purchases: 0, total_cost: 0 }
    }
    
    console.log('Merchant guilds stats loaded:', merchantGuildsStats.value)
    console.log('Robbed caravans stats loaded:', robbedCaravansStats.value)
    console.log('Income stats loaded:', incomeStats.value)
    console.log('Summary stats loaded:', summaryStats.value)
    console.log('Troop payments stats loaded:', troopPaymentsStats.value)
    console.log('Troop purchases stats loaded:', troopPurchasesStats.value)
  } catch (error) {
    console.error('Ошибка при загрузке данных по предприятиям:', error)
    errorMessage.value = 'Не удалось загрузить данные. Попробуйте обновить страницу.'
  } finally {
    loading.value = false
  }
}

function handleGuildSelect(guild) {
  selectedGuildForChart.value = guild
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <VCard class="mt-4">
    <!-- Статистика гильдий торговцев -->
    <MerchantGuildsStats 
      :merchant-guilds-stats="merchantGuildsStats"
      :loading="loading"
    />

    <!-- Ограбленные караваны -->
    <RobbedCaravansStats 
      :robbed-caravans-stats="robbedCaravansStats"
      :loading="loading"
    />

    <!-- Статистика доходов знати -->
    <IncomeStats 
      :income-stats="incomeStats"
      :summary-stats="summaryStats"
      :troop-payments-stats="troopPaymentsStats"
      :troop-purchases-stats="troopPurchasesStats"
      :loading="loading"
    />

    <VDivider class="my-6" />

    <!-- Основная секция: Постройка предприятий по времени -->
    <PlantTimeline 
      :enriched-audits="enrichedAudits"
      :guild-names="guildNames"
      :timeline-columns="timelineColumns"
      :enterprise-matrix="enterpriseMatrix"
    />

    <!-- График затрат по годам -->
    <PlantCostsChart 
      :chart-data="chartData"
      :resource-names="resourceNames"
    />

    <!-- График уровней предприятий по типам -->
    <PlantLevelsChart 
      :plant-levels-chart-data="plantLevelsChartData"
      :guild-options="guildOptions"
      @update:selected-guild="handleGuildSelect"
    />

    <!-- График максимальной производительности -->
    <MaxProductionChart 
      :max-production-chart-data="maxProductionChartData"
    />

    <!-- Графики импорта и экспорта -->
    <ImportExportCharts 
      :import-chart-data="importChartData"
      :export-chart-data="exportChartData"
    />
  </VCard>
</template>
