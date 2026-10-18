<script setup>
import axios from 'axios'
import { ref, computed, onBeforeMount, watch } from 'vue'
import PairRelationsCell from '@/components/PairRelationsCell.vue'
import { useCurrentCountry } from '@/composables/useCurrentCountry'

/**
 * Дашборд (ТЗ № 2, § 2): чекбоксы государств + матрица отношений.
 *
 * Строки — зарубежные государства (все, кроме отмеченных), столбцы — отмеченные
 * государства, «за которые идёт игра»: в заголовке столбца его флаг и название,
 * в ячейке — отношения пары «государство столбца ↔ государство строки» с теми же
 * действиями, что и раньше (правки, эмбарго, союзы, улучшение через торговлю).
 * Пары, где оба государства отмечены, в ответ не попадают, поэтому на пересечении
 * двух отмеченных государств ячейки нет — они и не строки, и не дублируются.
 * Выбор — настройка вида (localStorage), не игровое состояние.
 */
const STORAGE_KEY = 'dashboard_countries'

const {
  currentCountry,
  currentCountryId,
  countries,
  reloadToken,
  loadCountries,
  loadCurrentCountry,
} = useCurrentCountry()

// Отмеченные государства (id)
const selectedIds = ref([])
const rows = ref([])
const isLoading = ref(false)
const loadError = ref(null)
const activeEffects = ref([])

const allCountryIds = computed(() => countries.value.map(country => country.id))

const selectedCountries = computed(() =>
  countries.value.filter(country => selectedIds.value.includes(country.id)))

function saveSelection() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds.value))
  } catch (e) {
    console.warn('Не удалось сохранить выбор государств Дашборда:', e)
  }
}

function restoreSelection() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (Array.isArray(stored)) return stored.map(Number)
  } catch (e) {
    console.warn('Не удалось прочитать выбор государств Дашборда:', e)
  }
  return null
}

async function loadActiveEffects() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_active_lingering_effects.json`)
    activeEffects.value = response.data.effects || []
  } catch (error) {
    console.error('Ошибка при загрузке активных эффектов:', error)
    activeEffects.value = []
  }
}

async function loadRows() {
  if (selectedIds.value.length === 0) {
    rows.value = []
    return
  }

  isLoading.value = true
  loadError.value = null
  try {
    const ids = selectedIds.value.join(',')
    const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/countries/relations_matrix.json?country_ids=${ids}`)
    rows.value = Array.isArray(data?.rows) ? data.rows : []
  } catch (error) {
    console.error('Ошибка при загрузке матрицы отношений:', error)
    loadError.value = error?.message || 'Не удалось загрузить отношения'
    rows.value = []
  } finally {
    isLoading.value = false
  }
}

function resetToAll() {
  selectedIds.value = [...allCountryIds.value]
}

function resetToCurrent() {
  selectedIds.value = currentCountryId.value ? [currentCountryId.value] : []
}

const flagSrc = (country) => {
  if (!country?.flag_image_name) return null
  return `/images/countries/${country.flag_image_name}.png`
}

/**
 * Матрица «зарубежное государство × государство, за которое идёт игра».
 *
 * Ответ `relations_matrix` — плоский список пар { partner: A, country: B } по всем
 * отмеченным A и всем остальным B. Группируем по B: строка — одно зарубежное
 * государство, в ячейках — строки пар со своим (pair-scoped) объектом B: в нём
 * relations, relation_items, relation_points, embargo и alliances относятся именно
 * к паре A↔B, поэтому один объект нельзя переиспользовать в соседней ячейке.
 */
const matrixRows = computed(() => {
  const byForeign = new Map()

  for (const row of rows.value) {
    const foreign = row?.country
    const partner = row?.partner
    if (!foreign?.id || !partner?.id) continue

    if (!byForeign.has(foreign.id)) {
      byForeign.set(foreign.id, { country: foreign, cells: {} })
    }
    byForeign.get(foreign.id).cells[partner.id] = row
  }

  return [...byForeign.values()]
    .sort((a, b) => String(a.country.name).localeCompare(String(b.country.name), 'ru'))
})

onBeforeMount(async () => {
  await loadCountries()
  await loadCurrentCountry()

  const stored = restoreSelection()
  const valid = (stored || []).filter(id => allCountryIds.value.includes(id))
  selectedIds.value = valid.length ? valid : (currentCountryId.value ? [currentCountryId.value] : [])

  await Promise.all([loadActiveEffects(), loadRows()])
})

// Изменение выбора — сразу перечитываем таблицу и сохраняем настройку вида
watch(selectedIds, async () => {
  saveSelection()
  await loadRows()
}, { deep: true })

// Смена текущего государства перечитывает данные, не сбрасывая выбор
watch(reloadToken, async () => {
  await Promise.all([loadActiveEffects(), loadRows()])
})
</script>

