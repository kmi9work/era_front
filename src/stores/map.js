// stores/map.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMapStore = defineStore('map', () => {
  // Состояние карты
  const scale = ref(1)
  const position = ref({ x: 0, y: 0 })
  const isDragging = ref(false)
  const dragStart = ref({ x: 0, y: 0 })

  // Объекты на карте
  const armies = ref([])
  const cities = ref([])
  const selectedObject = ref(null)

  // Данные карты
  const mapData = ref({
    imageUrl: '/src/assets/map.jpg', // путь к вашей картинке
    width: 2000,  // ширина оригинальной карты
    height: 1500  // высота оригинальной карты
  })

  // Добавление объектов
  const addArmy = (army) => {
    armies.value.push({
      id: Date.now(),
      type: 'army',
      x: army.x,
      y: army.y,
      name: army.name || 'Армия',
      playerId: army.playerId || 1,
      ...army
    })
  }

  const addCity = (city) => {
    cities.value.push({
      id: Date.now(),
      type: 'city', 
      x: city.x,
      y: city.y,
      name: city.name || 'Город',
      playerId: city.playerId || 1,
      ...city
    })
  }

  // Перемещение объектов
  const moveObject = (objectId, newX, newY) => {
    const allObjects = [...armies.value, ...cities.value]
    const object = allObjects.find(obj => obj.id === objectId)
    
    if (object) {
      object.x = newX
      object.y = newY
    }
  }

  // Управление масштабом
  const zoomIn = () => {
    scale.value = Math.min(scale.value + 0.2, 5)
  }

  const zoomOut = () => {
    scale.value = Math.max(scale.value - 0.2, 0.3)
  }

  // Сброс позиции
  const resetView = () => {
    scale.value = 1
    position.value = { x: 0, y: 0 }
  }

  // Начало перетаскивания карты
  const startDrag = (clientX, clientY) => {
    isDragging.value = true
    dragStart.value = {
      x: clientX - position.value.x,
      y: clientY - position.value.y
    }
  }

  // Перетаскивание карты
  const drag = (clientX, clientY) => {
    if (!isDragging.value) return
    
    position.value = {
      x: clientX - dragStart.value.x,
      y: clientY - dragStart.value.y
    }
  }

  // Конец перетаскивания
  const endDrag = () => {
    isDragging.value = false
  }

  // Выбор объекта
  const selectObject = (object) => {
    selectedObject.value = object
  }

  // Удаление объекта
  const deleteObject = (objectId) => {
    armies.value = armies.value.filter(army => army.id !== objectId)
    cities.value = cities.value.filter(city => city.id !== objectId)
    if (selectedObject.value?.id === objectId) {
      selectedObject.value = null
    }
  }

  return {
    // Состояние
    scale,
    position,
    isDragging,
    armies,
    cities,
    selectedObject,
    mapData,
    
    // Действия
    addArmy,
    addCity,
    moveObject,
    zoomIn,
    zoomOut,
    resetView,
    startDrag,
    drag,
    endDrag,
    selectObject,
    deleteObject
  }
})