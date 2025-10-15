<script setup>
import { ref, onMounted, onBeforeUnmount, provide } from 'vue'
import ExchangeMobile from './economics/ExchangeMobile.vue'
import ShowPricesMobile from './economics/ShowPricesMobile.vue'
import ProductionMobile from './economics/ProductionMobile.vue'

// Навигация между экранами
const currentScreen = ref('menu') // 'menu', 'caravan', 'production', 'prices'
const selectedCountryId = ref(null) // Для передачи в ExchangeMobile
const cameFromPrices = ref(false) // Флаг: пришли ли из экрана цен

// Референсы для всех компонентов
const productionMobileRef = ref(null)
const exchangeMobileRef = ref(null)
const showPricesMobileRef = ref(null)

// Переход на экраны
const goToCaravan = () => {
  currentScreen.value = 'caravan'
  selectedCountryId.value = null
  cameFromPrices.value = false
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
  cameFromPrices.value = false
}

const backToPrices = () => {
  currentScreen.value = 'prices'
  selectedCountryId.value = null
  cameFromPrices.value = false
}

// Обработка событий от дочерних компонентов
const handleOpenMarketFromPrices = (countryId) => {
  selectedCountryId.value = countryId
  cameFromPrices.value = true
  currentScreen.value = 'caravan'
}

// Мапа экранов на их ref-ы
const componentRefs = {
  production: productionMobileRef,
  caravan: exchangeMobileRef,
  prices: showPricesMobileRef
}

// Обработка кнопки "Назад" телефона
const handleBackButton = (event) => {
  // Если на главном меню - разрешаем закрытие приложения
  if (currentScreen.value === 'menu') {
    return
  }
  
  // Для всех остальных экранов - вызываем handleBack()
  event.preventDefault()
  const currentRef = componentRefs[currentScreen.value]
  if (currentRef?.value) {
    currentRef.value.handleBack()
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
      <!-- Меню -->
      <div class="menu-container">
        <!-- Заголовок -->
        <div class="menu-header">
          <h1 class="menu-title">Помощник торговца</h1>
          <p class="menu-subtitle">Выберите действие</p>
        </div>

        <!-- Опции меню -->
        <div class="menu-list">
          <VCard 
            class="menu-item"
            elevation="2"
            @click="goToCaravan"
            ripple
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper market-icon">
                <VIcon icon="mdi-cart" size="40" color="white" />
              </div>
              <div class="menu-text">
                <div class="menu-item-title">Рынок</div>
                <div class="menu-item-description">Торговля ресурсами между странами</div>
              </div>
              <VIcon icon="mdi-chevron-right" size="32" color="grey-lighten-1" class="menu-arrow" />
            </div>
          </VCard>

          <VCard 
            class="menu-item"
            elevation="2"
            @click="goToProduction"
            ripple
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper production-icon">
                <VIcon icon="mdi-factory" size="40" color="white" />
              </div>
              <div class="menu-text">
                <div class="menu-item-title">Производство</div>
                <div class="menu-item-description">Калькулятор переработки ресурсов</div>
              </div>
              <VIcon icon="mdi-chevron-right" size="32" color="grey-lighten-1" class="menu-arrow" />
            </div>
          </VCard>

          <VCard 
            class="menu-item"
            elevation="2"
            @click="goToPrices"
            ripple
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper prices-icon">
                <VIcon icon="mdi-currency-usd" size="40" color="white" />
              </div>
              <div class="menu-text">
                <div class="menu-item-title">Цены</div>
                <div class="menu-item-description">Актуальные цены на все ресурсы</div>
              </div>
              <VIcon icon="mdi-chevron-right" size="32" color="grey-lighten-1" class="menu-arrow" />
            </div>
          </VCard>
        </div>
      </div>
    </VContainer>

    <!-- ЭКРАН: Караван -->
    <div v-if="currentScreen === 'caravan'">
      <ExchangeMobile 
        ref="exchangeMobileRef"
        :initial-country-id="selectedCountryId"
        :came-from-prices="cameFromPrices"
        @back-to-menu="backToMenu"
        @back-to-prices="backToPrices"
      />
    </div>

    <!-- ЭКРАН: Производство -->
    <div v-if="currentScreen === 'production'">
      <ProductionMobile ref="productionMobileRef" @back="backToMenu" />
    </div>

    <!-- ЭКРАН: Цены -->
    <div v-if="currentScreen === 'prices'">
      <ShowPricesMobile 
        ref="showPricesMobileRef"
        @back="backToMenu"
        @open-market="handleOpenMarketFromPrices"
      />
    </div>
  </v-app>
</template>

<style scoped>
.menu-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 16px;
}

.menu-header {
  text-align: center;
  margin-bottom: 32px;
  padding-top: 40px;
}

.menu-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.menu-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 8px 0 0 0;
  font-weight: 400;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.menu-item {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px !important;
  overflow: hidden;
  background: white;
}

.menu-item:active {
  transform: scale(0.98);
}

.menu-item-content {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  gap: 16px;
}

.menu-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.market-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.production-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.prices-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.menu-text {
  flex: 1;
  min-width: 0;
}

.menu-item-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.menu-item-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.menu-arrow {
  flex-shrink: 0;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.menu-item:hover .menu-arrow {
  opacity: 1;
  transform: translateX(4px);
}

/* Адаптация для маленьких экранов */
@media (max-width: 360px) {
  .menu-item-content {
    padding: 16px 12px;
  }
  
  .menu-icon-wrapper {
    width: 56px;
    height: 56px;
  }
  
  .menu-item-title {
    font-size: 18px;
  }
  
  .menu-item-description {
    font-size: 13px;
  }
}
</style>

