<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

const props = defineProps({
  player: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'next'])

const items = ref([]) // [{ identificator, name, available, count }]
const isLoading = ref(true)

const hasSelection = computed(() => items.value.some(item => item.count > 0))

const fetchData = async () => {
  isLoading.value = true
  try {
    const [countsResponse, resourcesResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_PROXY}/players/${props.player.id}/show_players_resources.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/resources/show_all_resources.json`)
    ])

    const names = {}
    resourcesResponse.data.forEach(res => {
      if (!names[res.identificator]) names[res.identificator] = res.name
    })

    items.value = Object.entries(countsResponse.data)
      .filter(([, count]) => count > 0)
      .map(([identificator, available]) => ({
        identificator,
        name: names[identificator] || identificator,
        available,
        count: 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Error fetching wallet for transfer:', error)
  } finally {
    isLoading.value = false
  }
}

// Ручной ввод количества
const setCount = (item, rawValue) => {
  let value = Math.trunc(Number(rawValue))
  if (!Number.isFinite(value)) value = 0
  item.count = Math.max(0, Math.min(item.available, value))
}

// Удержание +/- с ускорением: чем дольше зажата кнопка, тем быстрее бежит число
const HOLD_INITIAL_DELAY = 400 // задержка перед началом авто-повтора
const HOLD_REPEAT_START_DELAY = 220 // начальный интервал повтора
const HOLD_ACCELERATION_STEP = 25 // на сколько мс ускоряется каждый шаг
const MIN_HOLD_DELAY = 40 // потолок скорости (мс между шагами)

const holdState = new Map()

const performStep = (item, direction) => {
  const before = item.count
  const next = Math.max(0, Math.min(item.available, before + direction))
  item.count = next
  return next !== before
}

const scheduleNext = (item, direction, delay) => {
  return setTimeout(() => {
    const changed = performStep(item, direction)
    const state = holdState.get(item.identificator)
    if (!state || !changed) {
      stopHold(item)
      return
    }
    state.delay = Math.max(MIN_HOLD_DELAY, state.delay - HOLD_ACCELERATION_STEP)
    state.timeoutId = scheduleNext(item, direction, state.delay)
  }, delay)
}

const startHold = (item, direction) => {
  stopHold(item)
  performStep(item, direction)
  const state = { delay: HOLD_REPEAT_START_DELAY }
  state.timeoutId = scheduleNext(item, direction, HOLD_INITIAL_DELAY)
  holdState.set(item.identificator, state)
}

const stopHold = (item) => {
  const state = holdState.get(item.identificator)
  if (state) {
    clearTimeout(state.timeoutId)
    holdState.delete(item.identificator)
  }
}

onBeforeUnmount(() => {
  holdState.forEach(state => clearTimeout(state.timeoutId))
  holdState.clear()
})

const handleBack = () => {
  emit('back')
}

const goNext = () => {
  const basket = items.value
    .filter(item => item.count > 0)
    .map(item => ({ identificator: item.identificator, name: item.name, count: item.count }))
  emit('next', basket)
}

onMounted(fetchData)
</script>

<template>
  <VApp>
    <div class="basket-header">
      <h1 class="basket-title">Что передать?</h1>
    </div>

    <div v-if="isLoading" class="text-center pa-8">
      <VProgressCircular indeterminate color="primary" size="48" />
    </div>

    <div v-else class="basket-list">
      <VCard v-for="item in items" :key="item.identificator" class="basket-item" elevation="1">
        <div class="basket-item-content">
          <VImg :src="`/images/resources/${item.identificator}.png`" width="44" height="44" />
          <div class="basket-item-info">
            <div class="basket-item-name">{{ item.name }}</div>
            <div class="basket-item-available">доступно: {{ item.available }}</div>
          </div>
          <div class="basket-stepper">
            <VBtn
              icon
              size="small"
              variant="tonal"
              :disabled="item.count <= 0"
              @pointerdown="startHold(item, -1)"
              @pointerup="stopHold(item)"
              @pointerleave="stopHold(item)"
              @pointercancel="stopHold(item)"
            >
              <VIcon icon="mdi-minus" />
            </VBtn>
            <input
              type="number"
              inputmode="numeric"
              class="basket-count-input"
              min="0"
              :max="item.available"
              :value="item.count"
              @input="setCount(item, $event.target.value)"
              @blur="setCount(item, $event.target.value)"
            >
            <VBtn
              icon
              size="small"
              variant="tonal"
              :disabled="item.count >= item.available"
              @pointerdown="startHold(item, 1)"
              @pointerup="stopHold(item)"
              @pointerleave="stopHold(item)"
              @pointercancel="stopHold(item)"
            >
              <VIcon icon="mdi-plus" />
            </VBtn>
          </div>
        </div>
      </VCard>

      <div v-if="!items.length" class="text-center pa-4 text-grey">
        У вас нет ресурсов для передачи
      </div>
    </div>

    <div style="height: 90px;"></div>

    <div class="floating-back-button">
      <VRow class="ma-0" dense>
        <VCol cols="6" class="pa-0 pr-1">
          <VBtn
            :disabled="!hasSelection"
            @click="goNext"
            color="#4caf50"
            block
            size="x-large"
            elevation="8"
            style="color: white !important; font-size: 20px !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: normal !important;"
          >
            Далее
          </VBtn>
        </VCol>
        <VCol cols="6" class="pa-0 pl-1">
          <VBtn
            @click="handleBack"
            color="#1976d2"
            block
            size="x-large"
            elevation="8"
            style="color: white !important; font-size: 20px !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: normal !important;"
          >
            Назад
          </VBtn>
        </VCol>
      </VRow>
    </div>
  </VApp>
</template>

<style scoped>
.basket-header {
  text-align: center;
  padding: 24px 16px 8px;
}

.basket-title {
  font-family: 'Monomakh', serif;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.basket-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.basket-item {
  border-radius: 12px !important;
}

.basket-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
}

.basket-item-info {
  flex: 1;
}

.basket-item-name {
  font-size: 15px;
  font-weight: 600;
}

.basket-item-available {
  font-size: 12px;
  color: #888;
}

.basket-stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.basket-count-input {
  width: 44px;
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 4px 2px;
  -moz-appearance: textfield;
}

.basket-count-input::-webkit-outer-spin-button,
.basket-count-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.floating-back-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 12px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}
</style>
