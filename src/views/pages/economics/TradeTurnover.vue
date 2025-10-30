<script setup>
import axios from 'axios'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const tradeTurnovers = ref([])
const tradeLevels = ref({})
const allThresholds = ref({})
const isLoading = ref(true)
const pollInterval = ref(null)
const thresholdsDialog = ref(false)
const selectedCountry = ref(null)
const countryThresholds = ref([])
const loadingThresholds = ref(false)

// Редактирование порогов
const editDialog = ref(false)
const editableThresholds = ref([])
const inputMode = ref('absolute') // 'absolute' или 'percentage'
const savingThresholds = ref(false)

// Загружаем товарообороты всех стран
const fetchTradeTurnovers = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/show_trade_turnover.json`)
    console.log('Товарообороты:', response.data)
    tradeTurnovers.value = response.data
    
    // Загружаем уровни торговли и пороги для каждой страны
    await fetchTradeLevels()
  } catch (error) {
    console.error('Error fetching trade turnovers:', error)
  }
}

// Загружаем текущие уровни торговли для всех стран (bulk)
const fetchTradeLevels = async () => {
  try {
    const ids = tradeTurnovers.value.map(i => i.country_id)
    if (!ids.length) return
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/trade_levels_and_thresholds.json`, {
      params: { ids: ids.join(',') }
    })
    const items = response.data?.data || []
    items.forEach(({ country_id, level, thresholds }) => {
      if (level) tradeLevels.value[country_id] = level
      if (Array.isArray(thresholds) && thresholds.length > 0) allThresholds.value[country_id] = thresholds
    })
  } catch (error) {
    console.error('Error fetching trade levels (bulk):', error)
  }
}

