<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { hexToRgb } from '@layouts/utils'

const props = defineProps({
  merchantGuildsStats: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const vuetifyTheme = useTheme()

// Статистика по гильдиям торговцев: доходы
const merchantIncomeByGuild = computed(() => {
  if (!props.merchantGuildsStats || !props.merchantGuildsStats.by_guild_and_year) return []
  
  const guildIncome = new Map()
  
  props.merchantGuildsStats.by_guild_and_year.forEach(stat => {
    if (!guildIncome.has(stat.guild_name)) {
      guildIncome.set(stat.guild_name, { guild_name: stat.guild_name, total_income: 0, years: [] })
    }
    const guild = guildIncome.get(stat.guild_name)
    guild.total_income += stat.total_income
    guild.years.push({ year: stat.year, income: stat.total_income })
  })
  
  return Array.from(guildIncome.values()).sort((a, b) => b.total_income - a.total_income)
})

// Статистика по гильдиям торговцев: расходы
const merchantExpenseByGuild = computed(() => {
  if (!props.merchantGuildsStats || !props.merchantGuildsStats.by_guild_and_year) return []
  
  const guildExpense = new Map()
  
  props.merchantGuildsStats.by_guild_and_year.forEach(stat => {
    if (!guildExpense.has(stat.guild_name)) {
      guildExpense.set(stat.guild_name, { guild_name: stat.guild_name, total_expense: 0, years: [] })
    }
    const guild = guildExpense.get(stat.guild_name)
    guild.total_expense += stat.total_expense
    guild.years.push({ year: stat.year, expense: stat.total_expense })
  })
  
  return Array.from(guildExpense.values()).sort((a, b) => b.total_expense - a.total_expense)
})

// Данные для графика доходов по годам
const merchantIncomeChartData = computed(() => {
  if (!props.merchantGuildsStats || !props.merchantGuildsStats.totals_by_year) return { categories: [], series: [] }
  
  const sortedYears = props.merchantGuildsStats.totals_by_year.map(t => t.year).sort((a, b) => a - b)
  
  const incomeSeries = {
    name: 'Доходы',
    data: sortedYears.map(year => {
      const total = props.merchantGuildsStats.totals_by_year.find(t => t.year === year)
      return total ? total.total_income : 0
    })
  }
  
  return {
    categories: sortedYears,
    series: [incomeSeries]
  }
})

// Данные для графика расходов по годам
const merchantExpenseChartData = computed(() => {
  if (!props.merchantGuildsStats || !props.merchantGuildsStats.totals_by_year) return { categories: [], series: [] }
  
  const sortedYears = props.merchantGuildsStats.totals_by_year.map(t => t.year).sort((a, b) => a - b)
  
  const expenseSeries = {
    name: 'Расходы',
    data: sortedYears.map(year => {
      const total = props.merchantGuildsStats.totals_by_year.find(t => t.year === year)
      return total ? total.total_expense : 0
    })
  }
  
  return {
    categories: sortedYears,
    series: [expenseSeries]
  }
})

// Данные для графика cashflow (чистый поток денег) по годам
const merchantCashflowChartData = computed(() => {
  if (!props.merchantGuildsStats || !props.merchantGuildsStats.totals_by_year) return { categories: [], series: [] }
  
  const sortedYears = props.merchantGuildsStats.totals_by_year.map(t => t.year).sort((a, b) => a - b)
  
  const cashflowSeries = {
    name: 'Чистый поток',
    data: sortedYears.map(year => {
      const total = props.merchantGuildsStats.totals_by_year.find(t => t.year === year)
      return total ? total.net_cashflow : 0
    })
  }
  
  return {
    categories: sortedYears,
    series: [cashflowSeries]
  }
})

// Debug computed property
const hasData = computed(() => {
  console.log('MerchantGuildsStats - merchantGuildsStats:', props.merchantGuildsStats)
  console.log('Has overall_totals?', !!props.merchantGuildsStats?.overall_totals)
  return props.merchantGuildsStats && props.merchantGuildsStats.overall_totals
})

// Настройки для графика доходов торговцев
const merchantIncomeChartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledColor = `rgba(${ hexToRgb(currentTheme['on-surface']) },${ variableTheme['disabled-opacity'] })`
  const borderColor = `rgba(${ hexToRgb(String(variableTheme['border-color'])) },${ variableTheme['border-opacity'] })`
  
  return {
    chart: {
      type: 'bar',
      parentHeightOffset: 0,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      }
    },
    colors: [currentTheme.success],
    grid: {
      borderColor,
      strokeDashArray: 4,
      padding: { top: 10, left: 10, right: 10, bottom: 10 },
    },
    xaxis: {
      categories: merchantIncomeChartData.value.categories,
      title: { text: 'Год', style: { color: disabledColor, fontSize: '14px' } },
      labels: { style: { colors: disabledColor, fontSize: '12px' } },
    },
    yaxis: {
      title: { text: 'Золото', style: { color: disabledColor, fontSize: '14px' } },
      labels: {
        style: { colors: disabledColor, fontSize: '12px' },
        formatter: (value) => value.toLocaleString('ru-RU'),
      },
    },
    legend: { show: false },
    tooltip: {
      enabled: true,
      y: { formatter: (value) => value.toLocaleString('ru-RU') },
    },
  }
})