<template>
  <div>
    <VCard class="mb-5">
      <VCardItem>
        <VCardTitle class="d-flex align-center flex-wrap gap-2">
          <span>Дашборд: отношения государств</span>
          <VChip
            v-if="currentCountry"
            color="primary"
            size="small"
            variant="tonal"
          >
            текущее государство: {{ currentCountry.name }}
          </VChip>
        </VCardTitle>
        <VCardSubtitle>
          Отметьте государства, за которые идёт игра: в таблице они станут столбцами,
          а строки — зарубежные государства. В ячейке — отношения пары.
        </VCardSubtitle>
      </VCardItem>

      <VCardText>
        <div class="d-flex align-center flex-wrap gap-2 mb-3">
          <VBtn
            size="small"
            variant="tonal"
            @click="resetToAll"
          >
            Сбросить (все страны)
          </VBtn>
          <VBtn
            size="small"
            variant="tonal"
            @click="resetToCurrent"
          >
            Только текущее государство
          </VBtn>
          <VSpacer />
          <span class="text-body-2 text-medium-emphasis">
            отмечено: {{ selectedIds.length }} из {{ allCountryIds.length }}
          </span>
        </div>

        <VRow dense>
          <VCol
            v-for="country in countries"
            :key="country.id"
            cols="auto"
          >
            <VCheckbox
              v-model="selectedIds"
              :value="country.id"
              :label="country.name"
              density="compact"
              hide-details
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VAlert
      v-if="loadError"
      type="error"
      variant="tonal"
      class="mb-4"
      density="compact"
    >
      {{ loadError }}
    </VAlert>

    <VCard>
      <VCardText>
        <div v-if="selectedIds.length === 0" class="text-center py-8 text-medium-emphasis">
          <VIcon icon="ri-question-line" size="32" class="mb-2" />
          <div>Выберите хотя бы одно государство</div>
        </div>

        <div v-else-if="!rows.length && !isLoading" class="text-center py-8 text-medium-emphasis">
          Нет других государств для отображения отношений
        </div>

        <div v-else class="table-scroll">
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-left">
                  Зарубежное государство
                </th>
                <th
                  v-for="column in selectedCountries"
                  :key="column.id"
                  class="text-left"
                >
                  <div class="d-flex align-center">
                    <img
                      v-if="flagSrc(column)"
                      :src="flagSrc(column)"
                      :alt="column.name"
                      class="country-flag me-2"
                    >
                    <span>{{ column.name }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="matrixRow in matrixRows"
                :key="matrixRow.country.id"
              >
                <td>
                  <div class="d-flex align-center">
                    <img
                      v-if="flagSrc(matrixRow.country)"
                      :src="flagSrc(matrixRow.country)"
                      :alt="matrixRow.country.name"
                      class="country-flag me-2"
                    >
                    <span>{{ matrixRow.country.name }}</span>
                  </div>
                </td>
                <td
                  v-for="column in selectedCountries"
                  :key="column.id"
                >
                  <PairRelationsCell
                    v-if="matrixRow.cells[column.id]"
                    :country="matrixRow.cells[column.id].country"
                    :partner-country="matrixRow.cells[column.id].partner"
                    :effects="activeEffects"
                    @reload="loadRows"
                  />
                  <span v-else class="text-medium-emphasis">—</span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
/* Матрица шире экрана при нескольких государствах — прокрутка вместо сжатия ячеек */
.table-scroll {
  overflow-x: auto;
}

/*
 * Ячейка матрицы не переносится и не сжимается: при нескольких государствах
 * колонки держат ширину, а прокручивается вся таблица (иначе кнопки пары
 * разваливались бы на строки и часть действий уезжала за край).
 */
.table-scroll :deep(.pair-relations-cell) {
  /* Vuetify-утилита .flex-wrap на корне ячейки даёт wrap !important */
  flex-wrap: nowrap !important;
  min-inline-size: max-content;
}

/* Таблица шире карточки: ширина по содержимому, прокрутка — у .table-scroll */
.table-scroll :deep(table) {
  inline-size: max-content;
  min-inline-size: 100%;
}

/* Названия зарубежных государств остаются на виду при прокрутке вправо */
.table-scroll :deep(thead th:first-child),
.table-scroll :deep(tbody td:first-child) {
  position: sticky;
  inset-inline-start: 0;
  z-index: 2;
  background: rgb(var(--v-theme-surface));
}

.table-scroll :deep(thead th:first-child) {
  z-index: 3;
  /* фон заголовка Vuetify-таблицы по умолчанию */
  background: #f6f7fb;
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.08);
}

.country-flag {
  block-size: 18px;
  inline-size: 26px;
  border-radius: 2px;
  object-fit: cover;
}
</style>
