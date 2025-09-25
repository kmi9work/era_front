<script setup>
import VerticalNavSectionTitle from '@/@layouts/components/VerticalNavSectionTitle.vue'
import VerticalNavGroup from '@layouts/components/VerticalNavGroup.vue'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'
</script>

<template>
  <!-- 👉 Dashboards -->
  <VerticalNavLink
    :item="{
      title: 'Информация',
      to: '/dashboard',
    }"
  />

  <VerticalNavLink
    :item="{
      title: 'Политика',
      icon: 'ri-vip-crown-2-line',
      to: '/politics',
    }"
  />

  <VerticalNavLink
    :item="{
      title: 'Сражения',
      icon: 'ri-sword-line',
      to: '/armies',
    }"
  />

  <VerticalNavLink
    :item="{
      title: 'Экономика',
      icon: 'ri-line-chart-line',
      to: '/economics',
    }"
  />

  <VerticalNavLink
    :item="{
      title: 'Служебное',
      icon: 'ri-settings-5-fill',
      to: '/aux',
    }"
  />

  <VerticalNavLink
    :item="{
      title: 'Статистика',
      icon: 'ri-dashboard-line',
      to: '/general',
    }"
  />


</template>
