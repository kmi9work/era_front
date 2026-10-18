<script setup>
import axios from 'axios'
import { ref, onBeforeMount, onBeforeUnmount, watch, computed } from 'vue'
import { useRoute } from 'vue-router'

import Nobles from '@/views/dashboard/Nobles.vue'
import PublicOrder from '@/views/dashboard/PublicOrder.vue'
import Relations from '@/views/dashboard/Relations.vue'
import Technologies from '@/views/dashboard/Technologies.vue'
import Checklists from '@/views/dashboard/Checklists.vue'
import CountryProfile from '@/layouts/components/CountryProfile.vue'
import { useCurrentCountry } from '@/composables/useCurrentCountry'

const route = useRoute()
const activeTab = ref(route.params.tab || 'main')

const { currentCountry, currentCountryId, reloadToken, loadCurrentCountry } = useCurrentCountry()

const nobles = ref([]);
const regions = ref([]);
const countries = ref([]);
const technologies = ref([]);
const pollInterval = ref(null);

const countryTitle = computed(() => currentCountry.value?.name || 'государство не выбрано')

// tabs
const tabs = [
  {
    title: 'Основное',
    icon: 'ri-dashboard-line',
    tab: 'main',
  },
  {
    title: 'Чек-листы',
    icon: 'ri-checkbox-multiple-line',
    tab: 'checklists',
  },
]

// Все разделы экрана — данные текущего государства (ТЗ № 2, § 3).
// Бэкенд по умолчанию берёт текущее государство сессии; country_id передаётся явно,
// чтобы запрос был привязан именно к тому государству, что показано в шапке.
async function loadDashboards(){
  if (!currentCountryId.value) return
  const countryId = currentCountryId.value

  axios.get(`${import.meta.env.VITE_PROXY}/players.json?country_id=${countryId}&player_type_id=2`) // 2 - Знать
    .then(response => {
      nobles.value = Array.isArray(response.data) ? response.data : [];
    })
  axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=0&country_id=${countryId}`)
    .then(response => {
      regions.value = response.data;
    })
  axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`)
      .then(response => {
        // Принудительно создаем новый массив для реактивности Vue
        countries.value = response.data.map(country => ({
          ...country,
          alliances: country.alliances ? [...country.alliances] : []
        }));
      })
  axios.get(`${import.meta.env.VITE_PROXY}/technologies.json?country_id=${countryId}`)
      .then(response => {
        technologies.value = response.data;
      })
}

// Следим за изменениями маршрута
watch(
  () => route.params.tab,
  (newTab) => {
    if (newTab) {
      activeTab.value = newTab
    }
  }
)

// Смена государства: сброс данных раздела и повторная загрузка (§ 1.1)
watch(reloadToken, () => {
  nobles.value = []
  regions.value = []
  countries.value = []
  technologies.value = []
  loadDashboards()
})

onBeforeMount(async () => {
  await loadCurrentCountry()
  loadDashboards();

  // Устанавливаем периодическое обновление каждые 10 секунд
  pollInterval.value = setInterval(() => {
    loadDashboards();
  }, 10000);
})

onBeforeUnmount(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value);
  }
})
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap gap-2 mb-4">
      <h2 class="text-h5 mb-0">
        Информация о стране: {{ countryTitle }}
      </h2>
      <CountryProfile />
    </div>

    <VTabs
      v-model="activeTab"
      show-arrows
      class="v-tabs-pill"
    >
      <VTab
        v-for="item in tabs"
        :key="item.icon"
        :value="item.tab"
      >
        <VIcon
          size="20"
          start
          :icon="item.icon"
        />
        {{ item.title }}
      </VTab>
    </VTabs>

    <VWindow
      v-model="activeTab"
      class="mt-5 disable-tab-transition"
      :touch="false"
    >
      <VWindowItem value="main">
        <VRow class="match-height">
          <VCol>
            <Nobles
              :nobles="nobles"
              :country="currentCountry"
              @reload-dashboard="loadDashboards"
            />
          </VCol>

          <VCol>
            <PublicOrder :regions="regions" @reload-dashboard="loadDashboards"/>
          </VCol>

          <VCol>
            <Relations
              :countries="countries"
              :partner-country="currentCountry"
              @reload-dashboard="loadDashboards"
            />
          </VCol>

          <VCol>
            <Technologies
              :technologies="technologies"
              :country="currentCountry"
              @reload-dashboard="loadDashboards"
            />
          </VCol>
        </VRow>
      </VWindowItem>

      <VWindowItem value="checklists">
        <Checklists @reload-dashboard="loadDashboards"/>
      </VWindowItem>
    </VWindow>
  </div>
</template>
