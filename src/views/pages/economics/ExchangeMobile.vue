<script setup>
import axios from 'axios'
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'

// Основной функционал
const isLoading = ref(true)
const isFirstRunRel = ref(true)
const isFirstRunEmbargo = ref(true)
const pollInterval = ref(null)

// Продажа и вывод
const countries = ref([])
const resources = ref({})
const selectedCountry = ref(null)
const resourcesPlSells = ref([])
const resourcesPlBuys = ref([])
const resToPlayer = ref([])

// Состояния для кастомной клавиатуры
const showKeyboard = ref(false)
const keyboardResource = ref(null)
const keyboardValue = ref('0')
const keyboardIndex = ref(null)
const keyboardType = ref(null) // 'sell' или 'buy'

// Диалоги
const showResultSheet = ref(false)
const showEmbargoDialog = ref(false)
const showRelationsDialog = ref(false)
const showEmbargoStatusDialog = ref(false)
const embargoStatusMessage = ref('')
const isEmbargoActive = ref(false)
const newRelations = ref(false)

const countriesRelations = ref([])

const fetchCountries = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/foreign_countries.json`)
    countries.value = response.data
    
    countriesRelations.value = countries.value.map(item => ({
      name: item.name,
      relations: item.relations,
      embargo: item.params["embargo"]
    }))
  } catch (error) {
    console.error('Error fetching countries:', error)
  }
}

const fetchResources = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/resources/show_prices.json`)
    resources.value = response.data.prices
    newRelations.value = false
  } catch (error) {
    console.error('Error fetching resources:', error)
  }
}

const filteredResOffMark = computed(() => {
  if (!resources.value["off_market"] || !selectedCountry.value) return []
  
  let filtered = resources.value["off_market"].filter((res) => res.country.id == selectedCountry.value)
  
  resourcesPlBuys.value = filtered.map(item => ({
    identificator: item.identificator,
    count: null
  }))
  
  return filtered
})

const filteredResToMark = computed(() => {
  if (!resources.value["to_market"]) return []
  
  let filtered = selectedCountry.value 
    ? resources.value["to_market"].filter(res => res.country.id == selectedCountry.value)
    : resources.value["to_market"]
  
  resourcesPlSells.value = filtered.map(item => ({
    identificator: item.identificator,
    count: null
  }))
  
  const goldItem = { identificator: "gold", count: null }
  resourcesPlSells.value.push({...goldItem})
  
  return [...filtered, {...goldItem}]
})

const getShortName = (name) => {
  const shortNames = {
    'Большая Орда': 'Орда',
    'Ливонский орден': 'Ливония',
    'Королевство Швеция': 'Швеция',
    'Великое княжество Литовское': 'Литва',
    'Казанское ханство': 'Казань',
    'Крымское ханство': 'Крым',
  }
  return shortNames[name] || name.substring(0, 3)
}

const selectedCountryName = computed(() => {
  if (!selectedCountry.value) return ''
  const country = countries.value.find(c => c.id === selectedCountry.value)
  return country ? getShortName(country.name) : ''
})

const embargo = computed(() => {
  if (selectedCountry.value == null) return false
  const country = countries.value.find(c => c.id === selectedCountry.value)
  return Number(country?.params?.embargo) > 0
})

const hasEmbargo = (country) => {
  return (country?.params?.embargo > 0)
}

const nameChecker = (item) => {
  if (item) {
    return `По ${item}`
  } else {
    return "Золото"
  }
}

const selectCountry = (countryId) => {
  selectedCountry.value = countryId
  // Добавляем состояние в историю для кнопки "Назад"
  window.history.pushState({ page: 'resources', countryId }, '')
}

const backToCountrySelection = () => {
  selectedCountry.value = null
  resetForm()
}

const sendCaravanRequest = async (isContraband = false) => {
  try {
    showEmbargoDialog.value = false
    
    const response = await axios.post(`${import.meta.env.VITE_PROXY}/resources/send_caravan`, {
      country_id: selectedCountry.value,
      res_pl_sells: resourcesPlSells.value.filter(r => r.count),
      res_pl_buys: resourcesPlBuys.value.filter(r => r.count)
    })
    
    resToPlayer.value = response.data.res_to_player || []
    showResultSheet.value = true
  } catch (e) {
    console.error('Ошибка расчета:', e)
  }
}

