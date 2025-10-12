<script setup>
import axios from 'axios'
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import ShowPricesMobile from './ShowPricesMobile.vue'

// Основной функционал
const isLoading = ref(true)
const isFirstRunRel = ref(true)
const isFirstRunEmbargo = ref(true)
const pollInterval = ref(null)
const showMainMenu = ref(true) // Главный экран меню
const showPrices = ref(false) // Экран цен
const cameFromPrices = ref(false) // Флаг: пришел ли пользователь с экрана цен

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
    return `По ${item} золота`
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
  // Если пришли с экрана цен, возвращаемся туда
  if (cameFromPrices.value) {
    selectedCountry.value = null
    resetForm()
    cameFromPrices.value = false
    showPrices.value = true
  } else {
    // Иначе просто сбрасываем страну (вернемся на экран выбора страны)
    selectedCountry.value = null
    resetForm()
  }
}

const goToCaravan = () => {
  showMainMenu.value = false
  cameFromPrices.value = false
}

const goToPrices = () => {
  showMainMenu.value = false
  showPrices.value = true
  cameFromPrices.value = false
}

const backFromPrices = () => {
  showPrices.value = false
  showMainMenu.value = true
  cameFromPrices.value = false
}

const openMarketFromPrices = (countryId) => {
  showPrices.value = false
  cameFromPrices.value = true // Устанавливаем флаг
  selectCountry(countryId)
}

