<script setup>
import { storeToRefs } from 'pinia'
import { useMerchantResultsStore } from '@/stores/merchant_results'
import { onMounted, computed, watch, ref } from 'vue'

const merchantStore = useMerchantResultsStore()
const { isLoading, errorMessage, showResultsLevel } = storeToRefs(merchantStore)

// Используем computed для получения актуального списка
const merchantsList = computed(() => merchantStore.getFilteredResults)

// Добавляем ref для отслеживания изменений
const currentFilteredList = ref([])
const lastUpdateTime = ref(null)

onMounted(() => {
  merchantStore.fetchMerchantResults()
  merchantStore.startPolling() // Запускаем polling если нужно
  
  // Инициализируем текущий список
  currentFilteredList.value = merchantsList.value
})

// Watch для отслеживания изменения showResultsLevel
// watch(showResultsLevel, (newLevel, oldLevel) => {
//   console.log(`showResultsLevel changed from ${oldLevel} to ${newLevel}`)
  
//   // Обновляем отфильтрованный список при изменении уровня
//   currentFilteredList.value = merchantStore.getFilteredResults
//   lastUpdateTime.value = new Date().toLocaleTimeString()
  
//   console.log('Filtered list updated:', currentFilteredList.value.length, 'items')
// })

// // Также отслеживаем изменения в основном списке merchants
// watch(() => merchantStore.merchantsList, (newList) => {
//   console.log('Merchants list updated:', newList.length, 'items')
  
//   // Обновляем отфильтрованный список при изменении основного списка
//   currentFilteredList.value = merchantStore.getFilteredResults
//   lastUpdateTime.value = new Date().toLocaleTimeString()
// })

// // Для отладки
// console.log('Initial merchants:', merchantsList.value)
</script>

<template>
  <VCard>
    <div class="debug-info">
      <div>Текущий уровень показа: <strong>{{ showResultsLevel }}</strong></div>
      <div v-if="lastUpdateTime">Обновлено: {{ lastUpdateTime }}</div>
      <div>Всего записей: {{ merchantStore.merchantsList.length }}</div>
      <div>Отфильтровано: {{ currentFilteredList.length }}</div>
    </div>

    <div v-if="isLoading">Загрузка...</div>
    <div v-else-if="errorMessage">{{ errorMessage }}</div>
    <div v-else>
      <div v-if="currentFilteredList.length === 0">Нет данных для отображения (уровень: {{ showResultsLevel }})</div>
      <div v-else>
        <div v-for="merchant in currentFilteredList" :key="merchant.id || merchant._id" class="merchant-item">
          <pre>{{ JSON.stringify(merchant, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </VCard>
</template>

<style scoped>
.debug-info {
  background: #f5f5f5;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 5px;
  font-size: 12px;
}

.merchant-item {
  padding: 10px;
  margin: 8px 0;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fafafa;
}

.merchant-item pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
}
</style>