<script setup>
import { ref, onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import RegionsTable from '@/views/pages/general/RegionsTable.vue'
import PlayersTable from '@/views/pages/general/PlayersTable.vue'
import DetailedYearlyStats from '@/views/pages/general/DetailedYearlyStats.vue'
import NobleActionsCharts from '@/views/pages/general/NobleActionsCharts.vue'
import EnterpriseCharts from '@/views/pages/general/EnterpriseCharts.vue'

const route = useRoute()
const activeTab = ref(route.params?.tab || 'summary')

const regions = ref([])
const players = ref([])
const buildings = ref([])
const buildingTypes = ref([])
const armies = ref([])

async function loadGeneralData() {
  try {
    // Загружаем регионы (включая постройки в столицах)
    const regionsResponse = await axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=0`)
    regions.value = regionsResponse.data

    // Загружаем игроков
    const playersResponse = await axios.get(`${import.meta.env.VITE_PROXY}/players.json`)
    players.value = playersResponse.data

    // Загружаем все поселения (включая постройки)
    const settlementsResponse = await axios.get(`${import.meta.env.VITE_PROXY}/settlements.json`)
    buildings.value = settlementsResponse.data.flatMap(settlement => 
      settlement.buildings?.map(building => ({
        ...building,
        region_id: settlement.region_id,
        owner_id: settlement.player_id
      })) || []
    )

    // Загружаем армии
    const armiesResponse = await axios.get(`${import.meta.env.VITE_PROXY}/armies.json`)
    armies.value = armiesResponse.data

    // Загружаем типы построек
    const buildingTypesResponse = await axios.get(`${import.meta.env.VITE_PROXY}/building_types.json`)
    buildingTypes.value = buildingTypesResponse.data
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error)
  }
}

onBeforeMount(() => {
  loadGeneralData()
})

const tabs = [
  {
    title: 'Сводка событий',
    icon: 'ri-bar-chart-2-line',
    tab: 'summary',
  },
  {
    title: 'Графики',
    icon: 'ri-line-chart-line',
    tab: 'charts',
  },
]
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
        :key="item.tab"
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
      <VWindowItem value="summary">
        <div>
          <VRow class="match-height">
            <VCol cols="12">
              <DetailedYearlyStats />
            </VCol>
          </VRow>

          <VRow class="match-height mt-4">
            <VCol cols="12">
              <RegionsTable 
                :regions="regions" 
                :buildings="buildings"
                :building-types="buildingTypes"
                :armies="armies"
                @reload-data="loadGeneralData"
              />
            </VCol>
          </VRow>

          <VRow class="match-height mt-4">
            <VCol cols="12">
              <PlayersTable 
                :players="players" 
                :buildings="buildings"
                :building-types="buildingTypes"
                :armies="armies"
                @reload-data="loadGeneralData"
              />
            </VCol>
          </VRow>
        </div>
      </VWindowItem>

      <VWindowItem value="charts">
        <NobleActionsCharts />
        <EnterpriseCharts />
      </VWindowItem>
    </VWindow>
  </div>
</template>