const submit = async () => {
  if (embargo.value) {
    showEmbargoDialog.value = true
    return
  }
  
  await sendCaravanRequest()
}

const confirmContraband = async () => {
  showEmbargoDialog.value = false
  try {
    await sendCaravanRequest(true)
  } catch (error) {
    console.error("Ошибка при отправке контрабанды:", error)
  }
}

// Функции для работы с кастомной клавиатурой
const openKeyboard = (item, index, type) => {
  keyboardResource.value = {
    identificator: item.identificator,
    name: item.name || item.identificator,
    price: nameChecker(type === 'sell' ? item.sell_price : item.buy_price),
    type: type
  }
  keyboardIndex.value = index
  keyboardType.value = type
  
  // Устанавливаем текущее значение
  const currentArray = type === 'sell' ? resourcesPlSells.value : resourcesPlBuys.value
  const currentValue = currentArray[index].count
  keyboardValue.value = currentValue ? currentValue.toString() : '0'
  
  showKeyboard.value = true
}

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
  const targetArray = keyboardType.value === 'sell' ? resourcesPlSells.value : resourcesPlBuys.value
  
  if (targetArray[keyboardIndex.value]) {
    targetArray[keyboardIndex.value].count = value > 0 ? value : null
  }
  
  cancelKeyboard()
}

const cancelKeyboard = () => {
  showKeyboard.value = false
  keyboardResource.value = null
  keyboardValue.value = '0'
  keyboardIndex.value = null
  keyboardType.value = null
}

const resetForm = () => {
  resourcesPlBuys.value = filteredResOffMark.value.map(item => ({
    identificator: item.identificator,
    count: null
  }))
  
  resourcesPlSells.value = filteredResToMark.value.map(item => ({
    identificator: item.identificator,
    count: null
  }))
  
  resToPlayer.value = []
  showResultSheet.value = false
}

// Обработчик кнопки "Назад" на телефоне
const handleBackButton = (event) => {
  // Если открыта клавиатура, закрываем её
  if (showKeyboard.value) {
    event.preventDefault()
    cancelKeyboard()
    return
  }
  
  // Если открыт диалог результатов, закрываем его
  if (showResultSheet.value) {
    event.preventDefault()
    showResultSheet.value = false
    return
  }
  
  // Если открыт диалог эмбарго, закрываем его
  if (showEmbargoDialog.value) {
    event.preventDefault()
    showEmbargoDialog.value = false
    return
  }
  
  // Если мы на экране 2 (выбрана страна), возвращаемся на экран 1
  if (selectedCountry.value) {
    event.preventDefault()
    backToCountrySelection()
    return
  }
  
  // Если мы на экране 1 (страна не выбрана), позволяем закрыть приложение
}

onMounted(async () => {
  try {
    await fetchCountries()
    await fetchResources()
    
    // НЕ выбираем страну автоматически - пользователь выберет сам
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
  
  pollInterval.value = setInterval(fetchCountries, 30000)

  // Обработчик кнопки "Назад" на телефоне
  window.addEventListener('popstate', handleBackButton)
  
  // Добавляем начальное состояние в историю
  window.history.pushState({ page: 'main' }, '')
})

onBeforeUnmount(() => {
  clearInterval(pollInterval.value)
  window.removeEventListener('popstate', handleBackButton)
})

watch(selectedCountry, (newVal) => {
  if (newVal) {
    filteredResOffMark.value
    filteredResToMark.value
  }
})

// Отслеживание изменения отношений
watch(
  () => countriesRelations.value.map(country => country.relations),
  (newVal, oldVal) => {
    if (isFirstRunRel.value) {
      isFirstRunRel.value = false
      return
    }
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      newRelations.value = true
      showRelationsDialog.value = true
    }
  },
  { deep: true }
)

