import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const usePwaInstallStore = defineStore('pwaInstall', () => {
  const deferredPrompt = shallowRef(null)

  function setDeferredPrompt(event) {
    deferredPrompt.value = event
  }

  function clearDeferredPrompt() {
    deferredPrompt.value = null
  }

  return {
    deferredPrompt,
    setDeferredPrompt,
    clearDeferredPrompt
  }
})
