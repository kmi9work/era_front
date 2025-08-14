<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Timer from '@/views/pages/aux/Timer.vue' // Убедитесь, что путь правильный
import Results from '@/views/pages/aux/Results.vue'
import Screen from '@/views/pages/aux/Screen.vue'
import ScreenControl from '@/views/pages/aux/ScreenControl.vue'


const route = useRoute()
const activeTab = ref(route.params.tab || 'screen') // Значение по умолчанию

// Определяем вкладки
const tabs = [
  {
    title: 'Вывод на экран',
    icon: 'ri-timer-flash-fill',
    tab: 'screen',
  },
  {
    title: 'Управление экраном',
    icon: 'ri-timer-flash-fill',
    tab: 'screen_constrol',
  },

  {
    title: 'Таймер',
    icon: 'ri-timer-flash-fill',
    tab: 'timer',
  },
  {
    title: 'Результаты',
    icon: 'ri-timer-flash-fill',
    tab: 'results',
  },
  


]

// Следим за изменениями маршрута
watch(
  () => route.params.tab,
  (newTab) => {
    if (newTab) {
      activeTab.value = newTab
    }
  }
)
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

      <VWindowItem value="screen">
        <Screen /> 
      </VWindowItem>


      <VWindowItem value="screen_constrol">
        <ScreenControl /> 
      </VWindowItem>

      <VWindowItem value="timer">
        <Timer /> 
      </VWindowItem>

      <VWindowItem value="results">
        <Results /> 
      </VWindowItem>
      
      <!-- Добавьте другие VWindowItem для дополнительных вкладок -->
    </VWindow>
  </div>
</template>