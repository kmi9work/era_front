<script setup>
import axios from 'axios'
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useCaravanStore } from '@/stores/caravan'

const caravanStore = useCaravanStore()

//Основной функционал
const isLoading = ref(true)
const isFirstRunRel = ref(true)
const isFirstRunEmbargo = ref(true)
const pollInterval = ref(null)

// Продажа и вывод
const countries = ref([])
const first_country = ref(null)
const prices = ref([])
const selectedCountry = ref(null)
const resources = ref([])
const resourcesPlSells = ref([])
const resourcesPlBuys = ref([])
const resToPlayer = ref([])
const resToBack = ref([])

// UI состояния для мобильной версии
const activeTab = ref('sell') // 'sell' или 'buy'
const showCountrySheet = ref(false)
const showResultSheet = ref(false)

// Отношения (для цен) и эмбарго
const countriesRelations = ref([])
const showRelationsDialog = ref(false)
const newRelations = ref(false)
const showEmbargoStatusDialog = ref(false)
const showEmbargoDialog = ref(false)
const embargoStatusMessage = ref('')
const isEmbargoActive = ref(false)

const fetchCountries = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/foreign_countries.json`)
    countries.value = response.data
    
    caravanStore.setCountries(response.data)
    
    countriesRelations.value = countries.value.map(item => {
      return {
        name: item.name,
        relations: item.relations,
        embargo: item.params["embargo"]
      }
    })

  } catch (error) {
    console.error('Error fetching countries:', error)
    countries.value = []
    countriesRelations.value = []
  }
}

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

const fetchResources = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/resources/show_prices.json`)
    resources.value = response.data.prices
    
    caravanStore.setResources({
      off_market: response.data.prices.off_market || [],
      to_market: response.data.prices.to_market || []
    })
    
    newRelations.value = false

  } catch (error) {
    console.error('Error fetching resources:', error)
  }
}

