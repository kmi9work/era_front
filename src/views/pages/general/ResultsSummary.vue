<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useCurrentCountry } from '@/composables/useCurrentCountry'

/**
 * Сводка результатов государств (ТЗ № 2, § 9 п. 3): мастер в разделе «Статистика»
 * смотрит итоги любого государства за любой год — только чтение.
 *
 * Государство и год передаются в запросах явно (`country_id`, `year`), мутаций нет:
 * подэкран и настройки показа экрана при этом не меняются. Текущий год — живой
 * расчёт (`source: 'live'`), прошедшие — снимок года (`source: 'snapshot'`).
 */
const api = () => import.meta.env.VITE_PROXY

const { currentCountryId, currentCountry, countries, loadCurrentCountry, loadCountries } = useCurrentCountry()

const selectedCountryId = ref(null)
const selectedYear = ref(null) // null — текущий год (живой расчёт)
const currentYear = ref(null)
const resultsYear = ref(null)
const source = ref('live')
const nobles = ref([])
const merchants = ref([])
const isLoading = ref(false)
const errorMessage = ref(null)

// защита от гонки запросов при быстром переключении государства/года
let lastReqId = 0

const countryItems = computed(() => countries.value.map(country => ({
  id: country.id,
  name: country.id === currentCountryId.value ? `${country.name} (текущее)` : country.name,
})))

/** Годы: текущий — живой расчёт, прошедшие — снимок года («Итоги года N»). */
const yearOptions = computed(() => {
  const last = currentYear.value
  if (!last || last < 1) return []

  const options = []
  for (let year = last; year >= 1; year--) {
    options.push({ value: year, label: `Итоги года ${year}`, isCurrent: year === last })
  }

  return options
})

const yearValue = computed(() => selectedYear.value || currentYear.value || null)

const yearItems = computed(() => yearOptions.value.map(option => ({
  value: option.value,
  title: option.isCurrent ? `${option.label} (текущий год)` : option.label,
})))

const selectedCountry = computed(() => countries.value.find(country => country.id === Number(selectedCountryId.value)) || null)

const isSnapshot = computed(() => source.value === 'snapshot')

const snapshotMissing = computed(() => !!selectedYear.value && resultsYear.value !== null && selectedYear.value !== resultsYear.value)

/** Признак источника результата: живой расчёт текущего года или снимок года. */
const sourceLabel = computed(() => {
  if (snapshotMissing.value) {
    return `Снимка за ${selectedYear.value} год нет — показан живой расчёт за ${resultsYear.value} год`
  }
  if (isSnapshot.value) {
    return resultsYear.value ? `Снимок, итоги года ${resultsYear.value}` : 'Снимок'
  }

  return resultsYear.value ? `Живой расчёт, год ${resultsYear.value}` : 'Живой расчёт'
})

/** Адрес запроса в разрезе выбранного государства. */
const countryQuery = path => {
  const id = selectedCountryId.value
  if (!id) return `${api()}${path}`

  return `${api()}${path}${path.includes('?') ? '&' : '?'}country_id=${id}`
}

/** Год передаём только для прошедших лет: текущий год считается живым расчётом. */
const resultsUrl = path => {
  const url = countryQuery(path)
  const year = selectedYear.value
  if (!year || year === currentYear.value) return url

  return `${url}${url.includes('?') ? '&' : '?'}year=${year}`
}

const formatNumber = val => {
  if (val === null || val === undefined || val === '') return '—'
  try {
    return new Intl.NumberFormat('ru-RU').format(Number(val))
  } catch {
    return String(val)
  }
}

/** Только чтение: GET-запросы результатов выбранного государства и года. */
const loadResults = async () => {
  const reqId = ++lastReqId
  isLoading.value = true
  errorMessage.value = null
  try {
    const [nobleResponse, merchantResponse] = await Promise.all([
      axios.get(resultsUrl('/game_parameters/show_noble_results')),
      axios.get(resultsUrl('/game_parameters/show_sorted_results')),
    ])
    if (reqId !== lastReqId) return

    const nobleData = nobleResponse.data || {}
    const merchantData = merchantResponse.data || {}

    nobles.value = nobleData.results || nobleData.nobles || []
    merchants.value = merchantData.results || merchantData.merchants || []

    const meta = merchantData.year !== undefined ? merchantData : nobleData
    if (meta.year !== undefined && meta.year !== null) resultsYear.value = Number(meta.year)
    source.value = meta.source === 'snapshot' ? 'snapshot' : 'live'
    if (source.value === 'live' && resultsYear.value) currentYear.value = resultsYear.value
  } catch (error) {
    if (reqId !== lastReqId) return
    errorMessage.value = error?.response?.data?.error || error?.message || 'Ошибка загрузки результатов'
    nobles.value = []
    merchants.value = []
  } finally {
    if (reqId === lastReqId) isLoading.value = false
  }
}

