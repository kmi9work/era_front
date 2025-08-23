<script setup>
import { storeToRefs } from 'pinia'
import { useMerchantResultsStore } from '@/stores/merchant_results'
import { onMounted, computed } from 'vue'

const merchantStore = useMerchantResultsStore()
const { isLoading, errorMessage } = storeToRefs(merchantStore)

// Используем computed для получения актуального списка
const merchantsList = computed(() => merchantStore.getFilteredResults)

onMounted(() => {
  merchantStore.fetchMerchantResults()
})

// Для отладки
console.log('Initial merchants:', merchantsList.value)
</script>

<template>
  <VCard>
    <div v-if="isLoading">Загрузка...</div>
    <div v-else-if="errorMessage">{{ errorMessage }}</div>
    <div v-else>
      <div v-if="merchantsList.length === 0">Нет данных о купцах</div>
      <div v-else>
        <div v-for="merchant in merchantsList" :key="merchant.id || merchant._id">
          {{ merchant }}
        </div>

        <div>
        	{{merchantStore.showResultsLevel}}
        </div>
      </div>
    </div>
  </VCard>
</template>