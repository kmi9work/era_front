<script setup>
/**
 * Окно «Результаты всех команд: личный зачёт» («Служебное → Вывод На Экран»).
 * Раскладка и данные — общий `AllTeamsBoard` (режим `personal`).
 */
import AllTeamsBoard from '../components/AllTeamsBoard.vue'

defineProps({
  timerStore: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <AllTeamsBoard mode="personal" :timer-store="timerStore" />
</template>
