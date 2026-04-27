<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { hexToRgb } from '@layouts/utils'

const props = defineProps({
  importChartData: {
    type: Object,
    default: () => ({ categories: [], series: [] })
  },
  exportChartData: {
    type: Object,
    default: () => ({ categories: [], series: [] })
  }
})

const vuetifyTheme = useTheme()

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
      categories: props.importChartData.categories,
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
      categories: props.exportChartData.categories,
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
</script>

<template>
  <div>
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
  </div>
</template>