// Настройки для графика расходов торговцев
const merchantExpenseChartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledColor = `rgba(${ hexToRgb(currentTheme['on-surface']) },${ variableTheme['disabled-opacity'] })`
  const borderColor = `rgba(${ hexToRgb(String(variableTheme['border-color'])) },${ variableTheme['border-opacity'] })`
  
  return {
    chart: {
      type: 'bar',
      parentHeightOffset: 0,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      }
    },
    colors: [currentTheme.error],
    grid: {
      borderColor,
      strokeDashArray: 4,
      padding: { top: 10, left: 10, right: 10, bottom: 10 },
    },
    xaxis: {
      categories: merchantExpenseChartData.value.categories,
      title: { text: 'Год', style: { color: disabledColor, fontSize: '14px' } },
      labels: { style: { colors: disabledColor, fontSize: '12px' } },
    },
    yaxis: {
      title: { text: 'Золото', style: { color: disabledColor, fontSize: '14px' } },
      labels: {
        style: { colors: disabledColor, fontSize: '12px' },
        formatter: (value) => value.toLocaleString('ru-RU'),
      },
    },
    legend: { show: false },
    tooltip: {
      enabled: true,
      y: { formatter: (value) => value.toLocaleString('ru-RU') },
    },
  }
})

// Настройки для графика cashflow торговцев
const merchantCashflowChartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledColor = `rgba(${ hexToRgb(currentTheme['on-surface']) },${ variableTheme['disabled-opacity'] })`
  const borderColor = `rgba(${ hexToRgb(String(variableTheme['border-color'])) },${ variableTheme['border-opacity'] })`
  
  const hasNegative = merchantCashflowChartData.value.series[0]?.data?.some(v => v < 0)
  
  return {
    chart: {
      type: 'line',
      parentHeightOffset: 0,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    stroke: {
      width: 3,
      curve: 'smooth',
    },
    colors: [hasNegative ? currentTheme.error : currentTheme.success],
    markers: { size: 5 },
    grid: {
      borderColor,
      strokeDashArray: 4,
      padding: { top: 10, left: 10, right: 10, bottom: 10 },
    },
    xaxis: {
      categories: merchantCashflowChartData.value.categories,
      title: { text: 'Год', style: { color: disabledColor, fontSize: '14px' } },
      labels: { style: { colors: disabledColor, fontSize: '12px' } },
    },
    yaxis: {
      title: { text: 'Чистый поток (золото)', style: { color: disabledColor, fontSize: '14px' } },
      labels: {
        style: { colors: disabledColor, fontSize: '12px' },
        formatter: (value) => value.toLocaleString('ru-RU'),
      },
    },
    legend: { show: false },
    tooltip: {
      enabled: true,
      y: { formatter: (value) => value.toLocaleString('ru-RU') },
    },
  }
})
</script>

