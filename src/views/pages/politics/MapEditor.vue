<script setup>
import axios from 'axios'
import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue'

/**
 * «Политика → Карта»: редактор координат городов на карте.
 *
 * Карта — статическая картинка бэкенда /images/map/map-base.png (2881×2881, без
 * городов и подписей). Город хранит нормализованные координаты map_x/map_y (0..1)
 * в settlements; маркер можно перетащить, сохранение — сразу на pointerup.
 * Полное ТЗ: eraofchange/docs/map/TZ-karta.md.
 */

const API = import.meta.env.VITE_PROXY
// Статика живёт в корне сайта: адрес API заканчивается на /backend/
const IMAGE_URL = `${String(API || '').replace(/\/+$/, '').replace(/\/backend$/i, '')}/images/map/map-base.png`

const settlements = ref([])
const regions = ref([])
const loading = ref(false)
const error = ref('')
const savingId = ref(null)
const flash = ref('')
const zoom = ref(1)

const dragId = ref(null)
const dragPos = ref(null)
const pending = ref(null)
const hoverPos = ref(null)
const selected = ref(null)

const fortressColors = ['#1f1f1f', '#8b5a2b', '#2f6fb5', '#b3382c']
const fortressNames = ['без крепости', 'форт 1 ур.', 'крепость 2 ур.', 'кремль 3 ур.']

const placed = computed(() =>
  settlements.value.filter((s) => s.map_x != null && s.map_y != null)
)
const unplaced = computed(() =>
  settlements.value
    .filter((s) => s.map_x == null || s.map_y == null)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'))
)
const regionName = (id) => regions.value.find((r) => r.id === id)?.name || ''
const colorOf = (s) => fortressColors[s.fortress_level || 0] || fortressColors[0]
const titleOf = (s) => `${s.name} — ${regionName(s.region_id)} (${fortressNames[s.fortress_level || 0]})`

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [settleRes, regionRes] = await Promise.all([
      axios.get(`${API}/settlements.json?all=1`),
      axios.get(`${API}/regions.json`),
    ])
    settlements.value = Array.isArray(settleRes.data) ? settleRes.data : []
    regions.value = Array.isArray(regionRes.data) ? regionRes.data : []
  } catch (e) {
    error.value = 'Не удалось загрузить города и земли'
  } finally {
    loading.value = false
  }
}

function showFlash(text) {
  flash.value = text
  window.clearTimeout(showFlash._t)
  showFlash._t = window.setTimeout(() => { flash.value = '' }, 2000)
}

async function saveCoordinates(settlement, x, y) {
  savingId.value = settlement.id
  error.value = ''
  try {
    await axios.patch(`${API}/settlements/${settlement.id}.json`, {
      settlement: { map_x: x, map_y: y },
    })
    settlement.map_x = x
    settlement.map_y = y
    showFlash(`Сохранено: ${settlement.name}`)
  } catch (e) {
    error.value = `Не сохранено: ${settlement.name}`
  } finally {
    savingId.value = null
  }
}

async function clearCoordinates(settlement) {
  await saveCoordinates(settlement, null, null)
  if (selected.value?.id === settlement.id) selected.value = null
}

// --- перетаскивание маркера -------------------------------------------------

const stage = ref(null)

function normalizedFromEvent(event) {
  const rect = stage.value?.getBoundingClientRect()
  if (!rect) return null
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
}

function onPinDown(event, settlement) {
  event.preventDefault()
  event.stopPropagation()
  dragId.value = settlement.id
  dragPos.value = { x: settlement.map_x, y: settlement.map_y }
  selected.value = settlement
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event) {
  if (dragId.value == null) return
  const pos = normalizedFromEvent(event)
  if (pos) dragPos.value = pos
}

function onPointerUp() {
  const id = dragId.value
  const pos = dragPos.value
  dragId.value = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  const settlement = settlements.value.find((s) => s.id === id)
  if (settlement && pos) saveCoordinates(settlement, Number(pos.x.toFixed(6)), Number(pos.y.toFixed(6)))
}

function onStageClick(event) {
  const pos = normalizedFromEvent(event)
  if (!pos) return
  if (pending.value) {
    const settlement = pending.value
    pending.value = null
    if (settlement) saveCoordinates(settlement, Number(pos.x.toFixed(6)), Number(pos.y.toFixed(6)))
  }
}

function onStageMove(event) {
  if (!pending.value) { hoverPos.value = null; return }
  hoverPos.value = normalizedFromEvent(event)
}

function pinPosition(s) {
  if (dragId.value === s.id && dragPos.value) return dragPos.value
  return { x: s.map_x, y: s.map_y }
}

function setZoom(value) {
  zoom.value = Math.min(4, Math.max(0.5, Number(value.toFixed(2))))
}

