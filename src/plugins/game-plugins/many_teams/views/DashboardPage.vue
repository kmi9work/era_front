<script setup>
/**
 * «Дашборд» в игре many_teams: экран ядра + подтверждение набора государств
 * игроков (п. 7). Набор определяет, за какие государства играют команды (по нему
 * считаются соперники в разведке); на строительство предприятий он больше не
 * влияет — там действует единственное разрешение «гильдия × государство».
 */
import CoreDashboard from '@/pages/teams-dashboard.vue'
import PlayerCountriesConfirm from '../components/PlayerCountriesConfirm.vue'
</script>

<template>
  <div>
    <CoreDashboard />
    <PlayerCountriesConfirm />
  </div>
</template>