<template>
  <div>
    <VCardItem>
      <VCardTitle>Статистика гильдий торговцев</VCardTitle>
      <VCardSubtitle>Доходы, расходы и денежные потоки гильдий от торговли</VCardSubtitle>
    </VCardItem>

    <VCardText v-if="loading" class="text-center py-8">
      <VProgressCircular indeterminate color="primary" />
      <div class="mt-2">Загрузка данных...</div>
    </VCardText>

    <template v-else-if="merchantGuildsStats && merchantGuildsStats.overall_totals">
      <!-- Сводные карточки -->
      <VCardText class="pb-0">
        <VRow>
          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="success" variant="tonal">
              <VIcon icon="ri-coins-line" size="24" class="me-3 text-success" />
              <div>
                <div class="text-caption text-medium-emphasis">Общий доход</div>
                <div class="text-h6 mb-0">{{ merchantGuildsStats.overall_totals.total_income.toLocaleString('ru-RU') }} 💰</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="error" variant="tonal">
              <VIcon icon="ri-wallet-3-line" size="24" class="me-3 text-error" />
              <div>
                <div class="text-caption text-medium-emphasis">Общие расходы</div>
                <div class="text-h6 mb-0">{{ merchantGuildsStats.overall_totals.total_expense.toLocaleString('ru-RU') }} 💰</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="4">
            <VSheet class="summary-chip" :color="merchantGuildsStats.overall_totals.net_cashflow >= 0 ? 'success' : 'error'" variant="tonal">
              <VIcon icon="ri-arrow-left-right-line" size="24" class="me-3" :class="merchantGuildsStats.overall_totals.net_cashflow >= 0 ? 'text-success' : 'text-error'" />
              <div>
                <div class="text-caption text-medium-emphasis">Чистый поток</div>
                <div class="text-h6 mb-0">{{ merchantGuildsStats.overall_totals.net_cashflow.toLocaleString('ru-RU') }} 💰</div>
              </div>
            </VSheet>
          </VCol>
        </VRow>
      </VCardText>

      <!-- График доходов по годам -->
      <VCardText class="pt-4">
        <VCardTitle class="mb-4">Продажа товаров всеми гильдиями по годам</VCardTitle>
        <div v-if="merchantIncomeChartData.categories.length > 0">
          <VueApexCharts
            type="bar"
            :options="merchantIncomeChartOptions"
            :series="merchantIncomeChartData.series"
            :height="350"
          />
        </div>
        <div v-else class="text-center py-8">
          <VIcon icon="ri-line-chart-line" size="48" class="text-disabled mb-2" />
          <div class="text-body-1 text-disabled">Нет данных для графика</div>
        </div>
      </VCardText>

      <!-- График расходов по годам -->
      <VCardText class="pt-4">
        <VCardTitle class="mb-4">Покупка товаров всеми гильдиями по годам</VCardTitle>
        <div v-if="merchantExpenseChartData.categories.length > 0">
          <VueApexCharts
            type="bar"
            :options="merchantExpenseChartOptions"
            :series="merchantExpenseChartData.series"
            :height="350"
          />
        </div>
        <div v-else class="text-center py-8">
          <VIcon icon="ri-line-chart-line" size="48" class="text-disabled mb-2" />
          <div class="text-body-1 text-disabled">Нет данных для графика</div>
        </div>
      </VCardText>

      <!-- График чистого денежного потока (cashflow) по годам -->
      <VCardText class="pt-4">
        <VCardTitle class="mb-4">Чистый денежный поток гильдий</VCardTitle>
        <VCardSubtitle class="mb-4">Разница между доходами и расходами по годам</VCardSubtitle>
        <div v-if="merchantCashflowChartData.categories.length > 0">
          <VueApexCharts
            type="line"
            :options="merchantCashflowChartOptions"
            :series="merchantCashflowChartData.series"
            :height="350"
          />
        </div>
        <div v-else class="text-center py-8">
          <VIcon icon="ri-line-chart-line" size="48" class="text-disabled mb-2" />
          <div class="text-body-1 text-disabled">Нет данных для графика</div>
        </div>
      </VCardText>

      <!-- Таблица с детализацией по гильдиям -->
      <VCardText class="pt-4">
        <VCardTitle class="mb-4">Детализация по гильдиям</VCardTitle>
        <div v-if="merchantIncomeByGuild.length > 0">
          <VTable>
            <thead>
              <tr>
                <th class="text-start">Гильдия</th>
                <th class="text-center">Общий доход</th>
                <th class="text-center">Общие расходы</th>
                <th class="text-center">Чистый поток</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="guild in merchantIncomeByGuild" :key="guild.guild_name">
                <td class="text-start font-weight-medium">{{ guild.guild_name }}</td>
                <td class="text-center text-success">{{ guild.total_income.toLocaleString('ru-RU') }} 💰</td>
                <td class="text-center text-error">
                  {{ (merchantExpenseByGuild.find(e => e.guild_name === guild.guild_name)?.total_expense || 0).toLocaleString('ru-RU') }} 💰
                </td>
                <td class="text-center" :class="(guild.total_income - (merchantExpenseByGuild.find(e => e.guild_name === guild.guild_name)?.total_expense || 0)) >= 0 ? 'text-success' : 'text-error'">
                  {{ (guild.total_income - (merchantExpenseByGuild.find(e => e.guild_name === guild.guild_name)?.total_expense || 0)).toLocaleString('ru-RU') }} 💰
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
        <div v-else class="text-center py-8">
          <VIcon icon="ri-table-line" size="48" class="text-disabled mb-2" />
          <div class="text-body-1 text-disabled">Нет данных</div>
        </div>
      </VCardText>
    </template>

    <VCardText v-else-if="!loading" class="text-center py-8">
      <VIcon icon="ri-line-chart-line" size="48" class="text-disabled mb-2" />
      <div class="text-body-1 text-disabled">Нет данных о торговле гильдий</div>
      <!-- Debug info -->
      <div v-if="false" class="text-caption mt-2">
        merchantGuildsStats: {{ JSON.stringify(merchantGuildsStats, null, 2) }}
      </div>
    </VCardText>
  </div>
</template>

<style scoped>
.summary-chip {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
}
</style>
