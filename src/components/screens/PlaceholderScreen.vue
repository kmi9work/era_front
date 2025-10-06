<template>
  <div class="screen-content">
    <img class="fullscreen-image" :src="previewPlaceholder" alt="Заглушка">
  </div>
</template>

<script setup>
import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'
</script>

<style scoped>
.screen-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fullscreen-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Адаптивность */
@media (max-width: 768px) {
  .fullscreen-image {
    max-width: 95vw;
    max-height: 95vh;
  }
}

@media (max-width: 480px) {
  .fullscreen-image {
    max-width: 98vw;
    max-height: 98vh;
  }
}
</style>
