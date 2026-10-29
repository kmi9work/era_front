<script setup>
  import { ref, onBeforeMount, computed, watch } from 'vue'
  import axios from 'axios'
  import NavItems from '@/layouts/components/NavItems.vue'
  import logo from '@images/logo.svg?raw'
  import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'

  // Components
  import Footer from '@/layouts/components/Footer.vue'
  import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
  import UserProfile from '@/layouts/components/UserProfile.vue'
  import Notifications from '@/layouts/components/Notifications.vue'
  import CountryProfile from '@/layouts/components/CountryProfile.vue'
  import AppDownloadMenu from '@/layouts/components/AppDownloadMenu.vue'
  import NotificationPopup from '@/layouts/components/NotificationPopup.vue'
  import { setNotificationsRef, setupNotificationInterceptor } from '@/composables/useNotifications'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'
  import { useGameConfig } from '@/config/game'

  // Конфигурация игры
  const { isGameActive, activeGame } = useGameConfig()
  
  // Проверяем, активна ли игра vassals-and-robbers
  const isVassalsAndRobbers = computed(() => isGameActive('vassals-and-robbers'))

  // Госрасходы подтверждаются за текущее государство (ТЗ № 2, § 8)
  const {
    currentCountry,
    currentCountryId,
    reloadToken,
    loadCurrentCountry,
    withCountryParam,
  } = useCurrentCountry()

  const se_paid = ref(false);
  const game_parameters = ref([]);
  const current_year = ref(0);
  const notificationsRef = ref(null);

  // Название текущего государства — подпись у кнопки расходов и у кнопки смены года
  const currentCountryName = computed(() => currentCountry.value?.short_name
    || currentCountry.value?.name
    || 'государство не выбрано');

  /**
   * Оплачены ли госрасходы текущего государства за текущий год.
   * Основной источник — params.state_expenses записи current_year: после этапа 1 это уже
   * срез текущего государства. Защита для старых баз: если там хэш по годам ({"3": true}),
   * берём значение по текущему году, а если года в хэше нет — срез по государству.
   */
  function stateExpensesPaid(gameParameter) {
    if (!gameParameter) return false;

    const year = Number(gameParameter.year ?? current_year.value);
    const expenses = gameParameter.params?.state_expenses;

    if (expenses && typeof expenses === 'object') {
      const byYear = expenses[String(year)];
      if (byYear !== undefined) return byYear === true;

      const countryId = currentCountryId.value ?? gameParameter.country_id;
      return gameParameter.params?.state_expenses_by_country?.[String(countryId)] === true;
    }

    return expenses === true;
  }

  // Перечитываем параметры года и состояние оплаты расходов
  async function loadGameParameters(){
    await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters.json`)
      .then(response => {
        game_parameters.value = response.data;
        const currentYearParameter = game_parameters.value.find((gp) => gp.identificator == "current_year");
        current_year.value = currentYearParameter?.value ?? currentYearParameter?.year ?? 0;
        se_paid.value = stateExpensesPaid(currentYearParameter);
      })
  }

  // Смена государства: кнопка и её цвет сразу отражают состояние нового государства (§ 8 п. 2–3)
  watch(reloadToken, async () => {
    se_paid.value = false;
    await loadGameParameters();
  });

  async function payStateExpenses(){
    await axios.patch(withCountryParam(`${import.meta.env.VITE_PROXY}/game_parameters/pay_state_expenses.json`))
      .then(async (response) => {
        se_paid.value = true
        // Уведомления обновятся автоматически через перехватчик
      })
  }

  async function unpayStateExpenses(){
    let fl = confirm("Отменить оплату госрасходов?");
    if (fl){
      await axios.patch(withCountryParam(`${import.meta.env.VITE_PROXY}/game_parameters/unpay_state_expenses.json`))
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

    // Текущее государство нужно для подписи и параметра country_id в запросе расходов
    await loadCurrentCountry()

    await loadGameParameters()
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

        

        <!-- Текущее государство и год: расходы подтверждаются за него (§ 8 п. 1) -->
        <span class="expenses-country-caption">
          Год: {{ current_year }} | {{ currentCountryName }}
        </span>

        <VBtn 
          @click="payStateExpenses"
          :color="se_paid ? 'success' : 'error'"
          :title="`Оплатить госрасходы: ${currentCountryName}`"
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

        <AppDownloadMenu class="me-2" />

        <NavbarThemeSwitcher class="me-2" />

        <!-- Текущее государство: тот, «за кого» сейчас работают мастера (ТЗ № 2, § 1.1) -->
        <CountryProfile class="me-2" />

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

    <!-- Полноэкранные уведомления мастера: закрываются только кнопкой «Ок» -->
    <NotificationPopup />
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

/* Подпись «Год: N | <государство>» у кнопок расходов и смены года */
.expenses-country-caption {
  margin-inline: 12px 8px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
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

  /* На узких экранах подпись скрываем, чтобы шапка не разъезжалась */
  .expenses-country-caption {
    display: none;
  }
}









</style>
