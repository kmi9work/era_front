<script setup>
  /**
   * Полноэкранные уведомления мастера.
   *
   * Уведомление адресовано ПОЛЬЗОВАТЕЛЮ (users), а не устройству: тот же человек
   * может держать веб-админку и планшет, и подтверждение с любого устройства
   * снимает окно на остальных. Поэтому опрашиваем неподтверждённые
   * (`GET /notifications.json?status=pending`) раз в 10 секунд и показываем их
   * по одному. Окно не закрывается ни по Esc, ни по клику на фон — только «Ок».
   */
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import axios from 'axios'

  const POLL_INTERVAL_MS = 10000

  const notifications = ref([])
  const isAcknowledging = ref(false)
  let pollTimer = null
  let isUnmounted = false

  const current = computed(() => notifications.value[0] ?? null)

  async function loadNotifications() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/notifications.json`, {
        params: { status: 'pending' },
      })

      if (isUnmounted) return
      notifications.value = Array.isArray(response.data) ? response.data : []
    } catch (error) {
      // Фоновая ошибка (нет связи, анонимная сессия) не должна ломать админку:
      // последнее известное окно остаётся, следующий опрос повторит запрос.
    }
  }

  async function acknowledge() {
    if (!current.value || isAcknowledging.value) return

    const acknowledgedId = current.value.id
    isAcknowledging.value = true

    try {
      await axios.patch(`${import.meta.env.VITE_PROXY}/notifications/${acknowledgedId}/acknowledge.json`)
      notifications.value = notifications.value.filter(item => item.id !== acknowledgedId)
    } catch (error) {
      await loadNotifications()
    } finally {
      isAcknowledging.value = false
    }
  }

  onMounted(() => {
    loadNotifications()
    pollTimer = setInterval(loadNotifications, POLL_INTERVAL_MS)
  })

  onBeforeUnmount(() => {
    isUnmounted = true
    if (pollTimer) clearInterval(pollTimer)
  })
</script>

<template>
  <VDialog
    :model-value="Boolean(current)"
    fullscreen
    persistent
    transition="dialog-bottom-transition"
  >
    <div class="notification-popup">
      <div class="notification-popup__card">
        <VIcon
          icon="ri-notification-3-line"
          color="primary"
          size="56"
          class="mb-4"
        />

        <h1 class="notification-popup__title">
          {{ current?.title }}
        </h1>

        <p
          v-if="current?.body"
          class="notification-popup__body"
        >
          {{ current.body }}
        </p>

        <p class="notification-popup__hint">
          Окно закроется только после подтверждения
        </p>

        <VBtn
          color="primary"
          size="large"
          :loading="isAcknowledging"
          @click="acknowledge"
        >
          Ок
        </VBtn>
      </div>
    </div>
  </VDialog>
</template>

<style scoped>
.notification-popup {
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 100%;
  block-size: 100%;
  padding: 1.5rem;
  background: rgba(var(--v-theme-surface), 0.97);
}

.notification-popup__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-inline-size: 46rem;
  text-align: center;
}

.notification-popup__title {
  font-size: 2.5rem;
  line-height: 1.2;
  margin-block-end: 1rem;
}

.notification-popup__body {
  font-size: 1.25rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-block-end: 1rem;
}

.notification-popup__hint {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
  margin-block-end: 2rem;
}
</style>
