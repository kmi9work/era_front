<script setup>
/**
 * Окно «Результаты всех команд: общий зачёт» («Служебное → Вывод На Экран»).
 * Раскладка и данные — общий `AllTeamsBoard` (режим `overall`).
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
  <AllTeamsBoard mode="overall" :timer-store="timerStore" />
</template>
