<script setup>
import { ref, onBeforeMount, computed } from 'vue'
import axios from 'axios'

const yearlyStats = ref({})
const expandedYears = ref(new Set())

// Загружаем статистику по годам
async function loadYearlyStats() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/audits/yearly_stats.json`)
    yearlyStats.value = response.data
  } catch (error) {
    console.error('Ошибка при загрузке статистики по годам:', error)
  }
}

// Получаем отсортированные годы
const sortedYears = computed(() => {
  return Object.keys(yearlyStats.value).sort((a, b) => parseInt(b) - parseInt(a))
})

// Переключаем развернутое состояние года
function toggleYear(year) {
  if (expandedYears.value.has(year)) {
    expandedYears.value.delete(year)
  } else {
    expandedYears.value.add(year)
  }
}

// Проверяем, развернут ли год
function isYearExpanded(year) {
  return expandedYears.value.has(year)
}

// Получаем статистику для года
function getYearStats(year) {
  return yearlyStats.value[year] || {}
}

// Получаем отсортированные категории для года
function getSortedCategories(yearStats) {
  return Object.keys(yearStats).sort((a, b) => {
    const order = ['Политические действия', 'Действия купцов', 'Владения', 'Армии', 'Строительство', 'Финансы', 'Влияние', 'Общественный порядок', 'Технологии', 'Сражения', 'Должности', 'Игра', 'Прочее']
    const indexA = order.indexOf(a)
    const indexB = order.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

onBeforeMount(() => {
  loadYearlyStats()
})
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Статистика по годам</VCardTitle>
      <VCardSubtitle>События, произошедшие в каждом году</VCardSubtitle>
    </VCardItem>

    <VCardText>
      <div v-if="Object.keys(yearlyStats).length === 0" class="text-center py-4">
        <VIcon icon="ri-calendar-line" size="48" class="text-disabled mb-2" />
        <div class="text-body-1 text-disabled">Нет данных для отображения</div>
      </div>

      <div v-else>
        <VExpansionPanels v-model="expandedYears" multiple>
          <VExpansionPanel
            v-for="year in sortedYears"
            :key="year"
            :value="year"
          >
            <VExpansionPanelTitle>
              <div class="d-flex align-center justify-space-between w-100">
                <div class="d-flex align-center">
                  <VIcon icon="ri-calendar-line" class="me-2" />
                  <span class="text-h6">{{ year }} год</span>
                </div>
                <div class="d-flex align-center">
                  <VChip
                    v-for="(count, category) in getYearStats(year)"
                    :key="category"
                    size="small"
                    class="me-1"
                    :color="getCategoryColor(category)"
                  >
                    {{ category }}: {{ count }}
                  </VChip>
                </div>
              </div>
            </VExpansionPanelTitle>

            <VExpansionPanelText>
              <div class="pa-4">
                <VRow>
                  <VCol
                    v-for="category in getSortedCategories(getYearStats(year))"
                    :key="category"
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                  >
                    <VCard
                      :color="getCategoryColor(category)"
                      variant="tonal"
                      class="h-100"
                    >
                      <VCardText class="text-center">
                        <VIcon
                          :icon="getCategoryIcon(category)"
                          size="32"
                          class="mb-2"
                        />
                        <div class="text-h6">{{ getYearStats(year)[category] }}</div>
                        <div class="text-body-2">{{ category }}</div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </div>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </div>
    </VCardText>
  </VCard>
</template>

<script>
// Функции для получения цветов и иконок категорий
function getCategoryColor(category) {
  const colors = {
    'Политические действия': 'orange',
    'Действия купцов': 'green',
    'Владения': 'blue',
    'Армии': 'pink',
    'Строительство': 'purple',
    'Финансы': 'success',
    'Влияние': 'info',
    'Общественный порядок': 'warning',
    'Технологии': 'indigo',
    'Сражения': 'red',
    'Должности': 'deep-purple',
    'Игра': 'blue-grey',
    'Прочее': 'grey'
  }
  return colors[category] || 'grey'
}

function getCategoryIcon(category) {
  const icons = {
    'Политические действия': 'mdi-crown',
    'Действия купцов': 'mdi-store',
    'Владения': 'mdi-domain',
    'Армии': 'mdi-shield-account',
    'Строительство': 'mdi-hammer-wrench',
    'Финансы': 'mdi-currency-usd',
    'Влияние': 'mdi-trending-up',
    'Общественный порядок': 'mdi-gavel',
    'Технологии': 'mdi-cog',
    'Сражения': 'mdi-sword-cross',
    'Должности': 'mdi-account-tie',
    'Игра': 'mdi-cog',
    'Прочее': 'mdi-help-circle'
  }
  return icons[category] || 'mdi-help-circle'
}
</script>

<style scoped>
.v-expansion-panel-title {
  padding: 16px;
}

.v-expansion-panel-text__wrapper {
  padding: 0;
}
</style>
