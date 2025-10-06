<!-- components/GameMap.vue -->
<template>
  <div class="game-map-container">
    <!-- Панель управления -->
    <div class="control-panel">
      <div class="zoom-controls">
        <button @click="zoomIn" :disabled="scale >= 5">+</button>
        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomOut" :disabled="scale <= 0.3">-</button>
        <button @click="resetView">⟲</button>
      </div>
      
      <div class="object-controls">
        <button @click="addRandomArmy">➕ Армия</button>
        <button @click="addRandomCity">🏰 Город</button>
        <button 
          v-if="selectedObject" 
          @click="deleteSelectedObject"
          class="delete-btn"
        >
          🗑️ Удалить
        </button>
      </div>

      <div class="info-panel" v-if="selectedObject">
        <h4>Выбранный объект:</h4>
        <p><strong>{{ selectedObject.name }}</strong></p>
        <p>Тип: {{ selectedObject.type === 'army' ? 'Армия' : 'Город' }}</p>
        <p>Координаты: X:{{ selectedObject.x }}, Y:{{ selectedObject.y }}</p>
        <p>Игрок: {{ selectedObject.playerId }}</p>
      </div>
    </div>

    <!-- Контейнер карты -->
    <div 
      class="map-container"
      ref="mapContainer"
      :class="{ 'dragging': isDragging }"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @wheel="onWheel"
    >
      <!-- Фон карты -->
      <div 
        class="map-background"
        :style="backgroundStyle"
      >
        <img 
          :src="mapData.imageUrl" 
          alt="Game Map"
          class="map-image"
        />
      </div>

      <!-- Слой объектов -->
      <div class="objects-layer">
        <!-- Города -->
        <div
          v-for="city in cities"
          :key="`city-${city.id}`"
          class="map-object city"
          :class="{ 
            'selected': selectedObject?.id === city.id,
            [`player-${city.playerId}`]: true
          }"
          :style="getObjectStyle(city)"
          @mousedown.stop="selectObject(city)"
          @click.stop
        >
          <div class="object-icon">🏰</div>
          <div class="object-name">{{ city.name }}</div>
        </div>

        <!-- Армии -->
        <div
          v-for="army in armies"
          :key="`army-${army.id}`"
          class="map-object army"
          :class="{ 
            'selected': selectedObject?.id === army.id,
            'draggable': selectedObject?.id === army.id,
            [`player-${army.playerId}`]: true
          }"
          :style="getObjectStyle(army)"
          @mousedown.stop="startObjectDrag(army, $event)"
          @click.stop
        >
          <div class="object-icon">⚔️</div>
          <div class="object-name">{{ army.name }}</div>
        </div>
      </div>

      <!-- Сетка для отладки (можно убрать) -->
      <div class="grid-overlay" :style="gridStyle" v-if="showGrid">
        <div 
          v-for="x in gridColumns" 
          :key="x"
          class="grid-line vertical"
          :style="{ left: `${x * 100}px` }"
        ></div>
        <div 
          v-for="y in gridRows" 
          :key="y"
          class="grid-line horizontal"
          :style="{ top: `${y * 100}px` }"
        ></div>
      </div>
    </div>

    <!-- Статус бар -->
    <div class="status-bar">
      <span>Объектов: {{ totalObjects }} ({{ armies.length }} армий, {{ cities.length }} городов)</span>
      <span>|</span>
      <span>Позиция: X:{{ Math.round(position.x) }}, Y:{{ Math.round(position.y) }}</span>
      <span>|</span>
      <label>
        <input type="checkbox" v-model="showGrid"> Сетка
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMapStore } from '@/stores/map'

const mapStore = useMapStore()
const mapContainer = ref(null)
const showGrid = ref(false)
const isDraggingObject = ref(false)
const objectDragStart = ref({ x: 0, y: 0 })

// Используем геттеры из store правильно
const scale = computed(() => mapStore.scale)
const position = computed(() => mapStore.position)
const isDragging = computed(() => mapStore.isDragging)
const armies = computed(() => mapStore.armies)
const cities = computed(() => mapStore.cities)
const selectedObject = computed(() => mapStore.selectedObject)
const mapData = computed(() => mapStore.mapData)

// Вычисляемые свойства
const totalObjects = computed(() => armies.value.length + cities.value.length)

const backgroundStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`,
  width: `${mapData.value.width}px`,
  height: `${mapData.value.height}px`
}))

const gridStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`,
  width: `${mapData.value.width}px`,
  height: `${mapData.value.height}px`
}))

const gridColumns = computed(() => Math.ceil(mapData.value.width / 100))
const gridRows = computed(() => Math.ceil(mapData.value.height / 100))

// Стиль для объектов с компенсацией масштаба
const getObjectStyle = (object) => ({
  left: `${object.x}px`,
  top: `${object.y}px`,
  transform: `scale(${1 / scale.value})` // Компенсируем масштаб для читаемости
})

// Обработчики событий карты
const onMouseDown = (event) => {
  mapStore.startDrag(event.clientX, event.clientY)
}

