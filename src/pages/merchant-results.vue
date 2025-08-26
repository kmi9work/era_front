<script setup>
import MerchantResults from '@/views/pages/aux/MerchantResults.vue'
</script>

<template>
  <div class="fullpage">
    <MerchantResults />
  </div>
  
</template>

<style scoped>
.fullpage {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  display: flex;
}

.fullpage > * {
  flex: 1 1 auto;
}
</style>


