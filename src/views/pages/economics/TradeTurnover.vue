<script setup>
import axios from 'axios'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const tradeTurnovers = ref([])
const isLoading = ref(true)
const pollInterval = ref(null)

// Загружаем товарообороты всех стран
const fetchTradeTurnovers = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/show_trade_turnover.json`)
    console.log('Товарообороты:', response.data)
    tradeTurnovers.value = response.data
  } catch (error) {
    console.error('Error fetching trade turnovers:', error)
  }
}

// Загружаем данные при монтировании
onMounted(async () => {
  try {
    await fetchTradeTurnovers()
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
  
  // Устанавливаем периодический опрос каждые 30 секунд
  pollInterval.value = setInterval(fetchTradeTurnovers, 30000)
})

// Очищаем интервал при размонтировании
onBeforeUnmount(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
  }
})

// Обновить данные
const refreshData = async () => {
  isLoading.value = true
  try {
    await fetchTradeTurnovers()
  } finally {
    isLoading.value = false
  }
}

// Форматирование числа с разделителями
const formatNumber = (num) => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0'
}

// Получение короткого названия страны
const getShortName = (name) => {
  const shortNames = {
    'Большая Орда': 'Орда',
    'Ливонский орден': 'Ливония',
    'Королевство Швеция': 'Швеция',
    'Великое княжество Литовское': 'Литва',
    'Казанское ханство': 'Казань',
    'Крымское ханство': 'Крым',
  }
  return shortNames[name] || name
}

// Определение цвета товарооборота
const getTurnoverColor = (turnover) => {
  if (!turnover || turnover === 0) return 'grey'
  if (turnover > 10000) return 'success'
  if (turnover > 5000) return 'primary'
  if (turnover > 1000) return 'warning'
  return 'info'
}

// Определение уровня торговли
const getTurnoverLevel = (turnover) => {
  if (!turnover || turnover === 0) return 'Нет торговли'
  if (turnover > 10000) return 'Высокий'
  if (turnover > 5000) return 'Средний'
  if (turnover > 1000) return 'Низкий'
  return 'Минимальный'
}
</script>

<template>
  <div v-if="!isLoading" class="trade-turnover-container">
    
    <!-- Заголовок и кнопка обновления -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Товарооборот с иностранными государствами</span>
        <v-btn 
          color="primary" 
          @click="refreshData"
          :loading="isLoading"
        >
          <v-icon icon="mdi-refresh" class="mr-2" />
          Обновить
        </v-btn>
      </VCardTitle>
    </VCard>

    <!-- Таблица с товарооборотом -->
    <VCard>
      <VCardText>
        <v-table>
          <thead>
            <tr>
              <th class="text-left">Страна</th>
              <th class="text-center">Флаг</th>
              <th class="text-right">Товарооборот</th>
              <th class="text-center">Уровень торговли</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in tradeTurnovers" 
              :key="item.country_id"
            >
              <!-- Название страны -->
              <td class="text-left">
                <span class="font-weight-bold text-h6">{{ getShortName(item.country_name) }}</span>
              </td>
              
              <!-- Флаг -->
              <td class="text-center">
                <v-img
                  :src="`/images/countries/${item.country_name}.png`"
                  width="80"
                  height="60"
                  class="mx-auto"
                  style="border: 1px solid #ddd; border-radius: 4px;"
                />
              </td>
              
              <!-- Товарооборот -->
              <td class="text-right">
                <div>
                  <span 
                    class="text-h5 font-weight-bold"
                    style="color: #1976d2;"
                  >
                    {{ formatNumber(item.trade_turnover) }}
                  </span>
                  <span class="text-body-2 ml-2">золота</span>
                </div>
              </td>
              
              <!-- Уровень торговли -->
              <td class="text-center">
                <v-chip
                  :color="getTurnoverColor(item.trade_turnover)"
                  size="large"
                >
                  {{ getTurnoverLevel(item.trade_turnover) }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </VCardText>
    </VCard>

    <!-- Легенда -->
    <VCard class="mt-4">
      <VCardText>
        <h4 class="mb-3">Пояснение:</h4>
        <div class="text-body-2">
          <p><strong>Товарооборот</strong> — общая сумма всех торговых операций (покупок и продаж) между Русью и данной страной.</p>
          <p class="mb-2">Вычисляется как сумма товарооборотов всех караванов этой страны.</p>
        </div>
        <v-divider class="my-3"></v-divider>
        <div class="d-flex gap-4 align-center flex-wrap">
          <div class="d-flex align-center gap-2">
            <v-chip color="success" size="small">Высокий</v-chip>
            <span class="text-body-2">> 10,000 золота</span>
          </div>
          <div class="d-flex align-center gap-2">
            <v-chip color="primary" size="small">Средний</v-chip>
            <span class="text-body-2">5,001 - 10,000</span>
          </div>
          <div class="d-flex align-center gap-2">
            <v-chip color="warning" size="small">Низкий</v-chip>
            <span class="text-body-2">1,001 - 5,000</span>
          </div>
          <div class="d-flex align-center gap-2">
            <v-chip color="info" size="small">Минимальный</v-chip>
            <span class="text-body-2">1 - 1,000</span>
          </div>
          <div class="d-flex align-center gap-2">
            <v-chip color="grey" size="small">Нет торговли</v-chip>
            <span class="text-body-2">0</span>
          </div>
        </div>
      </VCardText>
    </VCard>

  </div>

  <div v-else class="loading-container">
    <v-progress-circular indeterminate size="64" />
    <div class="mt-4">Загрузка данных...</div>
  </div>
</template>

<style scoped>
.trade-turnover-container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
}
</style>

