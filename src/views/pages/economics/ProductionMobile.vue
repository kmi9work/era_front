<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useProductionStore } from '@/stores/production'

const emit = defineEmits(['back'])

const productionStore = useProductionStore()

// Состояния для UI
const showKeyboard = ref(false)
const keyboardResource = ref(null)
const keyboardValue = ref('0')
const keyboardIndex = ref(null)
const showResultSheet = ref(false)
const showSelection = ref(true) // Экран выбора предприятия
const showInput = ref(false) // Экран ввода ресурсов

// Выбор предприятия
const selectPlant = (plantId) => {
  // Находим индексы по ID
  const plant = productionStore.plantLevelsInfo.find(p => p.id === plantId)
  if (!plant) return
  
  const typeIndex = productionStore.uniquePlantTypes.indexOf(plant.name)
  const levelIndex = productionStore.plantLevelsInfo
    .filter(p => p.name === plant.name)
    .findIndex(p => p.id === plantId)
  
  productionStore.selectedPlantTypeIndex = typeIndex
  productionStore.selectedPlantLevelIndex = levelIndex
  
  showSelection.value = false
  showInput.value = true
  
  // Добавляем состояние в history
  window.history.pushState({ page: 'production-input' }, '')
}

const backToSelection = () => {
  showSelection.value = true
  showInput.value = false
  productionStore.resetSelection()
}

// Универсальная функция "Назад" (как кнопка в тулбаре)
const handleBack = () => {
  // Если открыта клавиатура - закрываем её
  if (showKeyboard.value) {
    cancelKeyboard()
    return
  }
  
  // Если открыт bottom sheet - закрываем его
  if (showResultSheet.value) {
    showResultSheet.value = false
    return
  }
  
  // Если на экране ввода - возвращаемся к выбору
  if (showInput.value) {
    backToSelection()
    return
  }
  
  // Если на экране выбора - возвращаемся в меню
  if (showSelection.value) {
    emit('back')
    return
  }
}

// Watcher для инициализации inputResources
watch([() => productionStore.selectedPlantId, () => productionStore.calculationMode], () => {
  productionStore.initializeInputResources()
})

// ДЕЙСТВИЯ
const hasInputResources = computed(() => {
  return productionStore.inputResources.some(res => res.count > 0)
})

const calculateProduction = () => {
  if (!hasInputResources.value) return
  
  try {
    productionStore.calculateProduction()
    showResultSheet.value = true
  } catch (error) {
    console.error('Ошибка расчета:', error.message)
  }
}

const clearProduction = () => {
  productionStore.clearProduction()
}

const openKeyboard = (resource, index) => {
  keyboardResource.value = {
    identificator: resource.identificator,
    name: resource.name
  }
  keyboardIndex.value = index
  keyboardValue.value = resource.count ? resource.count.toString() : '0'
  showKeyboard.value = true
}

// Функции клавиатуры
const pressNumber = (num) => {
  if (keyboardValue.value === '0') {
    keyboardValue.value = num.toString()
  } else {
    keyboardValue.value += num.toString()
  }
}

const pressBackspace = () => {
  if (keyboardValue.value.length > 1) {
    keyboardValue.value = keyboardValue.value.slice(0, -1)
  } else {
    keyboardValue.value = '0'
  }
}

const pressClear = () => {
  keyboardValue.value = '0'
}

const confirmKeyboard = () => {
  const value = parseInt(keyboardValue.value) || 0
  productionStore.setResourceCount(keyboardIndex.value, value)
  cancelKeyboard()
}

const cancelKeyboard = () => {
  showKeyboard.value = false
  keyboardResource.value = null
  keyboardValue.value = '0'
  keyboardIndex.value = null
}

// ЗАГРУЗКА ДАННЫХ
onMounted(async () => {
  if (productionStore.plantLevelsInfo.length === 0) {
    await productionStore.fetchPlantLevels()
  }
})

// Expose состояния для родительского компонента
defineExpose({
  showKeyboard,
  showResultSheet,
  showInput,
  showSelection,
  backToSelection,
  closeKeyboard: cancelKeyboard,
  closeResults: () => { showResultSheet.value = false },
  handleBack // Универсальная функция "Назад"
})
</script>