// Отслеживание изменения эмбарго
watch(
  () => countriesRelations.value.map(country => country.embargo),
  (newVal, oldVal) => {
    if (isFirstRunEmbargo.value) {
      isFirstRunEmbargo.value = false
      return
    }

    const changedCountry = countriesRelations.value.find((country, index) => {
      return country.embargo !== oldVal[index]
    })

    if (changedCountry) {
      isEmbargoActive.value = (changedCountry.embargo > 0)
      embargoStatusMessage.value = (changedCountry.embargo > 0)
        ? `${changedCountry.name} ввела эмбарго против Руси!`
        : `${changedCountry.name} сняла эмбарго!`
      showEmbargoStatusDialog.value = true
    }
  },
  { deep: true }
)
</script>

<template>
  <VApp>
    <!-- Диалог с клавиатурой для ввода количества -->
    <VDialog 
      v-model="showKeyboard" 
      fullscreen 
      transition="dialog-bottom-transition"
    >
      <VCard v-if="keyboardResource">
        <VToolbar color="#1976d2">
          <VBtn 
            @click="cancelKeyboard" 
            variant="text"
            class="back-btn-mobile"
          >
            ← Назад
          </VBtn>
          <VToolbarTitle class="title-mobile">Выбор количества</VToolbarTitle>
          <div style="width: 50px;"></div>
        </VToolbar>

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
                      {{ keyboardResource.type === 'sell' ? 'Продажа' : 'Покупка' }}
                    </div>
                  </div>
                </div>
                <VChip color="primary" size="large">
                  {{ keyboardResource.price }}
                </VChip>
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

    <!-- ЭКРАН 1: Выбор страны -->
    <VContainer fluid class="pa-2" v-if="!isLoading && !selectedCountry">
      <!-- Хедер -->
      <VCard class="mb-3">
        <VCardText class="pa-3 text-center">
          <div class="d-flex align-center justify-center">
            <VIcon icon="ri-exchange-line" size="32" class="mr-2" color="primary" />
            <span class="text-h5 font-weight-bold">Куда караван?</span>
          </div>
        </VCardText>
      </VCard>

      <!-- Сетка стран -->
      <div class="country-selection-grid">
        <VCard
          v-for="country in countries"
          :key="country.id"
          @click="selectCountry(country.id)"
          class="country-selection-card"
          :class="{ 'embargo-card': hasEmbargo(country) }"
          elevation="3"
        >
          <VCardText class="pa-4 text-center">
            <VImg
              :src="`/images/countries/${country.name}.png`"
              width="80"
              height="60"
              class="mx-auto mb-3"
            />
            <div class="text-h6 font-weight-bold mb-1">
              {{ getShortName(country.name) }}
            </div>
            <VChip
              v-if="hasEmbargo(country)"
              color="error"
              size="small"
              class="mt-2"
            >
              Эмбарго
            </VChip>
          </VCardText>
        </VCard>
      </div>
    </VContainer>

    <!-- ЭКРАН 2: Работа с ресурсами -->
    <VContainer fluid class="pa-0" v-if="!isLoading && selectedCountry">
      <!-- Хедер с выбранной страной -->
      <div class="header-mobile">
        <VBtn 
          @click="backToCountrySelection"
          variant="text"
          class="back-btn-mobile"
        >
          ← Назад
        </VBtn>
        <div class="d-flex align-center flex-grow-1 justify-center">
          <VImg
            v-if="selectedCountry"
            :src="`/images/countries/${countries.find(c => c.id === selectedCountry)?.name}.png`"
            width="32"
            height="24"
            class="mr-2"
          />
          <span class="title-mobile">{{ selectedCountryName }}</span>
          <VChip
            v-if="embargo"
            color="error"
            size="x-small"
            class="ml-2"
          >
            Эмбарго
          </VChip>
        </div>
        <div style="width: 60px;"></div>
      </div>

      <!-- Секция "Вы отправляете с караваном" -->
      <VCard class="mb-3 section-card" style="margin: 15px;">
        <VCardTitle class="section-title-mobile">
          Вы отправляете с караваном
        </VCardTitle>
        <VCardText class="pa-3">
          <div class="mobile-resources-grid">
            <div
              v-for="(item, index) in filteredResToMark"
              :key="'sell-' + index"
              class="mobile-resource-item"
            >
              <div class="resource-row">
                <VImg
                  :src="`/images/resources/${item.identificator}.png`"
                  width="48"
                  height="48"
                  class="resource-icon-mobile"
                />
                <div class="resource-info">
                  <div class="resource-name-bold">{{ item.identificator === 'gold' ? 'Золото' : (item.name || item.identificator) }}</div>
                </div>
                <VBtn
                  @click="openKeyboard(item, index, 'sell')"
                  variant="outlined"
                  size="large"
                  class="keyboard-trigger-btn"
                  :color="resourcesPlSells[index].count > 0 ? 'success' : 'grey'"
                >
                  {{ resourcesPlSells[index].count || '0' }}
                </VBtn>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Секция "Вы покупаете" -->
      <VCard class="mb-3 section-card" style="margin: 15px;">
        <VCardTitle class="section-title-mobile">
          Вы покупаете
        </VCardTitle>
        <VCardText class="pa-3">
          <div class="mobile-resources-grid">
            <div
              v-for="(item, index) in filteredResOffMark"
              :key="'buy-' + index"
              class="mobile-resource-item"
            >
              <div class="resource-row">
                <VImg
                  :src="`/images/resources/${item.identificator}.png`"
                  width="48"
                  height="48"
                  class="resource-icon-mobile"
                />
                <div class="resource-info">
                  <div class="resource-name-bold">{{ item.identificator === 'gold' ? 'Золото' : (item.name || item.identificator) }}</div>
                </div>
                <VBtn
                  @click="openKeyboard(item, index, 'buy')"
                  variant="outlined"
                  size="large"
                  class="keyboard-trigger-btn"
                  :color="resourcesPlBuys[index].count > 0 ? 'primary' : 'grey'"
                >
                  {{ resourcesPlBuys[index].count || '0' }}
                </VBtn>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Кнопки действий -->
      <div style="padding: 0 15px 15px;">
        <VRow dense>
          <VCol cols="6">
            <VBtn 
              @click="resetForm" 
              color="#f44336" 
              block 
              class="action-btn-mobile"
              elevation="2"
            >
              Очистить
            </VBtn>
          </VCol>
          <VCol cols="6">
            <VBtn 
              @click="submit" 
              block 
              color="#4caf50" 
              class="action-btn-mobile"
              elevation="2"
            >
              Посчитать
            </VBtn>
          </VCol>
        </VRow>
      </div>

      <!-- Bottom Sheet - результаты -->
      <VBottomSheet v-model="showResultSheet">
        <VCard>
          <VCardTitle class="text-center">Выдать игроку</VCardTitle>
          <VCardText>
            <div class="results-mobile">
              <div v-for="(item, index) in resToPlayer" :key="index" class="result-item-mobile">
                <VImg
                  :src="`/images/resources/${item.identificator || 'gold'}.png`"
                  width="40"
                  height="40"
                  class="mr-3"
                />
                <div class="result-info">
                  <span class="result-name">{{ item.name }}</span>
                  <span 
                    class="result-count"
                    :class="item.count > 0 ? 'positive' : 'negative'"
                  >
                    {{ item.count > 0 ? '+' : '' }}{{ item.count }}
                  </span>
                </div>
              </div>
            </div>
          </VCardText>
          <VCardActions>
            <VBtn @click="showResultSheet = false" block color="primary">Закрыть</VBtn>
          </VCardActions>
        </VCard>
      </VBottomSheet>
    </VContainer>

    <!-- Loading экран -->
    <VContainer v-else class="d-flex flex-column align-center justify-center" style="min-height: 100vh;">
      <VProgressCircular indeterminate color="primary" size="64" />
      <div class="mt-4">Загрузка...</div>
    </VContainer>

    <!-- Диалог статуса эмбарго -->
    <VDialog v-model="showEmbargoStatusDialog" max-width="500">
      <VCard :color="isEmbargoActive ? 'error' : 'success'">
        <VCardTitle>
          {{ isEmbargoActive ? 'Эмбарго введено!' : 'Эмбарго снято!' }}
        </VCardTitle>
        <VCardText>
          {{ embargoStatusMessage }}
        </VCardText>
        <VCardActions>
          <VSpacer></VSpacer>
          <VBtn @click="showEmbargoStatusDialog = false">Закрыть</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Диалог изменения отношений -->
    <VDialog v-model="showRelationsDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">Изменение отношений!</VCardTitle>
        <VCardText>
          Отношения между странами изменились. Закройте рынок, обработайте все пришедшие караваны, обновите ценники,
          затем обновите цены в программе (кнопка "Обновить цены")
        </VCardText>
        <VCardActions>
          <VSpacer></VSpacer>
          <VBtn color="grey-darken-1" text @click="showRelationsDialog = false">
            Закрыть
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Диалог эмбарго при торговле -->
    <VDialog v-model="showEmbargoDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">Эта страна ввела эмбарго против Руси!</VCardTitle>
        <VCardText>
          Для совершения операций с этой страной нужна Контрабанда!
        </VCardText>
        <VCardActions>
          <VSpacer></VSpacer>
          <VBtn color="grey-darken-1" text @click="confirmContraband">
            Есть карточка контрабанды!
          </VBtn>
          <VBtn color="grey-darken-1" text @click="showEmbargoDialog = false">
            Закрыть
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VApp>
</template>

