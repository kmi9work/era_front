<template>
  <div class="fullscreen-content-wrapper">
    <Transition name="fade" mode="out-in">
      <component 
        :is="currentScreenComponent" 
        :key="selectedScreen"
        :active-screen="activeScreen"
        :current-place="currentPlace"
      />
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PlaceholderScreen from './PlaceholderScreen.vue'
import TimerScreen from './TimerScreen.vue'
import MerchantResultsScreen from './MerchantResultsScreen.vue'
import NobleResultsScreen from './NobleResultsScreen.vue'

const props = defineProps({
  selectedScreen: {
    type: String,
    required: true
  },
  activeScreen: {
    type: String,
    required: true
  },
  currentPlace: {
    type: Number,
    default: 0
  }
})

const currentScreenComponent = computed(() => {
  switch (props.selectedScreen) {
    case 'placeholder':
      return PlaceholderScreen
    case 'timer':
      return TimerScreen
    case 'merchant_results':
      return MerchantResultsScreen
    case 'noble_results':
      return NobleResultsScreen
    default:
      return PlaceholderScreen
  }
})
</script>

<style scoped>
.fullscreen-content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