<template>
  <div style="position: relative; min-height: 100vh;">
    <!-- Диалог с клавиатурой -->
    <VDialog 
      v-model="showKeyboard" 
      fullscreen 
      transition="dialog-bottom-transition"
    >
      <VCard v-if="keyboardResource">

        <VCardText class="pa-4">
          <!-- Информация о ресурсе -->
          <VCard class="mb-4" elevation="2">
            <VCardText class="pa-4">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <VImg
                    :src="`/images/resources/${keyboardResource.identificator}.png`"
                    width="48"
                    height="48"
                    class="mr-3"
                  />
                  <div>
                    <div class="text-h6">{{ keyboardResource.name }}</div>
                    <div class="text-caption text-grey">
                      Количество
                    </div>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>

          <!-- Дисплей введенного значения -->
          <div class="quantity-display-mobile">
            {{ keyboardValue }}
          </div>

          <!-- Кастомная клавиатура -->
          <div class="keyboard-container">
            <div class="keyboard-row">
              <VBtn 
                v-for="num in [1, 2, 3]" 
                :key="num"
                class="keyboard-btn"
                size="x-large"
                variant="flat"
                :ripple="true"
                @click="pressNumber(num)"
                @touchstart.passive
                style="background-color: white !important; color: #333 !important;"
              >
                {{ num }}
              </VBtn>
            </div>
            <div class="keyboard-row">
              <VBtn 
                v-for="num in [4, 5, 6]" 
                :key="num"
                class="keyboard-btn"
                size="x-large"
                variant="flat"
                :ripple="true"
                @click="pressNumber(num)"
                @touchstart.passive
                style="background-color: white !important; color: #333 !important;"
              >
                {{ num }}
              </VBtn>
            </div>
            <div class="keyboard-row">
              <VBtn 
                v-for="num in [7, 8, 9]" 
                :key="num"
                class="keyboard-btn"
                size="x-large"
                variant="flat"
                :ripple="true"
                @click="pressNumber(num)"
                @touchstart.passive
                style="background-color: white !important; color: #333 !important;"
              >
                {{ num }}
              </VBtn>
            </div>
            <div class="keyboard-row">
              <VBtn 
                class="keyboard-btn keyboard-zero"
                size="x-large"
                variant="flat"
                :ripple="true"
                style="background-color: white !important; color: #333 !important;"
                @click="pressNumber(0)"
              >
                0
              </VBtn>
              <VBtn 
                class="keyboard-btn"
                size="x-large"
                variant="flat"
                :ripple="true"
                style="background-color: #ffc107 !important; color: white !important;"
                @click="pressBackspace"
              >
                <VIcon style="color: white !important;">mdi-backspace-outline</VIcon>
              </VBtn>
              <VBtn 
                class="keyboard-btn"
                size="x-large"
                variant="flat"
                :ripple="true"
                style="background-color: #f44336 !important; color: white !important;"
                @click="pressClear"
              >
                C
              </VBtn>
            </div>
            <div class="keyboard-row mt-2">
              <VBtn 
                block
                size="x-large"
                variant="flat"
                :ripple="true"
                style="background-color: #4caf50 !important; color: white !important;"
                @click="confirmKeyboard"
              >
                <VIcon class="mr-2" style="color: white !important;">mdi-check</VIcon>
                Готово
              </VBtn>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Основной контент -->
    <div v-if="!productionStore.isLoading">
      <!-- ЭКРАН ВЫБОРА ПРЕДПРИЯТИЯ -->
      <div v-if="showSelection">
        <!-- Хедер -->
        <v-card class="mb-3">
          <v-card-text class="pa-3 text-center">
            <div class="d-flex align-center justify-center">
              <v-icon icon="mdi-factory" size="32" class="mr-2" color="primary"></v-icon>
              <span class="text-h5 font-weight-bold">Выберите предприятие</span>
            </div>
          </v-card-text>
        </v-card>

        <!-- Сетка предприятий -->
        <div class="plant-selection-grid">
          <v-card
            v-for="plant in productionStore.plantLevelsInfo"
            :key="plant.id"
            @click="selectPlant(plant.id)"
            class="plant-card"
            elevation="3"
          >
            <v-card-text class="pa-4 text-center">
              <!-- Уровень большой цифрой -->
              <div class="plant-level-number">
                {{ plant.level }}
              </div>
              <!-- Название предприятия -->
              <div class="plant-name">
                {{ plant.name }}
              </div>
            </v-card-text>
          </v-card>
        </div>
        <!-- Отступ для плавающей кнопки -->
        <div style="height: 80px;"></div>
      </div>

      <!-- ЭКРАН ВВОДА РЕСУРСОВ -->
      <div v-if="showInput">
        <!-- Информация о выбранном предприятии -->
        <v-card class="mb-3" v-if="productionStore.selectedPlantLevel">
          <v-card-text class="pa-3 text-center">
            <div class="text-h6 font-weight-bold">
              {{ productionStore.selectedPlantLevel.name }}
            </div>
            <div class="text-h4 text-primary mt-1">
              Уровень {{ productionStore.selectedPlantLevel.level }}
            </div>
          </v-card-text>
        </v-card>

        <!-- Режим расчета -->
        <v-card class="mb-3">
        <v-card-title class="text-center py-2">Режим</v-card-title>
        <v-card-text class="pa-2">
          <v-btn-toggle
            v-model="productionStore.calculationMode"
            mandatory
            divided
            variant="outlined"
            color="primary"
            class="d-flex"
          >
            <v-btn value="from" class="flex-grow-1">
              Произвести
            </v-btn>
            <v-btn value="to" class="flex-grow-1">
              Рассчитать
            </v-btn>
          </v-btn-toggle>
        </v-card-text>
      </v-card>

        <!-- Ввод ресурсов -->
        <v-card class="mb-3" v-if="productionStore.inputResources.length">
          <v-card-title class="text-center py-2 bg-primary">
            {{ productionStore.calculationMode === 'from' ? 'У вас есть' : 'Хотите получить' }}
          </v-card-title>
        <v-card-text class="pa-2">
          <div class="mobile-resources-grid">
            <div
              v-for="(resource, index) in productionStore.inputResources"
              :key="'prod-' + index"
              class="mobile-resource-item clickable"
              @click="openKeyboard(resource, index)"
            >
              <div class="resource-row">
                <v-img
                  :src="`/images/resources/${resource.identificator}.png`"
                  width="48"
                  height="48"
                  class="resource-icon-mobile"
                ></v-img>
                <div class="resource-info">
                  <div class="resource-name-bold">{{ resource.name }}</div>
                </div>
                <div
                  class="resource-count-display"
                  :class="resource.count > 0 ? 'has-value' : ''"
                >
                  {{ resource.count || '0' }}
                </div>
              </div>
            </div>
          </div>
          </v-card-text>
        </v-card>

        <!-- Кнопки -->
        <v-card class="mb-3" v-if="productionStore.inputResources.length">
        <v-card-text class="pa-2">
          <v-row dense>
            <v-col cols="6">
              <v-btn @click="clearProduction" color="error" block size="large">
                Очистить
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn 
                @click="calculateProduction" 
                block 
                color="primary" 
                size="large"
                :disabled="!hasInputResources"
              >
                Рассчитать
              </v-btn>
            </v-col>
          </v-row>
          </v-card-text>
        </v-card>
      </div>

      <!-- Результаты -->
      <v-bottom-sheet v-model="showResultSheet">
        <v-card>
          <v-card-title class="text-center">
            {{ productionStore.calculationMode === 'from' ? 'Вы получите' : 'Вам потребуется' }}
          </v-card-title>
          <v-card-text>
            <div class="results-mobile">
              <div v-for="(item, index) in productionStore.resultDisplay" :key="index" class="result-item-mobile">
                <v-img
                  :src="`/images/resources/${item.identificator}.png`"
                  width="40"
                  height="40"
                  class="mr-3"
                ></v-img>
                <div class="result-info">
                  <span class="result-name">{{ item.name }}</span>
                  <span class="result-count positive">
                    {{ Math.floor(item.count) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="productionStore.changeDisplay.length" class="mt-3">
              <div class="text-subtitle-2 mb-2">Остаток (не используется):</div>
              <div class="results-mobile">
                <div v-for="(item, index) in productionStore.changeDisplay" :key="'change-'+index" class="result-item-mobile">
                  <v-img
                    :src="`/images/resources/${item.identificator}.png`"
                    width="40"
                    height="40"
                    class="mr-3"
                  ></v-img>
                  <div class="result-info">
                    <span class="result-name">{{ item.name }}</span>
                    <span class="result-count">
                      {{ item.count }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="showResultSheet = false" block color="primary">Закрыть</v-btn>
          </v-card-actions>
        </v-card>
      </v-bottom-sheet>
    </div>

    <div v-else class="d-flex flex-column align-center justify-center" style="min-height: 100vh;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4">Загрузка...</div>
    </div>

    <!-- Плавающая кнопка "Назад" внизу -->
    <div class="floating-back-button">
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
    </div>
  </div>
</template>

<style scoped>
.mobile-resources-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-resource-item {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
}

.mobile-resource-item.clickable {
  cursor: pointer;
}

.mobile-resource-item.clickable:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.mobile-resource-item.clickable:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.resource-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resource-icon-mobile {
  flex-shrink: 0;
  border-radius: 4px;
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-name-bold {
  font-weight: 700;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #1a1a1a;
}

.results-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item-mobile {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.result-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.result-name {
  font-weight: 600;
  font-size: 16px;
}

.result-count {
  font-size: 20px;
  font-weight: 700;
}

.result-count.positive {
  color: green;
}

.keyboard-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
}

.keyboard-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.keyboard-btn {
  flex: 1;
  min-width: 0;
  height: 44px !important;
  font-size: 20px !important;
  font-weight: bold !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.keyboard-btn:active {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
  transform: translateY(1px);
}

.keyboard-zero {
  flex: 1;
  margin-right: 0;
}

.resource-count-display {
  min-width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #666;
  background-color: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 0 12px;
}

.resource-count-display.has-value {
  color: #4caf50;
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
}

.plant-selection-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
}

.plant-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.plant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
  border-color: #1976d2;
}

.plant-card:active {
  transform: translateY(-2px);
}

.plant-level-number {
  font-size: 48px;
  font-weight: bold;
  color: #1976d2;
  line-height: 1;
}

.plant-name {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-top: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quantity-display-mobile {
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  border: 2px solid #1976d2;
  font-size: 48px;
  font-weight: bold;
  color: #1976d2;
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

