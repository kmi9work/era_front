<script setup>
  import { ref, onBeforeMount, computed } from 'vue'
  import axios from 'axios'
  import NavItems from '@/layouts/components/NavItems.vue'
  import logo from '@images/logo.svg?raw'
  import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'

  // Components
  import Footer from '@/layouts/components/Footer.vue'
  import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
  import UserProfile from '@/layouts/components/UserProfile.vue'
  import Notifications from '@/layouts/components/Notifications.vue'
  import { setNotificationsRef, setupNotificationInterceptor } from '@/composables/useNotifications'
  import { useGameConfig } from '@/config/game'

  // Конфигурация игры
  const { isGameActive, activeGame } = useGameConfig()
  
  // Проверяем, активна ли игра vassals-and-robbers
  const isVassalsAndRobbers = computed(() => isGameActive('vassals-and-robbers'))

  const se_paid = ref(false);
  const game_parameters = ref([]);
  const current_year = ref(0);
  const notificationsRef = ref(null);
  
  async function payStateExpenses(){
    await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/pay_state_expenses.json`)
      .then(async (response) => {
        se_paid.value = true
        // Уведомления обновятся автоматически через перехватчик
      })
  }

  async function unpayStateExpenses(){
    let fl = confirm("Отменить оплату госрасходов?");
    if (fl){
      await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/unpay_state_expenses.json`)
        .then(async (response) => {
          se_paid.value = false
          // Уведомления обновятся автоматически через перехватчик
        })
    }
  }

  async function changeYear(){
    let fl = confirm("Уверен? Это необратимо.");
    if (fl){
      await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/increase_year.json?kaznachei_bonus=1`)
        .then(async (response) => {
          se_paid.value = false
          // Уведомления обновятся автоматически через перехватчик
          window.location.reload()
        })
    }
  }

  onBeforeMount(async () => {
    // Настраиваем перехватчик для автоматического обновления уведомлений
    setupNotificationInterceptor()
    
    // Уведомления обновляются автоматически через перехватчик axios
    
    await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters.json`) 
      .then(response => {
        game_parameters.value = response.data;
        se_paid.value = game_parameters.value.find((gp) => gp.identificator == "current_year")?.params?.state_expenses;
        current_year.value = game_parameters.value.find((gp) => gp.identificator == "current_year")?.value;
      })
  })

  // Устанавливаем ссылку на компонент уведомлений
  function onNotificationsMounted() {
    setNotificationsRef(notificationsRef.value)
  }

  // Таймер
  import { useTimerStore } from '@/stores/timer'

  const timerStore = useTimerStore()

</script>

<template>
  <VerticalNavLayout>
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <!-- 👉 Vertical nav toggle in overlay mode -->
        <IconBtn
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="ri-menu-line" />
        </IconBtn>

        <!-- Название игры если активен плагин vassals-and-robbers -->
        <div v-if="isVassalsAndRobbers" class="game-title">
          <span class="text-body-1 font-weight-bold text-primary">Эпоха перемен: вассалы и разбойники</span>
        </div>

        <VSpacer />

  <div class="timer-container">
          <div class="timer-display">
            <VIcon icon="ri-time-line" class="timer-icon" />
            <span class="time-text">{{ timerStore.formattedRemainingTime }}</span>
          </div>
         
        </div>

        

        <VBtn 
          @click="payStateExpenses"
          :color="se_paid ? 'success' : 'error'"
        >
          Оплатить госрасходы
        </VBtn>

        <IconBtn 
          @click="unpayStateExpenses"
          icon="ri-close-line"
        >
        </IconBtn>

        <VBtn @click="changeYear">
          Год: {{current_year}} | 
          Сменить
        </VBtn>

        <div class="notifications-container">
          <Notifications ref="notificationsRef" @vue:mounted="onNotificationsMounted" />
          <span 
            v-if="notificationsRef?.totalUnviewedCount > 0" 
            class="notification-badge"
          >
            {{ notificationsRef.totalUnviewedCount }}
          </span>
        </div>

        <NavbarThemeSwitcher class="me-2" />

        <UserProfile />
      </div>
    </template>

    <template #vertical-nav-header="{ toggleIsOverlayNavActive }">
      <IconBtn
        class="d-block d-lg-none"
        @click="toggleIsOverlayNavActive(false)"
      >
        <VIcon icon="ri-close-line" />
      </IconBtn>
    </template>

    <template #vertical-nav-content>
      <NavItems />
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>
  </VerticalNavLayout>
</template>

<style lang="scss" scoped>
.meta-key {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 1.5625rem;
  line-height: 1.3125rem;
  padding-block: 0.125rem;
  padding-inline: 0.25rem;
}

.game-title {
  margin-left: 12px;
  padding: 4px 0;
  display: flex;
  align-items: center;
  
  span {
    white-space: nowrap;
  }
}

.app-logo {
  display: flex;
  align-items: center;
  column-gap: 0.75rem;

  .app-logo-title {
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 1.75rem;
    text-transform: uppercase;
  }
}

.timer-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px;
  padding: 0 12px;
  height: 100%;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Roboto Mono', monospace;
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity));
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 6px 12px;
  border-radius: 6px;
  min-width: 110px;
  justify-content: center;
}

.timer-icon {
  font-size: 1.2rem;
  color: rgba(var(--v-theme-primary), 1);
}

.time-text {
  letter-spacing: 1px;
}

.timer-control {
  min-width: 32px;
  padding: 0 8px;
}

/* Анимация для таймера */
.timer-display {
  transition: all 0.3s ease;
}

.timer-display:hover {
  background: rgba(var(--v-theme-primary), 0.2);
  transform: translateY(-1px);
}

/* Стили для счетчика уведомлений */
.notifications-container {
  position: relative;
  display: inline-block;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  z-index: 1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Адаптивность */
@media (max-width: 960px) {
  .timer-display {
    font-size: 1rem;
    min-width: auto;
    padding: 4px 8px;
  }
  
  .timer-icon {
    display: none;
  }
}









</style>
