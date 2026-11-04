<script setup>
import { useRoute } from 'vue-router'
import Ownerships from '@/views/pages/politics/Ownerships.vue'
import PoliticalActions from '@/views/pages/politics/PoliticalActions.vue'
import MapEditor from '@/views/pages/politics/MapEditor.vue'
import NobleMobileLink from '@/views/pages/politics/NobleMobileLink.vue'

const route = useRoute()
const activeTab = ref(route.params.tab)

// tabs
const tabs = [
  {
    title: 'Владения',
    icon: 'ri-road-map-line',
    tab: 'ownerships',
  },
  {
    title: 'Политические действия',
    icon: 'ri-shake-hands-line',
    tab: 'political_actions',
  },
  {
    title: 'Помощник',
    icon: 'ri-smartphone-line',
    tab: 'helper',
  },
  {
    title: 'Карта',
    icon: 'ri-map-2-line',
    tab: 'map',
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
      <VWindowItem value="ownerships">
        <Ownerships />
      </VWindowItem>

      <VWindowItem value="political_actions">
        <PoliticalActions />
      </VWindowItem>

      <VWindowItem value="helper">
        <NobleMobileLink />
      </VWindowItem>

      <VWindowItem value="map">
        <MapEditor />
      </VWindowItem>
    </VWindow>
  </div>
</template>