onBeforeMount(load)
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<template>
  <div class="map-editor">
    <div class="toolbar">
      <div class="toolbar-title">
        <strong>Карта</strong>
        <span class="hint">
          Тяните маркер мышью — координаты сохраняются сразу. Город без координат
          выберите в списке справа и щёлкните по карте.
        </span>
      </div>
      <div class="toolbar-actions">
        <button class="btn" type="button" @click="setZoom(zoom - 0.25)">−</button>
        <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
        <button class="btn" type="button" @click="setZoom(zoom + 0.25)">+</button>
        <button class="btn" type="button" @click="setZoom(1)">Вписать</button>
      </div>
    </div>

    <div v-if="flash" class="flash">{{ flash }}</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="hint">Загрузка…</div>

    <div class="layout">
      <div
        ref="viewport"
        class="viewport"
        @click="onStageClick"
        @mousemove="onStageMove"
        @mouseleave="hoverPos = null"
      >
        <div
          ref="stage"
          class="stage"
          :style="{ width: `${zoom * 100}%`, cursor: pending ? 'crosshair' : 'default' }"
        >
          <img :src="IMAGE_URL" class="map-image" alt="Карта" draggable="false" />

          <div
            v-for="s in placed"
            :key="s.id"
            class="pin"
            :class="{ active: selected && selected.id === s.id, saving: savingId === s.id }"
            :style="{
              left: `${pinPosition(s).x * 100}%`,
              top: `${pinPosition(s).y * 100}%`,
              background: colorOf(s),
            }"
            :title="titleOf(s)"
            @pointerdown="onPinDown($event, s)"
            @click.stop
          >
            <span class="pin-dot" />
          </div>

          <div
            v-if="hoverPos"
            class="pin ghost"
            :style="{ left: `${hoverPos.x * 100}%`, top: `${hoverPos.y * 100}%` }"
          />
        </div>
      </div>

      <aside class="side">
        <div class="side-title">
          На карте: {{ placed.length }} · без координат: {{ unplaced.length }}
        </div>

        <div v-if="selected" class="selected-card">
          <div class="selected-name">{{ selected.name }}</div>
          <div class="hint">{{ regionName(selected.region_id) }}</div>
          <div class="hint">
            {{ selected.map_x == null ? 'не размещён' : `${Number(selected.map_x).toFixed(4)}, ${Number(selected.map_y).toFixed(4)}` }}
          </div>
          <button
            v-if="selected.map_x != null"
            class="btn danger"
            type="button"
            @click="clearCoordinates(selected)"
          >
            Снять с карты
          </button>
        </div>

        <div v-if="unplaced.length" class="unplaced">
          <div class="side-subtitle">Города без координат</div>
          <button
            v-for="s in unplaced"
            :key="s.id"
            class="unplaced-item"
            :class="{ active: pending && pending.id === s.id }"
            type="button"
            @click.stop="pending = pending && pending.id === s.id ? null : s"
          >
            <span class="unplaced-name">{{ s.name }}</span>
            <span class="unplaced-region">{{ regionName(s.region_id) }}</span>
          </button>
          <div v-if="pending" class="hint">
            Щёлкните по карте, чтобы поставить «{{ pending.name }}»
          </div>
        </div>

        <div v-if="!unplaced.length" class="hint">
          Все города размещены.
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.map-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.toolbar-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hint {
  color: #6b7280;
  font-size: 12px;
  max-width: 640px;
}
.zoom-value {
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}
.btn {
  border: 1px solid #d5d8de;
  background: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
}
.btn:hover { background: #f4f5f7; }
.btn.danger { border-color: #e0b4ae; color: #a33a2c; }
.flash {
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
}
.error {
  background: #fdecea;
  color: #a33a2c;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
}
.layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.viewport {
  flex: 1 1 auto;
  min-width: 0;
  height: calc(100vh - 230px);
  min-height: 420px;
  overflow: auto;
  border: 1px solid #e2e5ea;
  border-radius: 10px;
  background: #faf8f3;
}
.stage {
  position: relative;
  aspect-ratio: 1 / 1;
}
.map-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  user-select: none;
  pointer-events: none;
}
.pin {
  position: absolute;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  cursor: grab;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pin.active {
  box-shadow: 0 0 0 3px rgba(38, 132, 255, 0.55);
}
.pin.saving { opacity: 0.5; }
.pin.ghost {
  background: rgba(38, 132, 255, 0.35);
  border-style: dashed;
  pointer-events: none;
}
.pin-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
}
.side {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.side-title { font-size: 13px; color: #374151; }
.side-subtitle { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.selected-card {
  border: 1px solid #e2e5ea;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.selected-name { font-weight: 600; font-size: 14px; }
.unplaced {
  border: 1px solid #e2e5ea;
  border-radius: 10px;
  padding: 10px;
  max-height: 420px;
  overflow: auto;
}
.unplaced-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
}
.unplaced-item:hover { background: #f4f5f7; }
.unplaced-item.active { background: #e8f0fe; }
.unplaced-name { font-size: 13px; color: #111827; }
.unplaced-region { font-size: 11px; color: #6b7280; }
</style>
