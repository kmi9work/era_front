<script setup>
/**
 * «Дашборд» в игре two_teams: экран ядра + подтверждение набора государств
 * игроков (п. 7). От того, что подтверждено здесь, зависит, где гильдиям
 * разрешено строить предприятия.
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