const filteredResOffMark = computed(() => {
  if (!resources.value["off_market"] || !selectedCountry.value) return []

  let filtered = resources.value["off_market"].filter((res) => res.country.id == selectedCountry.value)

  resourcesPlBuys.value = filtered.map(
    (item) => ({
      "identificator": item.identificator,
      "count": null
    })
  )

  return filtered
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

const filteredResToMark = computed(() => {
  if (!resources.value["to_market"]) return []

  let filtered = selectedCountry.value 
    ? resources.value["to_market"].filter(res => res.country.id == selectedCountry.value)
    : resources.value["to_market"]

  resourcesPlSells.value = filtered.map(item => ({
    identificator: item.identificator,
    count: null
  }))

  const goldItem = {
    identificator: "gold",
    count: null
  }

  resourcesPlSells.value.push({...goldItem})

  return [...filtered, {...goldItem}]
})

async function sendCaravanRequest(isContraband = false) {
  try {
    showEmbargoDialog.value = false
    
    const result = caravanStore.sendCaravan(
      selectedCountry.value,
      resourcesPlSells.value,
      resourcesPlBuys.value
    )
    
    prices.value = result
    resToPlayer.value = result.res_to_player
    showResultSheet.value = true

    return { data: result }
  } catch (e) {
    console.error('Ошибка расчета:', e)
    throw e
  }
}

async function submit() {
  if (embargo.value) {
    showEmbargoDialog.value = true
    return
  }
  
  await sendCaravanRequest()
}

// ЭМБАРГО
const embargo = computed(() => {
  if (selectedCountry.value == null) return false
  const country = countries.value.find(c => c.id === selectedCountry.value)
  return Number(country?.params?.embargo) > 0
})

const hasEmbargo = (country) => {
  return (country?.params?.embargo > 0) 
}

const getButtonColor = (country) => {
  if (selectedCountry.value === country.id && !hasEmbargo(country)) return 'success'
  if (selectedCountry.value === country.id && hasEmbargo(country)) return 'secondary'  
  if (hasEmbargo(country)) return 'error'
  return undefined
}

const nameChecker = (item) => {
  if (item) {
    return `По ${item}` 
  } else {
    return "Золото"
  }
}

const selectedCountryName = computed(() => {
  if (!selectedCountry.value) return ''
  const country = countries.value.find(c => c.id === selectedCountry.value)
  return country ? getShortName(country.name) : ''
})

// Загружаем данные при монтировании
onMounted(async () => {
  try {
    await fetchCountries()
    await fetchResources()  

    if (countries.value.length > 0) {
      first_country.value = countries.value[0].id
      selectedCountry.value = first_country.value
    }
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }

  pollInterval.value = setInterval(fetchCountries, 30000)
})

onBeforeUnmount(() => {
  clearInterval(pollInterval.value)
})

watch(selectedCountry, (newVal) => {
  if (newVal) {
    filteredResOffMark.value
    filteredResToMark.value
  }
})

async function confirmContraband() {
  showEmbargoDialog.value = false
  try {
    await sendCaravanRequest(true)
  } catch (error) {
    console.error("Ошибка при отправке контрабанды:", error)
  }
}

function resetForm() {
  resourcesPlBuys.value = filteredResOffMark.value.map(item => ({
    "identificator": item.identificator,
    "count": null
  }))

  resourcesPlSells.value = filteredResToMark.value.map(item => ({
    "identificator": item.identificator,
    "count": null
  }))

  resToPlayer.value = []
  prices.value = []
  showResultSheet.value = false
}

function selectCountry(countryId) {
  selectedCountry.value = countryId
  showCountrySheet.value = false
}
</script>

<template>
  <div v-if="!isLoading" class="mobile-container">
    <!-- Простой хедер с названием -->
    <VCard class="mobile-header mb-2">
      <VCardText class="pa-3 text-center">
        <div class="d-flex align-center justify-center">
          <VIcon icon="ri-exchange-line" size="28" class="mr-2" color="primary" />
          <span class="text-h5 font-weight-bold">Рынок</span>
        </div>
      </VCardText>
    </VCard>

    <!-- Хедер с выбором страны -->
    <VCard class="country-selector-card mb-2">
      <VCardText class="pa-2">
        <VBtn 
          @click="showCountrySheet = true"
          block
          color="primary"
          size="large"
          :class="{ 'embargo-border': embargo }"
        >
          <v-img
            v-if="selectedCountry"
            :src="`/images/countries/${countries.find(c => c.id === selectedCountry)?.name}.png`"
            width="40"
            height="30"
            class="mr-2"
          />
          <span class="text-h6">{{ selectedCountryName || 'Выберите страну' }}</span>
          <span v-if="embargo" class="embargo-badge-mobile ml-2">Эмбарго</span>
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Вкладки продажи/покупки -->
    <VCard class="tabs-card mb-2">
      <VTabs v-model="activeTab" bg-color="primary" grow>
        <VTab value="sell">Отправить</VTab>
        <VTab value="buy">Заказать</VTab>
      </VTabs>
    </VCard>

    <!-- Контент вкладок -->
    <VWindow v-model="activeTab" class="mb-2">
      <!-- Вкладка продажи -->
      <VWindowItem value="sell">
        <VCard>
          <VCardTitle class="text-center py-2">Игрок отправляет</VCardTitle>
          <VCardText class="pa-2">
            <div class="mobile-resources-grid">
              <div
                v-for="(item, index) in filteredResToMark"
                :key="index"
                class="mobile-resource-item"
              >
                <div class="resource-row">
                  <v-img
                    :src="`/images/resources/${item.identificator}.png`"
                    width="48"
                    height="48"
                    class="resource-icon-mobile"
                  />
                  <div class="resource-info">
                    <div class="resource-name">{{ item.identificator }}</div>
                    <div class="resource-price">{{ nameChecker(item.sell_price) }}</div>
                  </div>
                  <v-text-field
                    v-model.number="resourcesPlSells[index].count"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="resource-input-mobile"
                    inputmode="numeric"
                  />
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Вкладка покупки -->
      <VWindowItem value="buy">
        <VCard>
          <VCardTitle class="text-center py-2">Игрок заказал</VCardTitle>
          <VCardText class="pa-2">
            <div class="mobile-resources-grid">
              <div
                v-for="(item, index) in filteredResOffMark"
                :key="index"
                class="mobile-resource-item"
              >
                <div class="resource-row">
                  <v-img
                    :src="`/images/resources/${item.identificator}.png`"
                    width="48"
                    height="48"
                    class="resource-icon-mobile"
                  />
                  <div class="resource-info">
                    <div class="resource-name">{{ item.identificator }}</div>
                    <div class="resource-price">{{ nameChecker(item.buy_price) }}</div>
                  </div>
                  <v-text-field
                    v-model.number="resourcesPlBuys[index].count"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="resource-input-mobile"
                    inputmode="numeric"
                  />
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VWindowItem>
    </VWindow>

    <!-- Кнопки действий -->
    <VCard class="actions-card">
      <VCardText class="pa-2">
        <VRow dense>
          <VCol cols="6">
            <VBtn 
              @click="submit" 
              block
              color="primary"
              size="large"
            >
              Обработать
            </VBtn>
          </VCol>
          <VCol cols="6">
            <VBtn
              @click="resetForm"
              color="error"
              block
              size="large"
            >
              Очистить
            </VBtn>
          </VCol>
          <VCol cols="12">
            <VBtn 
              @click="fetchResources" 
              block
              color="primary"
              size="large"
              :disabled="!newRelations"
            >
              Обновить цены
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Bottom Sheet для выбора страны -->
    <VBottomSheet v-model="showCountrySheet">
      <VCard>
        <VCardTitle class="text-center">Выберите страну</VCardTitle>
        <VCardText>
          <div class="country-grid-mobile">
            <VBtn
              v-for="country in countries"
              :key="country.id"
              @click="selectCountry(country.id)"
              :color="getButtonColor(country)"
              :class="{ 'embargo-border': hasEmbargo(country) }"
              size="large"
              class="country-btn-mobile"
            >
              <div class="country-btn-content">
                <v-img
                  :src="`/images/countries/${country.name}.png`"
                  width="48"
                  height="36"
                  class="mb-1"
                />
                <span class="country-name-mobile">{{ getShortName(country.name) }}</span>
                <span v-if="hasEmbargo(country)" class="embargo-label-mobile">Эмбарго</span>
              </div>
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VBottomSheet>

    <!-- Bottom Sheet для результатов -->
    <VBottomSheet v-model="showResultSheet">
      <VCard>
        <VCardTitle class="text-center">Выдать игроку</VCardTitle>
        <VCardText>
          <div class="results-mobile">
            <div v-for="(item, index) in resToPlayer" :key="index" class="result-item-mobile">
              <v-img
                v-if="item.identificator !== 'gold'"
                :src="`/images/resources/${item.identificator}.png`"
                width="40"
                height="40"
                class="mr-3"
              />
              <v-img
                v-else
                src="/images/resources/gold.png"
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
  </div>

  <div v-else class="loading-container-mobile">
    <VProgressCircular indeterminate color="primary" size="64" />
    <div class="mt-4">Загрузка...</div>
  </div>

  <!-- Диалоги (те же, что и в десктопной версии) -->
  <v-dialog v-model="showEmbargoStatusDialog" max-width="500">
    <v-card :color="isEmbargoActive ? 'error' : 'success'">
      <v-card-title>
        {{ isEmbargoActive ? 'Эмбарго введено!' : 'Эмбарго снято!' }}
      </v-card-title>
      <v-card-text>
        {{ embargoStatusMessage }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="showEmbargoStatusDialog = false">Закрыть</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showRelationsDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5">Изменение отношений!</v-card-title>
      <v-card-text>
        Отношения между странами изменились. Закройте рынок, обработайте все пришедшие караваны, обновите ценники,
        затем обновите цены в программе (кнопка "Обновить цены")
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" text @click="showRelationsDialog = false">
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showEmbargoDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5">Эта страна ввела эмбарго против Руси!</v-card-title>
      <v-card-text>
        Для совершения операций с этой страной нужна Контрабанда!
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" text @click="confirmContraband">
          Есть карточка контрабанды!
        </v-btn>
        <v-btn color="grey-darken-1" text @click="showEmbargoDialog = false">
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.mobile-container {
  padding: 8px;
  max-width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  background: rgb(var(--v-theme-background));
}

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 11;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.country-selector-card {
  position: sticky;
  top: 68px;
  z-index: 10;
}

.tabs-card {
  position: sticky;
  top: 132px;
  z-index: 9;
}

.mobile-resources-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-resource-item {
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
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

.resource-price {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.resource-input-mobile {
  width: 80px;
  flex-shrink: 0;
}

.actions-card {
  position: sticky;
  bottom: 0;
  z-index: 10;
  margin-bottom: 0;
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

.embargo-badge-mobile {
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
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
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

.loading-container-mobile {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
}

/* Убираем стрелки у number input на мобильных */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>

