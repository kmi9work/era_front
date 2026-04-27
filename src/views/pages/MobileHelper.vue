<script setup>
import { ref, onMounted, onBeforeUnmount, provide } from 'vue'
import ExchangeMobile from './economics/ExchangeMobile.vue'
import ShowPricesMobile from './economics/ShowPricesMobile.vue'
import ProductionMobile from './economics/ProductionMobile.vue'
import '@/assets/fonts/fonts.css'

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
          <h1 class="menu-title">Помощник купца</h1>
        </div>

        <!-- Опции меню -->
        <div class="menu-list">
          <VCard 
            class="menu-item"
            elevation="2"
            @click="goToPrices"
            ripple
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <img src="@/assets/images/prices.jpeg" alt="Цены" class="menu-image" />
              </div>
              <div class="menu-text">
                <div class="menu-item-title">Цены</div>
                <div class="menu-item-description">Посмотреть актуальные цены на все ресурсы</div>
              </div>
              <VIcon icon="mdi-chevron-right" size="32" color="white" class="menu-arrow" />
            </div>
          </VCard>

          <VCard 
            class="menu-item"
            elevation="2"
            @click="goToCaravan"
            ripple
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <img src="@/assets/images/market.jpg" alt="Рынок" class="menu-image" />
              </div>
              <div class="menu-text">
                <div class="menu-item-title">Рынок</div>
                <div class="menu-item-description">Рассчитать отправку каравана</div>
              </div>
              <VIcon icon="mdi-chevron-right" size="32" color="white" class="menu-arrow" />
            </div>
          </VCard>

          <VCard 
            class="menu-item"
            elevation="2"
            @click="goToProduction"
            ripple
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <img src="@/assets/images/production.jpeg" alt="Производство" class="menu-image" />
              </div>
              <div class="menu-text">
                <div class="menu-item-title">Производство</div>
                <div class="menu-item-description">Рассчитать переработку ресурсов</div>
              </div>
              <VIcon icon="mdi-chevron-right" size="32" color="white" class="menu-arrow" />
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
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
    url('@/assets/images/merchant_helper_background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding: 24px 16px;
}

.menu-header {
  text-align: center;
  margin-bottom: 8px;
  padding-top: 40px;
}

.menu-title {
  font-family: 'Monomakh', serif;
  font-size: 40px;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
}

.menu-subtitle {
  font-size: 16px;
  color: white;
  margin: 8px 0 0 0;
  font-weight: 400;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.8);
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
  background: rgba(255, 255, 255, 0.25) !important;
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
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.menu-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-text {
  flex: 1;
  min-width: 0;
}

.menu-item-title {
  font-family: 'Monomakh', serif;
  font-size: 26px;
  font-weight: 600;
  color: white;
  margin-bottom: 0px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.menu-item-description {
  font-family: 'Monomakh', serif;
  font-size: 14px;
  color: white;
  line-height: 1.4;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  margin-top: -2px;
}

.menu-arrow {
  flex-shrink: 0;
  opacity: 0.8;
  transition: all 0.3s ease;
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8));
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