<style scoped>
/* Хедеры и кнопки "Назад" - стиль era_mobile */
.back-btn-mobile {
  color: white !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  padding: 4px 8px !important;
  min-width: auto !important;
  letter-spacing: normal !important;
}

.back-btn-header {
  color: #1976d2 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  padding: 4px 8px !important;
  min-width: auto !important;
  letter-spacing: normal !important;
}

.title-mobile {
  font-size: 18px !important;
  font-weight: bold !important;
  color: white !important;
}

.title-header-mobile {
  font-size: 16px !important;
  font-weight: bold !important;
  color: #1976d2 !important;
}

.header-mobile {
  display: flex;
  align-items: center;
  background-color: #1976d2;
  padding: 15px;
  border-radius: 8px 8px 0 0;
}

/* Дисплей количества - стиль era_mobile */
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

/* Секции - стиль era_mobile */
.section-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-title-mobile {
  font-size: 18px !important;
  font-weight: bold !important;
  color: #333 !important;
  text-align: left !important;
  padding: 15px 20px 10px !important;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mobile-resources-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-resource-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  border: none;
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

.resource-name {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-name-bold {
  font-weight: 700;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #1a1a1a;
}

.resource-price {
  font-size: 12px;
  opacity: 0.7;
}

.resource-input-mobile {
  width: 80px;
  flex-shrink: 0;
}

.actions-card {
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.country-grid-mobile {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 8px 0;
}

.country-btn-mobile {
  height: auto !important;
  padding: 16px 8px !important;
}

.country-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.country-name-mobile {
  font-size: 14px;
  font-weight: 600;
}

.embargo-badge {
  background: red;
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
}

.embargo-label-mobile {
  position: absolute;
  top: 4px;
  right: 4px;
  background: red;
  color: white;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 8px;
}

.embargo-border {
  border: 2px solid red !important;
  box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.3) !important;
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

.result-count.negative {
  color: red;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Стили для кастомной клавиатуры - стиль era_mobile */
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
  background-color: white !important;
  color: #333 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
  border-radius: 8px !important;
}

.keyboard-zero {
  flex: 1;
  margin-right: 0;
}

.keyboard-trigger-btn {
  min-width: 80px !important;
  font-size: 18px !important;
  font-weight: bold !important;
  height: 48px !important;
}

/* Кнопки действий - стиль era_mobile */
.action-btn-mobile {
  font-size: 18px !important;
  font-weight: bold !important;
  height: 48px !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  color: white !important;
  border-radius: 8px !important;
}

/* Стили для экрана выбора страны - стиль era_mobile */
.country-selection-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 8px;
}

.country-selection-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.country-selection-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.country-selection-card:active {
  transform: translateY(0);
}

.embargo-card {
  border-left: 4px solid #f44336;
  background-color: rgba(244, 67, 54, 0.05);
}
</style>
