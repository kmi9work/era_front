<template>
  <div v-if="isLoading" class="global-loading-overlay">
    <div class="global-loading-content">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
        width="4"
      />
      <div class="loading-text mt-4">
        Обработка запроса...
      </div>
    </div>
  </div>
</template>

<script setup>
import { useLoadingStore } from '@/stores/loading'

const loadingStore = useLoadingStore()
const { isLoading } = storeToRefs(loadingStore)
</script>

<style scoped>
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: all;
}

.global-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-text {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

/* Темная тема */
.v-theme--dark .global-loading-content {
  background: #1e1e1e;
  color: white;
}

.v-theme--dark .loading-text {
  color: #ccc;
}
</style>
