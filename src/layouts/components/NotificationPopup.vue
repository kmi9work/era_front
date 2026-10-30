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

  /**
   * Государство события — акцент окна: герб и название. Приходит в объекте
   * `country` (герб по `flag_image_name`), поэтому окно работает и для
   * открытия технологии, и для присоединённой земли, и для итога сражения.
   */
  const countryFlag = computed(() => {
    const flag = current.value?.country?.flag_image_name
    if (!flag) return null
    return `/images/countries/${String(flag).replace(/\.png$/i, '').trim()}.png`
  })

  /** Подсказки по существу: что теперь можно строить и кто с кем сражался. */
  const plants = computed(() => {
    const list = current.value?.payload?.plants
    return Array.isArray(list) ? list : []
  })
  const attackers = computed(() => {
    const list = current.value?.payload?.attackers
    return Array.isArray(list) ? list : []
  })
  const defenders = computed(() => {
    const list = current.value?.payload?.defenders
    return Array.isArray(list) ? list : []
  })

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

        <div
          v-if="current?.country"
          class="notification-popup__country"
        >
          <img
            v-if="countryFlag"
            :src="countryFlag"
            :alt="current.country.name"
            class="notification-popup__emblem"
          >
          <div class="notification-popup__country-text">
            <span class="notification-popup__country-label">Государство</span>
            <span class="notification-popup__country-name">{{ current.country.name }}</span>
          </div>
        </div>

        <p
          v-if="current?.body"
          class="notification-popup__body"
        >
          {{ current.body }}
        </p>

        <div
          v-if="plants.length"
          class="notification-popup__list"
        >
          <div class="notification-popup__list-title">
            Добывающие предприятия в государстве
          </div>
          <ul>
            <li
              v-for="plant in plants"
              :key="plant.plant_type_id"
            >
              {{ plant.plant_type_name }}<span v-if="plant.fossil_type_name"> — {{ plant.fossil_type_name }}</span>
            </li>
          </ul>
        </div>

        <div
          v-if="attackers.length || defenders.length"
          class="notification-popup__list"
        >
          <template v-if="attackers.length">
            <div class="notification-popup__list-title">
              Атакующие
            </div>
            <ul>
              <li
                v-for="item in attackers"
                :key="`a-${item}`"
              >
                {{ item }}
              </li>
            </ul>
          </template>
          <template v-if="defenders.length">
            <div class="notification-popup__list-title">
              Защищающиеся
            </div>
            <ul>
              <li
                v-for="item in defenders"
                :key="`d-${item}`"
              >
                {{ item }}
              </li>
            </ul>
          </template>
        </div>

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

/* Государство события: герб + название крупно — главный акцент окна. */
.notification-popup__country {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-block-end: 1.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid rgba(var(--v-theme-primary), 0.25);
  border-radius: 1rem;
  background: rgba(var(--v-theme-primary), 0.06);
}

.notification-popup__emblem {
  block-size: 4rem;
  inline-size: 6rem;
  object-fit: contain;
}

.notification-popup__country-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.notification-popup__country-label {
  font-size: 0.875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
}

.notification-popup__country-name {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.notification-popup__list {
  margin-block-end: 1rem;
  text-align: start;
}

.notification-popup__list-title {
  font-weight: 700;
  font-size: 1.125rem;
  color: rgb(var(--v-theme-primary));
  margin-block-end: 0.25rem;
}

.notification-popup__list ul {
  margin: 0;
  padding-inline-start: 1.25rem;
  font-size: 1.125rem;
}

.notification-popup__hint {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
  margin-block-end: 2rem;
}
</style>
