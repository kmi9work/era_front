<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import PlayerViewMobile from './politics/PlayerViewMobile.vue'
import ArmyCostCalculatorMobile from './politics/ArmyCostCalculatorMobile.vue'
import PublicOrderMobile from './politics/PublicOrderMobile.vue'
import ChecklistsMobile from './politics/ChecklistsMobile.vue'
import '@/assets/fonts/fonts.css'

// Навигация между экранами
const currentScreen = ref('menu') // 'menu', 'player', 'army_cost', 'public_order', 'checklists'

// Референсы для всех компонентов
const playerViewMobileRef = ref(null)
const armyCostCalculatorMobileRef = ref(null)
const publicOrderMobileRef = ref(null)
const checklistsMobileRef = ref(null)

// Переход на экраны
const goToPlayer = () => {
  currentScreen.value = 'player'
}

const goToArmyCost = () => {
  currentScreen.value = 'army_cost'
}

const goToPublicOrder = () => {
  currentScreen.value = 'public_order'
}

const goToChecklists = () => {
  currentScreen.value = 'checklists'
}

const backToMenu = () => {
  currentScreen.value = 'menu'
}

// Мапа экранов на их ref-ы
const componentRefs = {
  player: playerViewMobileRef,
  army_cost: armyCostCalculatorMobileRef,
  public_order: publicOrderMobileRef,
  checklists: checklistsMobileRef
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
          <h1 class="menu-title">Помощник знати</h1>
        </div>

        <!-- Опции меню -->
        <div class="menu-list">
          <VCard 
            class="menu-item"
            elevation="2"
            @click="goToPlayer"
            ripple
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <VIcon icon="ri-user-line" size="48" color="white" />
              </div>
              <div class="menu-text">
                <div class="menu-item-title">Мой персонаж</div>
                <div class="menu-item-description">Просмотреть информацию о персонаже</div>
              </div>
              <VIcon icon="mdi-chevron-right" size="32" color="white" class="menu-arrow" />
            </div>
          </VCard>

          <VCard 
            class="menu-item"
            elevation="2"
            @click="goToArmyCost"
            ripple
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <VIcon icon="ri-calculator-line" size="48" color="white" />
              </div>
              <div class="menu-text">
                <div class="menu-item-title">Калькулятор стоимости армии</div>
                <div class="menu-item-description">Подсчитать стоимость отрядов</div>
              </div>
              <VIcon icon="mdi-chevron-right" size="32" color="white" class="menu-arrow" />
            </div>
          </VCard>

          <VCard 
            class="menu-item"
            elevation="2"
            @click="goToPublicOrder"
            ripple
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <VIcon icon="ri-shield-check-line" size="48" color="white" />
              </div>
              <div class="menu-text">
                <div class="menu-item-title">Общественный порядок</div>
                <div class="menu-item-description">Просмотр общественного порядка в поселениях</div>
              </div>
              <VIcon icon="mdi-chevron-right" size="32" color="white" class="menu-arrow" />
            </div>
          </VCard>

          <VCard 
            class="menu-item"
            elevation="2"
            @click="goToChecklists"
            ripple
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <VIcon icon="ri-checkbox-multiple-line" size="48" color="white" />
              </div>
              <div class="menu-text">
                <div class="menu-item-title">Чек-листы</div>
                <div class="menu-item-description">Просмотр чек-листов вассалитета</div>
              </div>
              <VIcon icon="mdi-chevron-right" size="32" color="white" class="menu-arrow" />
            </div>
          </VCard>
        </div>
      </div>
    </VContainer>

    <!-- ЭКРАН: Мой персонаж -->
    <div v-if="currentScreen === 'player'">
      <PlayerViewMobile 
        ref="playerViewMobileRef"
        @back="backToMenu"
      />
    </div>

    <!-- ЭКРАН: Калькулятор стоимости армии -->
    <div v-if="currentScreen === 'army_cost'">
      <ArmyCostCalculatorMobile 
        ref="armyCostCalculatorMobileRef"
        @back="backToMenu"
      />
    </div>

    <!-- ЭКРАН: Общественный порядок -->
    <div v-if="currentScreen === 'public_order'">
      <PublicOrderMobile 
        ref="publicOrderMobileRef"
        @back="backToMenu"
      />
    </div>

    <!-- ЭКРАН: Чек-листы -->
    <div v-if="currentScreen === 'checklists'">
      <ChecklistsMobile 
        ref="checklistsMobileRef"
        @back="backToMenu"
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
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
