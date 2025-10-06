<script setup>
import { useRoute } from 'vue-router'
import Armies from '@/views/pages/politics/Armies.vue'
import Map from '@/views/pages/armies/StratigicMap.vue'

const route = useRoute()
const activeTab = ref(route.params.tab)

// tabs
const tabs = [
  {
    title: 'Армии',
    icon: 'ri-sword-line',
    tab: 'armies',
  },

    {
    title: 'MAP',
    icon: 'ri-sword-line',
    tab: 'str_map',
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
      <VWindowItem value="armies">
        <Armies />
      </VWindowItem>

      <VWindowItem value="str_map">
        <Map />
      </VWindowItem>


    </VWindow>



  </div>
</template>
