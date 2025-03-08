<script setup>
import Nobles from '@/views/dashboard/Nobles.vue'
import PublicOrder from '@/views/dashboard/PublicOrder.vue'
import Relations from '@/views/dashboard/Relations.vue'

</script>

<template>
  <VRow class="match-height">
    <VCol>
      <Nobles />
    </VCol>

    <VCol>
      <PublicOrder />
    </VCol>

    <VCol>
      <Relations />
    </VCol>
  </VRow>
</template>
