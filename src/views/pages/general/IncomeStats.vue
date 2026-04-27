<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { hexToRgb } from '@layouts/utils'

const props = defineProps({
  incomeStats: {
    type: Object,
    default: null
  },
  summaryStats: {
    type: Object,
    default: null
  },
  troopPaymentsStats: {
    type: Object,
    default: null
  },
  troopPurchasesStats: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const vuetifyTheme = useTheme()
const expandedYears = ref([])

const hasData = computed(() => {
  return props.incomeStats && 
         props.incomeStats.by_year && 
         props.incomeStats.by_year.length > 0
})

const hasSummaryData = computed(() => {
  return props.summaryStats && 
         props.summaryStats.total_trade_income !== undefined
})

const troopPaymentsChartOptions = computed(() => {
  if (!props.troopPaymentsStats || !props.troopPaymentsStats.by_year) {
    return {}
  }
  
  return {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: true
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
        distributed: false
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val.toLocaleString('ru-RU') + ' 💰'
      }
    },
    legend: {
      position: 'top',
      show: true
    },
    xaxis: {
      categories: props.troopPaymentsStats.by_year.map(y => `Год ${y.year}`),
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Золото',
        style: {
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function (val) {
          return val.toLocaleString('ru-RU')
        }
      }
    },
    colors: ['#9C27B0'],
    tooltip: {
      y: {
        formatter: function (val) {
          return val.toLocaleString('ru-RU') + ' золотых монет'
        }
      }
    }
  }
})

const troopPaymentsSeries = computed(() => {
  if (!props.troopPaymentsStats || !props.troopPaymentsStats.by_year) {
    return []
  }
  
  return [{
    name: 'Оплата войск',
    data: props.troopPaymentsStats.by_year.map(y => y.total_cost)
  }]
})

const troopPurchasesChartOptions = computed(() => {
  if (!props.troopPurchasesStats || !props.troopPurchasesStats.by_year) {
    return {}
  }
  
  return {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: true
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
        distributed: false
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val.toLocaleString('ru-RU') + ' 💰'
      }
    },
    legend: {
      position: 'top',
      show: true
    },
    xaxis: {
      categories: props.troopPurchasesStats.by_year.map(y => `Год ${y.year}`),
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Золото',
        style: {
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function (val) {
          return val.toLocaleString('ru-RU')
        }
      }
    },
    colors: ['#FF5722'],
    tooltip: {
      y: {
        formatter: function (val) {
          return val.toLocaleString('ru-RU') + ' золотых монет'
        }
      }
    }
  }
})

const troopPurchasesSeries = computed(() => {
  if (!props.troopPurchasesStats || !props.troopPurchasesStats.by_year) {
    return []
  }
  
  return [{
    name: 'Покупка войск',
    data: props.troopPurchasesStats.by_year.map(y => y.total_cost)
  }]
})

