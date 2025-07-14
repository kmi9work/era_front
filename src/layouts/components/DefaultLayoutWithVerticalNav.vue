<script setup>
  import axios from 'axios'
  import NavItems from '@/layouts/components/NavItems.vue'
  import logo from '@images/logo.svg?raw'
  import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'

  // Components
  import Footer from '@/layouts/components/Footer.vue'
  import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
  import UserProfile from '@/layouts/components/UserProfile.vue'
  import Notifications from '@/layouts/components/Notifications.vue'

  const se_paid = ref(false);
  const game_parameters = ref([]);
  const current_year = ref(0);
  
  async function payStateExpenses(){
    let fl = confirm("Уверен? Это необратимо.");
    if (fl){
      await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/pay_state_expenses.json`)
        .then(async (response) => {
          se_paid.value = true
        })
    }
  }

  async function unpayStateExpenses(){
    let fl = confirm("Отменить оплату госрасходов?");
    if (fl){
      await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/unpay_state_expenses.json`)
        .then(async (response) => {
          se_paid.value = false
        })
    }
  }

  async function changeYear(){
    let fl = confirm("Уверен?");
    if (fl){
      await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/increase_year.json?kaznachei_bonus=1`)
        .then(async (response) => {
          se_paid.value = false
          window.location.reload()
        })
    }
  }

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters.json`) 
      .then(response => {
        game_parameters.value = response.data;
        se_paid.value = game_parameters.value.find((gp) => gp.identificator == "current_year")?.params?.state_expenses;
        current_year.value = game_parameters.value.find((gp) => gp.identificator == "current_year")?.value;
      })
  })

  // Таймер
  import { useTimerStore } from '@/stores/timer'
  import { onMounted } from 'vue'

  const timerStore = useTimerStore()

  // Опционально - если нужно обновить при монтировании компонента
  onMounted(() => {
    timerStore.fetchRemainingTime()
  })



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

          <div>

  </div>

        <VSpacer />

  <div>
    {{ timerStore.formattedTime }}
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

        <Notifications />

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
</style>
