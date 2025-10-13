<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ExchangeMobile from './economics/ExchangeMobile.vue'
import ShowPricesMobile from './economics/ShowPricesMobile.vue'
import ProductionMobile from './economics/ProductionMobile.vue'

// Навигация между экранами
const currentScreen = ref('menu') // 'menu', 'caravan', 'production', 'prices'
const selectedCountryId = ref(null) // Для передачи в ExchangeMobile

// Переход на экраны
const goToCaravan = () => {
  currentScreen.value = 'caravan'
  selectedCountryId.value = null
}

const goToProduction = () => {
  currentScreen.value = 'production'
}

const goToPrices = () => {
  currentScreen.value = 'prices'
}

const backToMenu = () => {
  currentScreen.value = 'menu'
  selectedCountryId.value = null
}

// Обработка событий от дочерних компонентов
const handleOpenMarketFromPrices = (countryId) => {
  selectedCountryId.value = countryId
  currentScreen.value = 'caravan'
}

// Обработка кнопки "Назад" браузера
const handleBackButton = (event) => {
  if (currentScreen.value !== 'menu') {
    event.preventDefault()
    backToMenu()
  }
}

onMounted(() => {
  window.addEventListener('popstate', handleBackButton)
  window.history.pushState({ page: 'menu' }, '')
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handleBackButton)
})
</script>

<template>
  <v-app>
    <!-- ЭКРАН: Главное меню -->
    <VContainer fluid class="pa-0" v-if="currentScreen === 'menu'">
      <!-- Хедер -->
      <VToolbar color="#1976d2">
        <VToolbarTitle class="text-center" style="color: white; font-size: 22px; font-weight: 600; width: 100%;">
          Мобильная версия
        </VToolbarTitle>
      </VToolbar>

      <!-- Меню -->
      <div class="menu-grid pa-4">
        <VCard 
          class="menu-card"
          elevation="4"
          @click="goToCaravan"
        >
          <VCardText class="pa-6 text-center">
            <VIcon icon="mdi-shopping" size="64" color="warning" class="mb-3" />
            <div class="text-h5 font-weight-bold">
              Рассчитать караван
            </div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              Выбрать страну и отправить ресурсы
            </div>
          </VCardText>
        </VCard>

        <VCard 
          class="menu-card"
          elevation="4"
          @click="goToProduction"
        >
          <VCardText class="pa-6 text-center">
            <VIcon icon="mdi-factory" size="64" color="primary" class="mb-3" />
            <div class="text-h5 font-weight-bold">
              Рассчитать производство
            </div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              Калькулятор переработки ресурсов
            </div>
          </VCardText>
        </VCard>

        <VCard 
          class="menu-card"
          elevation="4"
          @click="goToPrices"
        >
          <VCardText class="pa-6 text-center">
            <VIcon icon="mdi-currency-usd" size="64" color="success" class="mb-3" />
            <div class="text-h5 font-weight-bold">
              Посмотреть цены
            </div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              Актуальные цены на ресурсы
            </div>
          </VCardText>
        </VCard>
      </div>
    </VContainer>

    <!-- ЭКРАН: Караван -->
    <div v-if="currentScreen === 'caravan'">
      <ExchangeMobile 
        :initial-country-id="selectedCountryId"
        @back-to-menu="backToMenu"
      />
    </div>

    <!-- ЭКРАН: Производство -->
    <div v-if="currentScreen === 'production'">
      <ProductionMobile @back="backToMenu" />
    </div>

    <!-- ЭКРАН: Цены -->
    <div v-if="currentScreen === 'prices'">
      <ShowPricesMobile 
        @back="backToMenu"
        @open-market="handleOpenMarketFromPrices"
      />
    </div>
  </v-app>
</template>

<style scoped>
.menu-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.menu-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
}

.menu-card:active {
  transform: translateY(-2px);
}
</style>