const onMouseMove = (event) => {
  if (isDraggingObject.value && selectedObject.value) {
    // Перемещение объекта
    const rect = mapContainer.value.getBoundingClientRect()
    const x = (event.clientX - rect.left - position.value.x) / scale.value
    const y = (event.clientY - rect.top - position.value.y) / scale.value
    
    mapStore.moveObject(selectedObject.value.id, x, y)
  } else {
    // Перемещение карты
    mapStore.drag(event.clientX, event.clientY)
  }
}

const onMouseUp = () => {
  mapStore.endDrag()
  isDraggingObject.value = false
}

const onWheel = (event) => {
  event.preventDefault()
  const delta = -event.deltaY * 0.001
  const newScale = Math.min(Math.max(0.3, scale.value + delta), 5)
  
  // Масштабирование к курсору
  if (mapContainer.value) {
    const rect = mapContainer.value.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    const scaleFactor = newScale / scale.value
    mapStore.position.x = mouseX - (mouseX - position.value.x) * scaleFactor
    mapStore.position.y = mouseY - (mouseY - position.value.y) * scaleFactor
  }
  
  mapStore.scale = newScale
}

// Действия с объектами
const selectObject = (object) => {
  mapStore.selectObject(object)
}

const startObjectDrag = (object, event) => {
  selectObject(object)
  isDraggingObject.value = true
  event.preventDefault()
}

const deleteSelectedObject = () => {
  if (selectedObject.value) {
    mapStore.deleteObject(selectedObject.value.id)
  }
}

// Добавление тестовых объектов
const addRandomArmy = () => {
  const x = Math.random() * mapData.value.width
  const y = Math.random() * mapData.value.height
  
  mapStore.addArmy({
    x,
    y,
    name: `Армия ${armies.value.length + 1}`,
    playerId: Math.ceil(Math.random() * 4)
  })
}

const addRandomCity = () => {
  const x = Math.random() * mapData.value.width
  const y = Math.random() * mapData.value.height
  
  mapStore.addCity({
    x,
    y,
    name: `Город ${cities.value.length + 1}`,
    playerId: Math.ceil(Math.random() * 4)
  })
}

// Управление масштабом
const zoomIn = () => mapStore.zoomIn()
const zoomOut = () => mapStore.zoomOut()
const resetView = () => mapStore.resetView()

// Добавляем начальные объекты для демонстрации
onMounted(() => {
  // Несколько тестовых объектов
  mapStore.addCity({ x: 500, y: 400, name: 'Столица', playerId: 1 })
  mapStore.addCity({ x: 1200, y: 800, name: 'Порт', playerId: 2 })
  mapStore.addArmy({ x: 300, y: 300, name: 'Первая армия', playerId: 1 })
  mapStore.addArmy({ x: 1500, y: 600, name: 'Оборона', playerId: 2 })
})

// Очистка
onUnmounted(() => {
  mapStore.endDrag()
})
</script>

<style scoped>
.game-map-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  overflow: hidden;
}

.control-panel {
  background: #2d3748;
  color: white;
  padding: 10px;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  border-bottom: 1px solid #4a5568;
}

.zoom-controls, .object-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.zoom-controls button, .object-controls button {
  background: #4a5568;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.zoom-controls button:hover:not(:disabled),
.object-controls button:hover:not(:disabled) {
  background: #718096;
}

.zoom-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background: #e53e3e !important;
}

.delete-btn:hover {
  background: #c53030 !important;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-weight: bold;
}

.info-panel {
  background: #4a5568;
  padding: 10px;
  border-radius: 4px;
  min-width: 200px;
}

.info-panel h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.info-panel p {
  margin: 4px 0;
  font-size: 12px;
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.map-container.dragging {
  cursor: grabbing;
}

.map-background {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  transition: transform 0.1s ease-out;
}

.map-image {
  display: block;
  user-select: none;
  pointer-events: none;
}

.objects-layer {
  position: absolute;
  top: 0;
  left: 0;
}

.map-object {
  position: absolute;
  transform-origin: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.map-object:hover {
  z-index: 20;
  filter: brightness(1.2);
}

.map-object.selected {
  z-index: 30;
  filter: drop-shadow(0 0 8px gold);
}

.map-object.draggable {
  cursor: move;
}

.object-icon {
  font-size: 24px;
  text-align: center;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.object-name {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  margin-top: 4px;
  text-align: center;
}

/* Цвета игроков */
.player-1 .object-icon { filter: drop-shadow(0 0 4px #4299e1); }
.player-2 .object-icon { filter: drop-shadow(0 0 4px #e53e3e); }
.player-3 .object-icon { filter: drop-shadow(0 0 4px #38a169); }
.player-4 .object-icon { filter: drop-shadow(0 0 4px #d69e2e); }

/* Сетка */
.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  opacity: 0.3;
}

.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.2);
}

.grid-line.vertical {
  width: 1px;
  height: 100%;
}

.grid-line.horizontal {
  height: 1px;
  width: 100%;
}

.status-bar {
  background: #2d3748;
  color: white;
  padding: 8px 16px;
  font-size: 12px;
  display: flex;
  gap: 16px;
  border-top: 1px solid #4a5568;
}

.status-bar label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
</style>