const backToMainMenu = () => {
  showMainMenu.value = true
  selectedCountry.value = null
  showPrices.value = false
  cameFromPrices.value = false
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
  // Для золота всегда показываем "Золото"
  const displayName = item.identificator === 'gold' ? 'Золото' : (item.name || item.identificator)
  
  keyboardResource.value = {
    identificator: item.identificator,
    name: displayName,
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
  
  // Если мы на экране цен, возвращаемся в главное меню
  if (showPrices.value) {
    event.preventDefault()
    backFromPrices()
    return
  }
  
  // Если мы на экране 2 (выбрана страна), возвращаемся на экран 1
  if (selectedCountry.value) {
    event.preventDefault()
    backToCountrySelection()
    return
  }
  
  // Если мы на экране 1 (выбор страны), возвращаемся в главное меню
  if (!showMainMenu.value) {
    event.preventDefault()
    backToMainMenu()
    return
  }
  
  // Если мы в главном меню, позволяем закрыть приложение
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
            block
            style="color: white !important; font-size: 20px !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: normal !important;"
          >
            Назад
          </VBtn>
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
                      {{ keyboardResource.type === 'sell' ? 'Вы отправляете с караваном' : 'Вы заказываете' }}
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

    <!-- ЭКРАН ЦЕНЫ: Просмотр цен -->
    <ShowPricesMobile 
      v-if="!isLoading && showPrices" 
      @back="backFromPrices"
      @open-market="openMarketFromPrices"
    />

    <!-- ЭКРАН 0: Главное меню -->
    <VContainer fluid class="pa-0" v-if="!isLoading && showMainMenu && !showPrices">
      <!-- Хедер -->
      <VToolbar color="#1976d2">
        <VToolbarTitle class="text-center" style="color: white; font-size: 22px; font-weight: 600; width: 100%;">
          Караваны
        </VToolbarTitle>
      </VToolbar>

      <!-- Кнопки меню -->
      <div class="main-menu-container">
        <VCard 
          class="menu-card mb-4"
          elevation="4"
          @click="goToCaravan"
        >
          <VCardText class="pa-6 text-center">
            <VIcon icon="ri-exchange-line" size="64" color="primary" class="mb-3" />
            <div class="text-h5 font-weight-bold">
              Рассчитать караван
            </div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              Выбрать страну и отправить ресурсы
            </div>
          </VCardText>
        </VCard>

        <VCard 
          class="menu-card"
          elevation="4"
          @click="goToPrices"
        >
          <VCardText class="pa-6 text-center">
            <VIcon icon="mdi-currency-usd" size="64" color="success" class="mb-3" />
            <div class="text-h5 font-weight-bold">
              Посмотреть цены
            </div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              Актуальные цены на ресурсы
            </div>
          </VCardText>
        </VCard>
      </div>
    </VContainer>

    <!-- ЭКРАН 1: Выбор страны -->
    <VContainer fluid class="pa-0" v-if="!isLoading && !showMainMenu && !selectedCountry && !showPrices">
      <!-- Хедер -->
      <VToolbar color="#1976d2">
        <VBtn 
          @click="backToMainMenu" 
          variant="text"
          block
          style="color: white !important; font-size: 20px !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: normal !important;"
        >
          Назад
        </VBtn>
      </VToolbar>

      <!-- Подзаголовок -->
      <VCard class="ma-3 mb-3">
        <VCardText class="pa-3 text-center">
          <div class="d-flex align-center justify-center">
            <VIcon icon="ri-exchange-line" size="32" class="mr-2" color="primary" />
            <span class="text-h5 font-weight-bold">Куда отправляется караван?</span>
          </div>
        </VCardText>
      </VCard>

      <!-- Сетка стран -->
      <div class="country-selection-grid" style="padding: 16px;">
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
      <VContainer fluid class="pa-0" v-if="!isLoading && selectedCountry && !showPrices">
        <!-- Хедер с кнопкой "Назад" -->
        <VToolbar color="#1976d2">
          <VBtn 
            @click="backToCountrySelection" 
            variant="text"
            block
            style="color: white !important; font-size: 20px !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: normal !important;"
          >
            Назад
          </VBtn>
        </VToolbar>

      <!-- Секция "Вы отправляете с караваном" -->
      <VCard class="mb-3 section-card" style="margin: 15px; position: relative;">
        <!-- Герб страны в правом верхнем углу -->
        <VImg
          v-if="selectedCountry"
          :src="`/images/countries/${countries.find(c => c.id === selectedCountry)?.name}.png`"
          width="64"
          height="48"
          style="position: absolute; top: 8px; right: 8px; opacity: 0.3; z-index: 1;"
        />
        <VCardTitle class="section-title-mobile">
          Вы отправляете с караваном
        </VCardTitle>
        <VCardText class="pa-3">
          <div class="resources-grid">
              <div
                v-for="(item, index) in filteredResToMark"
              :key="'sell-' + index"
              class="resource-card-compact"
              :class="resourcesPlSells[index].count > 0 ? 'card-active' : ''"
              @click="openKeyboard(item, index, 'sell')"
            >
              <VImg
                    :src="`/images/resources/${item.identificator}.png`"
                width="56"
                height="56"
                class="resource-icon-compact"
              />
              <div class="resource-count-compact">
                {{ resourcesPlSells[index].count || '0' }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>

      <!-- Секция "Вы покупаете" -->
      <VCard class="mb-3 section-card" style="margin: 15px; position: relative;">
        <!-- Герб страны в правом верхнем углу -->
        <VImg
          v-if="selectedCountry"
          :src="`/images/countries/${countries.find(c => c.id === selectedCountry)?.name}.png`"
          width="64"
          height="48"
          style="position: absolute; top: 8px; right: 8px; opacity: 0.3; z-index: 1;"
        />
        <VCardTitle class="section-title-mobile">
          Вы покупаете
        </VCardTitle>
        <VCardText class="pa-3">
          <div class="resources-grid">
              <div
                v-for="(item, index) in filteredResOffMark"
              :key="'buy-' + index"
              class="resource-card-compact"
              :class="resourcesPlBuys[index].count > 0 ? 'card-active' : ''"
              @click="openKeyboard(item, index, 'buy')"
            >
              <VImg
                    :src="`/images/resources/${item.identificator}.png`"
                width="56"
                height="56"
                class="resource-icon-compact"
              />
              <div class="resource-count-compact">
                {{ resourcesPlBuys[index].count || '0' }}
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
          <VCardTitle class="text-center">Результат торговли</VCardTitle>
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
    <VContainer v-if="isLoading" class="d-flex flex-column align-center justify-center" style="min-height: 100vh;">
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

.header-left {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
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

/* Grid для компактных карточек ресурсов */
.resources-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.resource-card-compact {
  background: white;
  border-radius: 10px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 110px;
}

.resource-card-compact:active {
  background: #f5f5f5;
  transform: scale(0.95);
}

.resource-card-compact.card-active {
  border-color: #4caf50;
  background-color: #f1f8f4;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
}

.resource-icon-compact {
  margin-bottom: 8px;
}

.resource-count-compact {
  font-size: 18px;
  font-weight: bold;
  color: #666;
  text-align: center;
}

.resource-card-compact.card-active .resource-count-compact {
  color: #4caf50;
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

.resource-count-badge {
  min-width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #666;
  background-color: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
}

.resource-count-badge.badge-active {
  color: #4caf50;
  border-color: #4caf50;
  background-color: #f1f8f4;
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

/* Стили для главного меню */
.main-menu-container {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.menu-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 16px !important;
  background: white;
  overflow: hidden;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2) !important;
}

.menu-card:active {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
}
</style>
