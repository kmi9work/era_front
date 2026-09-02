<script setup>
import { ref, computed } from 'vue'
import { usePwaInstallStore } from '@/stores/pwaInstall'

const pwaInstallStore = usePwaInstallStore()
const isDismissed = ref(false)

const showBanner = computed(() => !!pwaInstallStore.deferredPrompt && !isDismissed.value)

const install = async () => {
  const event = pwaInstallStore.deferredPrompt
  if (!event) return

  event.prompt()
  await event.userChoice
  pwaInstallStore.clearDeferredPrompt()
}

const dismiss = () => {
  isDismissed.value = true
}
</script>

<template>
  <div v-if="showBanner" class="pwa-install-banner">
    <VIcon icon="mdi-cellphone-arrow-down" size="26" color="white" class="pwa-install-icon" />
    <div class="pwa-install-text">
      <div class="pwa-install-title">Установить приложение</div>
      <div class="pwa-install-subtitle">Быстрый доступ с экрана телефона</div>
    </div>
    <VBtn color="white" variant="flat" size="small" class="pwa-install-btn" @click="install">
      Установить
    </VBtn>
    <VBtn icon size="x-small" variant="text" @click="dismiss">
      <VIcon icon="mdi-close" color="white" />
    </VBtn>
  </div>
</template>

<style scoped>
.pwa-install-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #1976d2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.pwa-install-icon {
  flex-shrink: 0;
}

.pwa-install-text {
  flex: 1;
  min-width: 0;
}

.pwa-install-title {
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.pwa-install-subtitle {
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
}

.pwa-install-btn {
  color: #1976d2 !important;
  font-weight: 600;
  text-transform: none;
}
</style>
