<script setup>
import { ref, watch, onMounted } from 'vue'
import { useProductionStore } from '@/stores/production'

const productionStore = useProductionStore()

// Состояния для UI
const showKeyboard = ref(false)
const keyboardResource = ref(null)
const keyboardValue = ref('0')
const keyboardIndex = ref(null)
const showResultSheet = ref(false)

// Watcher для инициализации inputResources
watch([() => productionStore.selectedPlantId, () => productionStore.calculationMode], () => {
  productionStore.initializeInputResources()
})

// ДЕЙСТВИЯ
const calculateProduction = () => {
  try {
    productionStore.calculateProduction()
    showResultSheet.value = true
  } catch (error) {
    alert(error.message)
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
</script>

<template>
  <div>
    <!-- Диалог с клавиатурой -->
    <v-dialog 
      v-model="showKeyboard" 
      fullscreen 
      transition="dialog-bottom-transition"
    >
      <v-card v-if="keyboardResource">
        <v-toolbar color="primary">
          <v-btn icon @click="cancelKeyboard">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-toolbar-title>Выбор количества</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>

        <v-card-text class="pa-4">
          <!-- Информация о ресурсе -->
          <v-card class="mb-4" elevation="2">
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-img
                    :src="`/images/resources/${keyboardResource.identificator}.png`"
                    width="48"
                    height="48"
                    class="mr-3"
                  ></v-img>
                  <div>
                    <div class="text-h6">{{ keyboardResource.name }}</div>
                    <div class="text-caption text-grey">Количество</div>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Дисплей введенного значения -->
          <v-card class="mb-3" elevation="0" color="grey-lighten-4">
            <v-card-text class="pa-4">
              <div class="text-h3 text-center text-primary font-weight-bold">
                {{ keyboardValue }}
              </div>
            </v-card-text>
          </v-card>

          <!-- Кастомная клавиатура -->
          <div class="keyboard-container">
            <div class="keyboard-row">
              <v-btn 
                v-for="num in [1, 2, 3]" 
                :key="num"
                class="keyboard-btn"
                size="x-large"
                variant="flat"
                @click="pressNumber(num)"
              >
                {{ num }}
              </v-btn>
            </div>
            <div class="keyboard-row">
              <v-btn 
                v-for="num in [4, 5, 6]" 
                :key="num"
                class="keyboard-btn"
                size="x-large"
                variant="flat"
                @click="pressNumber(num)"
              >
                {{ num }}
              </v-btn>
            </div>
            <div class="keyboard-row">
              <v-btn 
                v-for="num in [7, 8, 9]" 
                :key="num"
                class="keyboard-btn"
                size="x-large"
                variant="flat"
                @click="pressNumber(num)"
              >
                {{ num }}
              </v-btn>
            </div>
            <div class="keyboard-row">
              <v-btn 
                class="keyboard-btn keyboard-zero"
                size="x-large"
                variant="flat"
                @click="pressNumber(0)"
              >
                0
              </v-btn>
              <v-btn 
                class="keyboard-btn"
                size="x-large"
                color="orange"
                variant="flat"
                @click="pressBackspace"
              >
                <v-icon>mdi-backspace-outline</v-icon>
              </v-btn>
              <v-btn 
                class="keyboard-btn"
                size="x-large"
                color="red"
                variant="flat"
                @click="pressClear"
              >
                C
              </v-btn>
            </div>
            <div class="keyboard-row mt-2">
              <v-btn 
                block
                size="x-large"
                color="success"
                variant="flat"
                @click="confirmKeyboard"
              >
                <v-icon class="mr-2">mdi-check</v-icon>
                Готово
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Основной контент -->
    <div v-if="!productionStore.isLoading">
      <!-- Хедер -->
      <v-card class="mb-3">
        <v-card-text class="pa-3 text-center">
          <div class="d-flex align-center justify-center">
            <v-icon icon="mdi-factory" size="32" class="mr-2" color="primary"></v-icon>
            <span class="text-h5 font-weight-bold">Производство</span>
          </div>
        </v-card-text>
      </v-card>

      <!-- Выбор типа предприятия -->
      <v-card class="mb-3" v-if="productionStore.uniquePlantTypes.length">
        <v-card-title class="text-center py-2">Тип предприятия</v-card-title>
        <v-card-text class="pa-2">
          <div class="plant-type-grid">
            <v-btn
              v-for="(plantType, index) in productionStore.uniquePlantTypes"
              :key="'type-' + index"
              @click="productionStore.selectedPlantTypeIndex = index"
              :color="productionStore.selectedPlantTypeIndex === index ? 'primary' : 'default'"
              :variant="productionStore.selectedPlantTypeIndex === index ? 'flat' : 'outlined'"
              block
              size="large"
              class="mb-2"
            >
              {{ plantType }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Выбор уровня -->
      <v-card class="mb-3" v-if="productionStore.filteredPlantsByType.length">
        <v-card-title class="text-center py-2">Уровень</v-card-title>
        <v-card-text class="pa-2">
          <v-btn-toggle
            v-model="productionStore.selectedPlantLevelIndex"
            mandatory
            divided
            variant="outlined"
            color="primary"
            class="d-flex"
          >
            <v-btn
              v-for="(plant, index) in productionStore.filteredPlantsByType"
              :key="'level-' + plant.id"
              class="flex-grow-1"
            >
              Уровень {{ plant.level }}
            </v-btn>
          </v-btn-toggle>
        </v-card-text>
      </v-card>

      <!-- Режим расчета -->
      <v-card class="mb-3" v-if="productionStore.selectedPlantId">
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
              class="mobile-resource-item"
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
                <v-btn
                  @click="openKeyboard(resource, index)"
                  variant="outlined"
                  size="large"
                  class="keyboard-trigger-btn"
                  :color="resource.count > 0 ? 'success' : 'grey'"
                >
                  {{ resource.count || '0' }}
                </v-btn>
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
              <v-btn @click="calculateProduction" block color="primary" size="large">
                Рассчитать
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

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
  max-width: 400px;
  margin: 0 auto;
}

.keyboard-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.keyboard-btn {
  flex: 1;
  min-width: 0;
  font-size: 24px !important;
  font-weight: bold;
  height: 60px !important;
}

.keyboard-zero {
  flex: 1.5;
}

.keyboard-trigger-btn {
  min-width: 80px !important;
  font-size: 18px !important;
  font-weight: bold !important;
  height: 48px !important;
}

.plant-type-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>

