<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const emit = defineEmits(['open-market'])

// Данные
const resources = ref({ off_market: [], to_market: [] })
const countries = ref([])
const isLoading = ref(true)

// Получение данных
const fetchCountries = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/foreign_countries.json`)
    countries.value = response.data
  } catch (error) {
    console.error('Error fetching countries:', error)
  }
}

const fetchResources = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/resources/show_prices.json`)
    resources.value = response.data.prices
  } catch (error) {
    console.error('Error fetching resources:', error)
  }
}

// Объединяем все ресурсы с информацией о ценах
const allResourcesWithPrices = computed(() => {
  const result = []
  
  // Добавляем ресурсы из to_market (игрок продает)
  resources.value.to_market?.forEach(res => {
    const countryId = res.country_id || res.country?.id
    const country = countries.value.find(c => c.id === countryId)
    
    result.push({
      identificator: res.identificator,
      name: res.name,
      sellPrice: res.sell_price || res.price, // Цена продажи игроком
      buyPrice: null,
      country: country,
      countryId: countryId
    })
  })
  
  // Добавляем информацию о покупке (игрок покупает)
  resources.value.off_market?.forEach(res => {
    const countryId = res.country_id || res.country?.id
    const country = countries.value.find(c => c.id === countryId)
    
    // Ищем, есть ли уже такой ресурс для этой страны
    const existing = result.find(r => 
      r.identificator === res.identificator && r.countryId === countryId
    )
    
    if (existing) {
      existing.buyPrice = res.buy_price || res.price // Цена покупки игроком
    } else {
      result.push({
        identificator: res.identificator,
        name: res.name,
        sellPrice: null,
        buyPrice: res.buy_price || res.price,
        country: country,
        countryId: countryId
      })
    }
  })
  
  // Фильтруем золото
  return result.filter(r => r.identificator !== 'gold')
})

const openMarket = (countryId) => {
  emit('open-market', countryId)
}


onMounted(async () => {
  isLoading.value = true
  await fetchCountries()
  await fetchResources()
  isLoading.value = false
})
</script>

<template>
  <VApp>
    <VContainer fluid class="pa-0">
      <!-- Хедер -->
      <VToolbar color="#1976d2">
        <VBtn 
          @click="$emit('back')" 
          variant="text"
          block
          style="color: white !important; font-size: 20px !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: normal !important;"
        >
          Назад
        </VBtn>
      </VToolbar>

      <!-- Подзаголовок -->
    

      <!-- Загрузка -->
      <div v-if="isLoading" class="text-center pa-8">
        <VProgressCircular indeterminate color="primary" size="64" />
      </div>

      <!-- Сетка ресурсов с ценами -->
      <div v-else class="prices-grid">
        <div
          v-for="(item, index) in allResourcesWithPrices"
          :key="`price-${item.identificator}-${item.countryId}-${index}`"
          class="price-card"
          @click="openMarket(item.countryId)"
        >
          <!-- Отношения в левом верхнем углу -->
          <VImg
            v-if="item.country"
            :src="`/images/relations/${item.country.relations || 0}.png`"
            width="24"
            height="24"
            class="relations-badge"
          />
          
          <!-- Герб страны в правом верхнем углу -->
          <VImg
            v-if="item.country"
            :src="`/images/countries/${item.country.name}.png`"
            width="24"
            height="18"
            class="country-flag-corner"
          />

          <!-- Иконка ресурса -->
          <VImg
            :src="`/images/resources/${item.identificator}.png`"
            width="56"
            height="56"
            class="resource-icon-price"
          />

          <!-- Цены -->
          <div class="price-info">
            <div class="price-sell" :class="{ 'price-unavailable-item': item.sellPrice === null }">
              <span class="price-label">Продажа:</span>
              <span class="price-value">{{ item.sellPrice !== null ? item.sellPrice : '—' }}</span>
            </div>
            <div class="price-buy" :class="{ 'price-unavailable-item': item.buyPrice === null }">
              <span class="price-label">Покупка:</span>
              <span class="price-value">{{ item.buyPrice !== null ? item.buyPrice : '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </VContainer>
  </VApp>
</template>

<style scoped>
/* Сетка цен */
.prices-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 16px;
}

/* Карточка цены */
.price-card {
  position: relative;
  background: white;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
}

.price-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.price-card:active {
  transform: translateY(0);
  border-color: #1976d2;
}

/* Отношения в левом верхнем углу */
.relations-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  opacity: 0.6;
  border-radius: 2px;
}

/* Флаг страны в углу */
.country-flag-corner {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0.6;
  border-radius: 2px;
}

/* Иконка ресурса */
.resource-icon-price {
  flex-shrink: 0;
}

/* Информация о ценах */
.price-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  font-size: 12px;
}

.price-sell,
.price-buy {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px;
  border-radius: 4px;
}

.price-sell {
  background-color: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
}

.price-buy {
  background-color: rgba(33, 150, 243, 0.1);
  color: #1565c0;
}

.price-label {
  font-weight: 600;
  font-size: 10px;
}

.price-value {
  font-weight: 700;
  font-size: 12px;
}

.price-unavailable {
  text-align: center;
  color: #999;
  font-size: 16px;
}

.price-unavailable-item {
  background-color: rgba(158, 158, 158, 0.1) !important;
  color: #757575 !important;
}

.price-unavailable-item .price-value {
  color: #999 !important;
}
</style>