const handleCountryChange = (id) => {
  selectedCountryId.value = id
}

const handleYearChange = (year) => {
  const next = year === null || year === undefined || year === '' ? null : Number(year)
  selectedYear.value = next && next !== currentYear.value ? next : null
}

watch(selectedCountryId, async () => {
  // У другого государства свои результаты: год начинаем с текущего (живой расчёт)
  selectedYear.value = null
  resultsYear.value = null
  await loadResults()
})

watch(selectedYear, async () => {
  await loadResults()
})

onMounted(async () => {
  await loadCurrentCountry()
  await loadCountries()
  selectedCountryId.value = currentCountryId.value ?? null
  await loadResults()
})
</script>

<template>
  <VCard class="results-summary">
    <VCardItem>
      <VCardTitle class="text-h6">
        Результаты государств
      </VCardTitle>
      <VCardSubtitle>
        Только чтение; на игровых экранах показывается текущее государство ({{ currentCountry?.name || '—' }})
      </VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VRow class="summary-controls">
        <VCol cols="12" sm="6" md="4">
          <VSelect
            :model-value="selectedCountryId"
            :items="countryItems"
            item-title="name"
            item-value="id"
            label="Государство"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="handleCountryChange"
          />
        </VCol>
        <VCol cols="12" sm="6" md="4">
          <VSelect
            :model-value="yearValue"
            :items="yearItems"
            item-title="title"
            item-value="value"
            label="Период"
            density="compact"
            variant="outlined"
            hide-details
            :disabled="!yearItems.length"
            @update:model-value="handleYearChange"
          />
        </VCol>
        <VCol cols="12" md="4" class="d-flex align-center flex-wrap ga-2">
          <VChip
            :color="isSnapshot ? 'primary' : 'success'"
            size="small"
            variant="tonal"
          >
            {{ sourceLabel }}
          </VChip>
          <VBtn
            icon="ri-refresh-line"
            size="small"
            variant="text"
            :disabled="isLoading"
            @click="loadResults"
          />
        </VCol>
      </VRow>

      <VAlert
        v-if="errorMessage"
        type="error"
        density="compact"
        variant="tonal"
        class="mt-3"
      >
        {{ errorMessage }}
      </VAlert>

      <VProgressLinear
        v-if="isLoading"
        indeterminate
        color="primary"
        height="2"
        class="mt-2"
      />

      <div class="summary-country mt-3">
        Государство: <strong>{{ selectedCountry?.name || '—' }}</strong>
      </div>

      <VRow class="mt-1">
        <VCol cols="12" lg="6">
          <h4 class="summary-table-title">
            Знать (влияние)
          </h4>
          <div v-if="!nobles.length" class="summary-empty">
            Нет данных о знати
          </div>
          <div v-else class="summary-table-wrap">
            <table class="summary-table">
              <thead>
                <tr>
                  <th class="summary-place">Место</th>
                  <th>Знать</th>
                  <th class="summary-value">Влияние</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(noble, index) in nobles" :key="`${noble.noble_name}-${index}`">
                  <td class="summary-place">{{ noble.place }}</td>
                  <td>{{ noble.noble_name }}</td>
                  <td class="summary-value">{{ formatNumber(noble.noble_influence || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </VCol>

        <VCol cols="12" lg="6">
          <h4 class="summary-table-title">
            Купцы (капитал)
          </h4>
          <div v-if="!merchants.length" class="summary-empty">
            Нет данных о гильдиях
          </div>
          <div v-else class="summary-table-wrap">
            <table class="summary-table">
              <thead>
                <tr>
                  <th class="summary-place">Место</th>
                  <th>Команда</th>
                  <th class="summary-value">Капитал</th>
                  <th class="summary-value">На игрока</th>
                  <th class="summary-value">Игроков</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(guild, index) in merchants" :key="`${guild.guild_id || guild.player}-${index}`">
                  <td class="summary-place">{{ guild.place }}</td>
                  <td>{{ guild.player }}</td>
                  <td class="summary-value">{{ formatNumber(guild.capital) }}</td>
                  <td class="summary-value">{{ formatNumber(guild.cap_per_pl || 0) }}</td>
                  <td class="summary-value">{{ guild.number_of_players }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.results-summary {
  margin-bottom: 24px;
}

.summary-country {
  color: #2c3e50;
  font-size: 14px;
}

.summary-table-title {
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 15px;
}

.summary-empty {
  padding: 12px;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 6px;
  text-align: center;
}

.summary-table-wrap {
  max-height: 420px;
  overflow: auto;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.summary-table th,
.summary-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.summary-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f8f9fa;
  color: #2c3e50;
}

.summary-place {
  width: 64px;
  text-align: center;
}

.summary-value {
  text-align: right;
  white-space: nowrap;
}
</style>
