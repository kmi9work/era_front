<script setup>
import axios from 'axios'
import { ref, onBeforeMount, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'

import Nobles from '@/views/dashboard/Nobles.vue'
import PublicOrder from '@/views/dashboard/PublicOrder.vue'
import Relations from '@/views/dashboard/Relations.vue'
import Technologies from '@/views/dashboard/Technologies.vue'
import Checklists from '@/views/dashboard/Checklists.vue'

const route = useRoute()
const activeTab = ref(route.params.tab || 'main')

const nobles = ref([]);
const regions = ref([]);
const countries = ref([]);
const technologies = ref([]);
const pollInterval = ref(null);

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

async function loadDashboards(){
  axios.get(`${import.meta.env.VITE_PROXY}/players.json`) 
    .then(response => {
      nobles.value = response.data.filter((player) => player.player_type?.id == 2); // 2 - Знать;
    })
  axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=0`) 
    .then(response => {
      regions.value = response.data;
    })
  axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`) 
      .then(response => {
        countries.value = response.data;
      })
  axios.get(`${import.meta.env.VITE_PROXY}/technologies.json`) 
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

onBeforeMount(async () => {
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
            <Nobles :nobles="nobles" @reload-dashboard="loadDashboards"/>
          </VCol>

          <VCol>
            <PublicOrder :regions="regions" @reload-dashboard="loadDashboards"/>
          </VCol>

          <VCol>
            <Relations :countries="countries" @reload-dashboard="loadDashboards"/>
          </VCol>

          <VCol>
            <Technologies :technologies="technologies" @reload-dashboard="loadDashboards"/>
          </VCol>
        </VRow>
      </VWindowItem>

      <VWindowItem value="checklists">
        <Checklists @reload-dashboard="loadDashboards"/>
      </VWindowItem>
    </VWindow>
  </div>
</template>
