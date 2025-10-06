<template>
  <div class="screen-preview">
    <img class="preview-image" :src="previewPlaceholder" alt="Заглушка">
  </div>
</template>

<script setup>
import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'
</script>

<style scoped>
.screen-preview {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: 4px;
}
</style>
