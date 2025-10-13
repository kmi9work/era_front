<script setup>
import { useRoute } from 'vue-router'
import Guilds from '@/views/pages/economics/Guilds.vue'
import Plants from '@/views/pages/economics/Plants.vue'
import Exchange from '@/views/pages/economics/Exchange.vue'
import MobileLink from '@/views/pages/economics/MobileLink.vue'
import PoliticalActions from '@/views/pages/economics/PoliticalActions.vue'
import Production from '@/views/pages/economics/Production.vue'
import ProductionFront from '@/views/pages/economics/ProductionFront.vue'


const route = useRoute()
const activeTab = ref(route.params.tab)

// tabs
const tabs = [
  // {
  //   title: 'Гильдии',
  //   icon: 'ri-group-fill',
  //   tab: 'guilds',
  // },
  // {
  //   title: 'Предприятия',
  //   icon: 'ri-building-3-line',
  //   tab: 'plants',
  // },
  {
    title: 'Рынок',
    icon: 'ri-exchange-line',
    tab: 'exchange',
  },
  {
    title: 'Рынок (📱)',
    icon: 'ri-smartphone-line',
    tab: 'exchange_mobile',
  },
  {
    title: 'Производство',
    icon: 'ri-exchange-line',
    tab: 'production',
  },
  {
    title: 'Производство (Фронт)',
    icon: 'ri-cpu-line',
    tab: 'production_front',
  },

  {
    title: 'Политические действия',
    icon: 'ri-shake-hands-line',
    tab: 'buyer_actions',
  }

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
      <!-- <VWindowItem value="guilds">
        <Guilds />
      </VWindowItem> -->

      <!-- <VWindowItem value="plants">
        <Plants />
      </VWindowItem> -->

      <VWindowItem value="exchange">
        <Exchange />
      </VWindowItem>

      <VWindowItem value="exchange_mobile">
        <MobileLink />
      </VWindowItem>

      <VWindowItem value="production">
        <Production />
      </VWindowItem>

      <VWindowItem value="production_front">
        <ProductionFront />
      </VWindowItem>

      <VWindowItem value="buyer_actions">
        <PoliticalActions />
      </VWindowItem>
    </VWindow>
  </div>
</template>
