<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { hexToRgb } from '@layouts/utils'

const props = defineProps({
  plantLevelsChartData: {
    type: Object,
    default: () => ({ categories: [], series: [] })
  },
  guildOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:selectedGuild'])

const vuetifyTheme = useTheme()

const selectedGuildForChart = ref('all')

// Настройки графика уровней предприятий
const plantLevelsChartOptions = computed(() => {
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
      categories: props.plantLevelsChartData.categories,
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
</script>

<template>
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
          style="min-width: 200px"
          @update:model-value="emit('update:selectedGuild', selectedGuildForChart)"
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
</template>
