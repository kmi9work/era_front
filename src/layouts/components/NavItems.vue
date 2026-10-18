<script setup>
import VerticalNavSectionTitle from '@/@layouts/components/VerticalNavSectionTitle.vue'
import VerticalNavGroup from '@layouts/components/VerticalNavGroup.vue'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'
</script>

<template>
  <!-- 👉 Дашборд: отношения выбранных государств со всеми остальными -->
  <VerticalNavLink
    :item="{
      title: 'Дашборд',
      icon: 'ri-dashboard-2-line',
      to: '/dashboard',
    }"
  />

  <!-- 👉 Информация о стране: данные текущего государства -->
  <VerticalNavLink
    :item="{
      title: 'Информация о стране',
      icon: 'ri-information-line',
      to: '/country',
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

  <VerticalNavLink
    :item="{
      title: 'Игроки',
      icon: 'ri-user-line',
      to: '/players',
    }"
  />


</template>