const formatCurrency = (value) => {
  return value.toLocaleString('ru-RU') + ' 💰'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleYear = (year) => {
  const index = expandedYears.value.indexOf(year)
  if (index === -1) {
    expandedYears.value.push(year)
  } else {
    expandedYears.value = expandedYears.value.filter(y => y !== year)
  }
}
</script>

<template>
  <div>
    <VCardItem>
      <VCardTitle>
        <VIcon icon="ri-coins-line" class="me-2" />
        Статистика доходов знати
      </VCardTitle>
      <VCardSubtitle>Доходы по годам и общая статистика</VCardSubtitle>
    </VCardItem>

    <VCardText v-if="loading" class="text-center py-8">
      <VProgressCircular indeterminate color="primary" />
      <div class="mt-2">Загрузка данных...</div>
    </VCardText>

    <template v-else-if="hasSummaryData">
      <!-- Summary Cards Section -->
      <VCardText class="pb-0">
        <VRow>
          <VCol cols="12" md="6" lg="3">
            <VSheet class="summary-chip" color="success" variant="tonal">
              <VIcon icon="ri-currency-dollar-line" size="24" class="me-3 text-success" />
              <div>
                <div class="text-caption text-medium-emphasis">Доход от торговли</div>
                <div class="text-h6 mb-0">{{ formatCurrency(summaryStats.total_trade_income) }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="6" lg="3">
            <VSheet class="summary-chip" color="error" variant="tonal">
              <VIcon icon="ri-hand-coin-line" size="24" class="me-3 text-error" />
              <div>
                <div class="text-caption text-medium-emphasis">Расход на торговлю</div>
                <div class="text-h6 mb-0">{{ formatCurrency(summaryStats.total_trade_outcome) }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="6" lg="3">
            <VSheet class="summary-chip" color="warning" variant="tonal">
              <VIcon icon="ri-account-circle-line" size="24" class="me-3 text-warning" />
              <div>
                <div class="text-caption text-medium-emphasis">Доход знати</div>
                <div class="text-h6 mb-0">{{ formatCurrency(summaryStats.total_noble_income) }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="6" lg="3">
            <VSheet class="summary-chip" color="info" variant="tonal">
              <VIcon icon="ri-government-line" size="24" class="me-3 text-info" />
              <div>
                <div class="text-caption text-medium-emphasis">Полит. расходы (дворяне)</div>
                <div class="text-h6 mb-0">{{ formatCurrency(summaryStats.political_actions_cost) }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="6" lg="3">
            <VSheet class="summary-chip" color="teal" variant="tonal">
              <VIcon icon="ri-store-2-line" size="24" class="me-3 text-teal" />
              <div>
                <div class="text-caption text-medium-emphasis">Полит. расходы (купцы)</div>
                <div class="text-h6 mb-0">{{ formatCurrency(summaryStats.merchant_political_actions_cost || 0) }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="6" lg="3">
            <VSheet class="summary-chip" color="purple" variant="tonal">
              <VIcon icon="ri-shield-line" size="24" class="me-3 text-purple" />
              <div>
                <div class="text-caption text-medium-emphasis">Оплата войск</div>
                <div class="text-h6 mb-0">{{ formatCurrency(summaryStats.troop_payments_cost || 0) }}</div>
                <div class="text-caption opacity-75">{{ summaryStats.troop_payments_count || 0 }} оплат</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="6" lg="3">
            <VSheet class="summary-chip" color="deep-orange" variant="tonal">
              <VIcon icon="ri-sword-line" size="24" class="me-3 text-deep-orange" />
              <div>
                <div class="text-caption text-medium-emphasis">Покупка войск</div>
                <div class="text-h6 mb-0">{{ formatCurrency(summaryStats.troop_purchases_cost || 0) }}</div>
                <div class="text-caption opacity-75">{{ summaryStats.troop_purchases_count || 0 }} покупок</div>
              </div>
            </VSheet>
          </VCol>
        </VRow>

        <!-- Cashflow Card -->
        <VRow class="mt-4">
          <VCol cols="12">
            <VSheet 
              class="summary-chip cashflow-chip" 
              :color="summaryStats.total_cashflow >= 0 ? 'success' : 'error'" 
              variant="tonal"
            >
              <VIcon 
                :icon="summaryStats.total_cashflow >= 0 ? 'ri-trending-up-line' : 'ri-trending-down-line'" 
                size="32" 
                class="me-3" 
              />
              <div>
                <div class="text-caption text-medium-emphasis">Общий денежный поток</div>
                <div class="text-h5 mb-0 font-weight-bold">
                  {{ formatCurrency(summaryStats.total_cashflow) }}
                </div>
                <div class="text-caption mt-1 opacity-75">
                  = Торговля ({{ formatCurrency(summaryStats.total_trade_income - summaryStats.total_trade_outcome) }}) + Знать ({{ formatCurrency(summaryStats.total_noble_income) }}) - Политика дворяне ({{ formatCurrency(summaryStats.political_actions_cost) }}) - Политика купцы ({{ formatCurrency(summaryStats.merchant_political_actions_cost || 0) }}) - Оплата войск ({{ formatCurrency(summaryStats.troop_payments_cost || 0) }}) - Покупка войск ({{ formatCurrency(summaryStats.troop_purchases_cost || 0) }})
                </div>
              </div>
            </VSheet>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider class="my-4" />

      <!-- Troop Payments Chart -->
      <VCardText v-if="troopPaymentsStats && troopPaymentsStats.by_year && troopPaymentsStats.by_year.length > 0" class="pt-4">
        <VCardTitle class="mb-4">Оплата войск по годам</VCardTitle>
        <VApexChart
          type="bar"
          height="350"
          :options="troopPaymentsChartOptions"
          :series="troopPaymentsSeries"
        />
      </VCardText>

      <!-- Troop Purchases Chart -->
      <VCardText v-if="troopPurchasesStats && troopPurchasesStats.by_year && troopPurchasesStats.by_year.length > 0" class="pt-4">
        <VCardTitle class="mb-4">Покупка войск знатью по годам</VCardTitle>
        <VApexChart
          type="bar"
          height="350"
          :options="troopPurchasesChartOptions"
          :series="troopPurchasesSeries"
        />
      </VCardText>
      <!-- Сводные карточки -->
      <VCardText class="pb-0">
        <VRow>
          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="success" variant="tonal">
              <VIcon icon="ri-treasure-map-line" size="24" class="me-3 text-success" />
              <div>
                <div class="text-caption text-medium-emphasis">Всего получено за все время</div>
                <div class="text-h6 mb-0">{{ formatCurrency(incomeStats.total_all_time_income) }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="info" variant="tonal">
              <VIcon icon="ri-calendar-check-line" size="24" class="me-3 text-info" />
              <div>
                <div class="text-caption text-medium-emphasis">Всего случаев получения</div>
                <div class="text-h6 mb-0">{{ incomeStats.total_income_events }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="warning" variant="tonal">
              <VIcon icon="ri-average-line" size="24" class="me-3 text-warning" />
              <div>
                <div class="text-caption text-medium-emphasis">Средний доход за событие</div>
                <div class="text-h6 mb-0">
                  {{ formatCurrency(Math.round(incomeStats.total_all_time_income / (incomeStats.total_income_events || 1))) }}
                </div>
              </div>
            </VSheet>
          </VCol>
        </VRow>
      </VCardText>

      <!-- Таблица по годам -->
      <VCardText class="pt-4">
        <VCardTitle class="mb-4">Доходы по годам</VCardTitle>
        <div v-if="incomeStats.by_year && incomeStats.by_year.length > 0">
          <VTable>
            <thead>
              <tr>
                <th class="text-start">Год</th>
                <th class="text-center">Общий доход</th>
                <th class="text-center">Знати получило</th>
                <th class="text-center">Детали</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="yearStat in incomeStats.by_year" :key="yearStat.year">
                <td class="text-start font-weight-medium">{{ yearStat.year }}</td>
                <td class="text-center text-success">{{ formatCurrency(yearStat.total_income) }}</td>
                <td class="text-center">{{ yearStat.nobles_count }}</td>
                <td class="text-center">
                  <VBtn
                    size="small"
                    variant="text"
                    @click="toggleYear(yearStat.year)"
                  >
                    {{ expandedYears.includes(yearStat.year) ? 'Скрыть' : 'Показать' }}
                    <VIcon :icon="expandedYears.includes(yearStat.year) ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'" size="small" />
                  </VBtn>
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCardText>

      <!-- Детали по каждому году -->
      <VCardText v-for="yearStat in incomeStats.by_year" :key="yearStat.year" class="pt-0" v-show="expandedYears.includes(yearStat.year)">
        <VCard flat class="ma-2 pa-4" variant="outlined">
          <VCardTitle class="text-h6 mb-4">
            Год {{ yearStat.year }} - Детализация
          </VCardTitle>
          <VList v-if="yearStat.nobles && yearStat.nobles.length > 0" density="compact">
            <VListItem
              v-for="(noble, index) in yearStat.nobles"
              :key="index"
            >
              <template v-slot:prepend>
                <VIcon icon="ri-account-circle-line" size="small" color="primary" />
              </template>
              <VListItemTitle>
                <span class="font-weight-medium">{{ noble.player_name }}</span>
              </VListItemTitle>
              <VListItemSubtitle>
                <span class="text-success">{{ formatCurrency(noble.income) }}</span>
                <span class="text-disabled ml-4">Дата: {{ formatDate(noble.taken_at) }}</span>
              </VListItemSubtitle>
            </VListItem>
          </VList>
          <div v-else class="text-center py-4 text-disabled">
            Нет данных за этот год
          </div>
        </VCard>
      </VCardText>

      <!-- Топ знати -->
      <VCardText class="pt-4">
        <VCardTitle class="mb-4">Топ знати по общему доходу</VCardTitle>
        <div v-if="incomeStats.top_nobles && incomeStats.top_nobles.length > 0">
          <VTable>
            <thead>
              <tr>
                <th class="text-start">#</th>
                <th class="text-start">Имя</th>
                <th class="text-center">Общий доход</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(noble, index) in incomeStats.top_nobles" :key="noble.name">
                <td class="text-start">
                  <VChip size="small" :color="index < 3 ? 'warning' : 'grey'" class="font-weight-bold">
                    {{ index + 1 }}
                  </VChip>
                </td>
                <td class="text-start font-weight-medium">{{ noble.name }}</td>
                <td class="text-center text-success font-weight-bold">{{ formatCurrency(noble.total_income) }}</td>
              </tr>
            </tbody>
          </VTable>
        </div>
        <div v-else class="text-center py-8 text-disabled">
          <VIcon icon="ri-trophy-line" size="48" class="mb-2" />
          <div>Нет данных для рейтинга</div>
        </div>
      </VCardText>
    </template>

    <VCardText v-else-if="!loading" class="text-center py-8">
      <VIcon icon="ri-wallet-3-line" size="48" class="text-disabled mb-2" />
      <div class="text-body-1 text-disabled">Нет данных о доходах знати</div>
      <div class="text-caption text-disabled mt-2">Знать еще не получала доход</div>
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

.cashflow-chip {
  padding: 16px 20px;
}
</style>