// Открыть модальное окно с порогами для страны
const openThresholdsDialog = async (country) => {
  selectedCountry.value = country
  thresholdsDialog.value = true
  
  // Используем закешированные данные если они есть
  if (allThresholds.value[country.country_id]) {
    countryThresholds.value = allThresholds.value[country.country_id]
    loadingThresholds.value = false
  } else {
    // Если нет, загружаем
    loadingThresholds.value = true
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/${country.country_id}/show_trade_thresholds.json`)
      countryThresholds.value = response.data
      allThresholds.value[country.country_id] = response.data
    } catch (error) {
      console.error('Error fetching thresholds:', error)
    } finally {
      loadingThresholds.value = false
    }
  }
}

// Загружаем данные при монтировании
onMounted(async () => {
  try {
    await fetchTradeTurnovers()
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
  
  // Устанавливаем периодический опрос каждые 30 секунд
  pollInterval.value = setInterval(fetchTradeTurnovers, 30000)
})

// Очищаем интервал при размонтировании
onBeforeUnmount(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
  }
})

// Обновить данные
const refreshData = async () => {
  isLoading.value = true
  try {
    await fetchTradeTurnovers()
  } finally {
    isLoading.value = false
  }
}

// Форматирование числа с разделителями
const formatNumber = (num) => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0'
}

// Получение короткого названия страны
const getShortName = (name) => {
  const shortNames = {
    'Большая Орда': 'Орда',
    'Ливонский орден': 'Ливония',
    'Королевство Швеция': 'Швеция',
    'Великое княжество Литовское': 'Литва',
    'Казанское ханство': 'Казань',
    'Крымское ханство': 'Крым',
  }
  return shortNames[name] || name
}

// Вычисление процента прогресса до следующего уровня
const getProgressPercent = (countryId, tradeTurnover) => {
  const level = tradeLevels.value[countryId]
  const thresholds = allThresholds.value[countryId]
  
  if (!level || !thresholds || thresholds.length === 0) return 0
  
  // Обрабатываем nil/undefined как 0
  const safeTurnover = tradeTurnover || 0
  
  const currentLevel = level.current_level
  const nextThreshold = level.threshold
  
  // Находим порог ПРЕДЫДУЩЕГО уровня (current_level - 1)
  let previousThreshold = 0
  if (currentLevel > 1) {
    const previousLevelData = thresholds.find(t => t.level === (currentLevel - 1))
    if (previousLevelData) {
      previousThreshold = previousLevelData.threshold
    }
  }
  
  // Вычисляем прогресс между предыдущим и следующим порогом
  const levelRange = nextThreshold - previousThreshold
  const currentProgress = safeTurnover - previousThreshold
  
  if (levelRange <= 0) return 0
  
  const percent = (currentProgress / levelRange) * 100
  
  return Math.min(Math.max(percent, 0), 100)
}

// Определение цвета прогресс-бара
const getProgressColor = (level) => {
  if (!level) return 'grey'
  const currentLevel = level.current_level
  if (currentLevel >= 5) return 'success'
  if (currentLevel >= 4) return 'primary'
  if (currentLevel >= 2) return 'warning'
  return 'info'
}

// Открыть окно редактирования порогов
const openEditDialog = () => {
  // Копируем текущие пороги для редактирования
  editableThresholds.value = JSON.parse(JSON.stringify(countryThresholds.value))
  // Добавляем поле для процента к каждому порогу
  editableThresholds.value.forEach((threshold, index) => {
    if (index > 0) {
      const prevThreshold = editableThresholds.value[index - 1].threshold
      threshold.percentage = Math.round((threshold.threshold / prevThreshold) * 100)
    } else {
      threshold.percentage = 100
    }
    // Убеждаемся что поле name существует
    if (!threshold.name) {
      threshold.name = ''
    }
  })
  editDialog.value = true
}

// Пересчет порогов при изменении процента
const recalculateFromPercentage = (index) => {
  if (index === 0) return
  
  const prevThreshold = editableThresholds.value[index - 1].threshold
  const percentage = editableThresholds.value[index].percentage
  
  if (percentage && percentage > 0) {
    editableThresholds.value[index].threshold = Math.round((prevThreshold * percentage) / 100)
  }
}

// Пересчет процента при изменении суммы
const recalculatePercentage = (index) => {
  if (index === 0) return
  
  const prevThreshold = editableThresholds.value[index - 1].threshold
  const currentThreshold = editableThresholds.value[index].threshold
  
  if (prevThreshold > 0) {
    editableThresholds.value[index].percentage = Math.round((currentThreshold / prevThreshold) * 100)
  }
}

// Валидация и автоматический пересчет если порог меньше предыдущего
const validateAndFixThresholds = (changedIndex) => {
  if (changedIndex === 0) return
  
  const currentThreshold = editableThresholds.value[changedIndex].threshold
  const prevThreshold = editableThresholds.value[changedIndex - 1].threshold
  
  // Если текущий порог меньше или равен предыдущему
  if (currentThreshold <= prevThreshold) {
    // Устанавливаем минимальное увеличение (например, +1000)
    const minIncrease = 1000
    editableThresholds.value[changedIndex].threshold = prevThreshold + minIncrease
    
    // Пересчитываем процент
    recalculatePercentage(changedIndex)
    
    // Пересчитываем все последующие
    recalculateAllFromIndex(changedIndex)
  }
  
  // Проверяем, не нарушена ли последовательность в последующих уровнях
  for (let i = changedIndex + 1; i < editableThresholds.value.length; i++) {
    const current = editableThresholds.value[i].threshold
    const previous = editableThresholds.value[i - 1].threshold
    
    if (current <= previous) {
      // Если текущий режим - процент, пересчитываем от процента
      if (inputMode.value === 'percentage') {
        recalculateFromPercentage(i)
      } else {
        // В абсолютном режиме добавляем разницу
        const diff = editableThresholds.value[changedIndex].threshold - prevThreshold
        editableThresholds.value[i].threshold = editableThresholds.value[i - 1].threshold + Math.max(diff, 1000)
        recalculatePercentage(i)
      }
    }
  }
}

// Пересчет всех последующих порогов
const recalculateAllFromIndex = (startIndex) => {
  for (let i = startIndex + 1; i < editableThresholds.value.length; i++) {
    if (inputMode.value === 'percentage') {
      recalculateFromPercentage(i)
    } else {
      recalculatePercentage(i)
    }
  }
}

// Сохранить обновленные пороги
const saveThresholds = async () => {
  savingThresholds.value = true
  try {
    // Подготавливаем данные для отправки (удаляем поле percentage)
    const thresholdsToSave = editableThresholds.value.map(({ level, threshold, name }) => ({
      level,
      threshold,
      name: name || ''
    }))
    
    const response = await axios.patch(
      `${import.meta.env.VITE_PROXY}/countries/${selectedCountry.value.country_id}/update_trade_thresholds.json`,
      { thresholds: thresholdsToSave }
    )
    
    if (response.data.success) {
      // Обновляем локальные данные
      countryThresholds.value = response.data.thresholds
      allThresholds.value[selectedCountry.value.country_id] = response.data.thresholds
      
      // Перезагружаем данные о текущих уровнях
      await fetchTradeLevels()
      
      // Закрываем окно редактирования
      editDialog.value = false
      
      alert('Пороги успешно обновлены!')
    }
  } catch (error) {
    console.error('Error saving thresholds:', error)
    alert('Ошибка при сохранении порогов: ' + (error.response?.data?.error || error.message))
  } finally {
    savingThresholds.value = false
  }
}

// Отменить редактирование
const cancelEdit = () => {
  editDialog.value = false
  editableThresholds.value = []
}
</script>

<template>
  <div v-if="!isLoading" class="trade-turnover-container">
    
    <!-- Заголовок и кнопка обновления -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Товарооборот с иностранными государствами</span>
        <v-btn 
          color="primary" 
          @click="refreshData"
          :loading="isLoading"
        >
          <v-icon icon="mdi-refresh" class="mr-2" />
          Обновить
        </v-btn>
      </VCardTitle>
    </VCard>

    <!-- Таблица с товарооборотом -->
    <VCard>
      <VCardText>
        <v-table>
          <thead>
            <tr>
              <th class="text-left">Страна</th>
              <th class="text-center">Флаг</th>
              <th class="text-left" style="min-width: 350px;">Прогресс до следующего уровня</th>
              <th class="text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in tradeTurnovers" 
              :key="item.country_id"
            >
              <!-- Название страны -->
              <td class="text-left">
                <span class="font-weight-bold text-h6">{{ getShortName(item.country_name) }}</span>
              </td>
              
              <!-- Флаг -->
              <td class="text-center">
                <div style="position: relative; display: inline-block;">
                  <!-- Иконка отношений -->
                  <div 
                    v-if="item.relations !== undefined"
                    style="
                      position: absolute;
                      top: -5px;
                      left: -5px;
                      background: rgba(255, 255, 255, 0.95);
                      padding: 3px;
                      border-radius: 50%;
                      border: 2px solid #1976d2;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                      z-index: 1;
                    "
                  >
                    <v-img
                      :src="`/images/relations/${item.relations}.png`"
                      width="24"
                      height="24"
                      :alt="`Отношения: ${item.relations}`"
                    >
                      <v-tooltip activator="parent" location="top">
                        Отношения с Русью: {{ item.relations }}
                      </v-tooltip>
                    </v-img>
                  </div>
                  
                  <v-img
                    :src="`/images/countries/${item.country_name}.png`"
                    width="80"
                    height="60"
                    style="border: 1px solid #ddd; border-radius: 4px;"
                  />
                </div>
              </td>
              
              <!-- Прогресс-бар -->
              <td class="text-left">
                <div v-if="tradeLevels[item.country_id]">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-body-2">
                      Товарооборот: <strong>{{ formatNumber(item.trade_turnover) }}</strong> золота
                    </span>
                    <span class="text-body-2">
                      Порог: <strong>{{ formatNumber(tradeLevels[item.country_id].threshold) }}</strong> золота
                    </span>
                  </div>
                  <v-progress-linear
                    :model-value="getProgressPercent(item.country_id, item.trade_turnover)"
                    :color="getProgressColor(tradeLevels[item.country_id])"
                    height="25"
                    rounded
                  >
                    <template v-slot:default>
                      <span class="text-caption font-weight-bold">
                        Осталось: {{ formatNumber(tradeLevels[item.country_id].to_next_level) }} золота
                      </span>
                    </template>
                  </v-progress-linear>
                  <div class="text-caption mt-1 text-center">
                    До следующего уровня
                  </div>
                </div>
                <div v-else class="text-center">
                  <v-progress-circular indeterminate size="24" />
                </div>
              </td>
              
              <!-- Действия -->
              <td class="text-center">
                <v-btn
                  color="primary"
                  variant="tonal"
                  size="small"
                  @click="openThresholdsDialog(item)"
                >
                  <v-icon icon="mdi-information" class="mr-1" />
                  Уровни
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </VCardText>
    </VCard>

    <!-- Легенда -->
    <VCard class="mt-4">
      <VCardText>
        <h4 class="mb-3">Пояснение:</h4>
        <div class="text-body-2">
          <p><strong>Товарооборот</strong> — общая сумма всех торговых операций (покупок и продаж) между Русью и данной страной.</p>
          <p class="mb-2">Вычисляется как сумма товарооборотов всех караванов этой страны.</p>
          <p><strong>Уровень торговли</strong> — определяется на основе суммарного товарооборота. Чем выше уровень, тем больше возможностей для торговли.</p>
        </div>
      </VCardText>
    </VCard>

    <!-- Модальное окно с порогами уровней -->
    <v-dialog
      v-model="thresholdsDialog"
      max-width="600"
    >
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Уровни торговли: {{ selectedCountry ? getShortName(selectedCountry.country_name) : '' }}</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="thresholdsDialog = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="loadingThresholds" class="text-center py-8">
            <v-progress-circular indeterminate size="48" />
            <div class="mt-4">Загрузка данных...</div>
          </div>
          <div v-else-if="countryThresholds.length > 0">
            <v-table>
              <thead>
                <tr>
                  <th class="text-center">Уровень</th>
                  <th class="text-left">Название</th>
                  <th class="text-right">Порог товарооборота</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="threshold in countryThresholds"
                  :key="threshold.level"
                  :class="{ 'bg-primary-lighten-5': tradeLevels[selectedCountry?.country_id]?.current_level === threshold.level }"
                >
                  <td class="text-center">
                    <v-chip 
                      :color="tradeLevels[selectedCountry?.country_id]?.current_level === threshold.level ? 'primary' : 'default'"
                      size="small"
                    >
                      {{ threshold.level }}
                    </v-chip>
                  </td>
                  <td class="text-left">
                    <span class="font-weight-medium">{{ threshold.name || '—' }}</span>
                  </td>
                  <td class="text-right font-weight-bold">
                    {{ formatNumber(threshold.threshold) }} золота
                  </td>
                </tr>
              </tbody>
            </v-table>
            <v-divider class="my-4" />
            <div class="text-body-2">
              <v-alert 
                v-if="selectedCountry && tradeLevels[selectedCountry.country_id]"
                type="info"
                variant="tonal"
              >
                <strong>Текущий товарооборот:</strong> {{ formatNumber(selectedCountry.trade_turnover) }} золота<br>
                <strong>Текущий уровень:</strong> {{ tradeLevels[selectedCountry.country_id].current_level }}<br>
                <strong>До следующего уровня:</strong> {{ formatNumber(tradeLevels[selectedCountry.country_id].to_next_level) }} золота
              </v-alert>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <v-icon icon="mdi-alert" size="48" color="warning" />
            <div class="mt-4">Нет данных о порогах</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="warning"
            variant="tonal"
            @click="openEditDialog"
          >
            <v-icon icon="mdi-pencil" class="mr-1" />
            Редактировать
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="thresholdsDialog = false"
          >
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Модальное окно редактирования порогов -->
    <v-dialog
      v-model="editDialog"
      max-width="700"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Редактирование порогов: {{ selectedCountry ? getShortName(selectedCountry.country_name) : '' }}</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="cancelEdit"
          />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <!-- Переключатель режима ввода -->
          <v-card class="mb-4" color="primary" variant="tonal">
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <span class="text-subtitle-1 font-weight-bold">Режим ввода:</span>
                <v-btn-toggle
                  v-model="inputMode"
                  color="primary"
                  mandatory
                  divided
                >
                  <v-btn value="absolute" min-width="220">
                    <v-icon icon="mdi-currency-usd" class="mr-2" />
                    Абсолютная сумма
                  </v-btn>
                  <v-btn value="percentage" min-width="220">
                    <v-icon icon="mdi-percent" class="mr-2" />
                    Процент
                  </v-btn>
                </v-btn-toggle>
              </div>
              <v-alert class="mt-3" type="info" variant="tonal" density="compact">
                <template v-if="inputMode === 'absolute'">
                  <strong>Абсолютная сумма:</strong> Введите точную сумму золота для каждого уровня
                </template>
                <template v-else>
                  <strong>Процент:</strong> Укажите процент от предыдущего уровня (например, 200% от 1000 = 2000)
                </template>
              </v-alert>
            </v-card-text>
          </v-card>

          <!-- Таблица редактирования -->
          <v-table>
            <thead>
              <tr>
                <th class="text-center">Уровень</th>
                <th class="text-center">Название</th>
                <th class="text-center" v-if="inputMode === 'absolute'">Порог (золото)</th>
                <th class="text-center" v-if="inputMode === 'percentage'">Процент от пред. уровня</th>
                <th class="text-center" v-if="inputMode === 'percentage'">Порог (золото)</th>
                <th class="text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(threshold, index) in editableThresholds"
                :key="threshold.level"
              >
                <!-- Уровень -->
                <td class="text-center">
                  <v-chip color="primary" size="small">
                    {{ threshold.level }}
                  </v-chip>
                </td>

                <!-- Название уровня -->
                <td class="text-center">
                  <v-text-field
                    v-model="threshold.name"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="Название"
                  />
                </td>

                <!-- Режим абсолютной суммы -->
                <template v-if="inputMode === 'absolute'">
                  <td class="text-center">
                    <v-text-field
                      v-model.number="threshold.threshold"
                      type="number"
                      density="compact"
                      variant="outlined"
                      hide-details
                      :disabled="index === 0"
                      @input="() => { recalculatePercentage(index); validateAndFixThresholds(index); }"
                      @blur="recalculateAllFromIndex(index)"
                    />
                  </td>
                </template>

                <!-- Режим процентов -->
                <template v-if="inputMode === 'percentage'">
                  <td class="text-center">
                    <v-text-field
                      v-if="index > 0"
                      v-model.number="threshold.percentage"
                      type="number"
                      suffix="%"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @input="() => { recalculateFromPercentage(index); validateAndFixThresholds(index); }"
                      @blur="recalculateAllFromIndex(index)"
                    />
                    <span v-else class="text-body-2 text-medium-emphasis">—</span>
                  </td>
                  <td class="text-center">
                    <span class="font-weight-bold">{{ formatNumber(threshold.threshold) }}</span>
                  </td>
                </template>

                <!-- Действия -->
                <td class="text-center">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="info"
                    @click="recalculateAllFromIndex(index)"
                  >
                    <v-icon icon="mdi-calculator" />
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-divider class="my-4" />

          <!-- Подсказка -->
          <v-alert type="info" variant="tonal" density="compact">
            <v-icon icon="mdi-information" class="mr-2" />
            <strong>Автоматическая валидация:</strong> 
            <ul class="mt-2 mb-0">
              <li>Каждый следующий порог должен быть больше предыдущего</li>
              <li>Если вы укажете меньшее значение, оно автоматически исправится (+1000 минимум)</li>
              <li>Все последующие уровни пересчитаются автоматически</li>
            </ul>
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="error"
            variant="text"
            @click="cancelEdit"
          >
            Отмена
          </v-btn>
          <v-spacer />
          <v-btn
            color="success"
            variant="elevated"
            @click="saveThresholds"
            :loading="savingThresholds"
          >
            <v-icon icon="mdi-content-save" class="mr-1" />
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>

  <div v-else class="loading-container">
    <v-progress-circular indeterminate size="64" />
    <div class="mt-4">Загрузка данных...</div>
  </div>
</template>

<style scoped>
.trade-turnover-container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
}
</style>

