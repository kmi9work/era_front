<script setup>
/**
 * Подтверждение выбора государств игроков (п. 7).
 *
 * Отметки в ядре «Дашборда» — настройка вида (localStorage). Здесь тот же набор
 * читается из localStorage, но в игру он попадает только после нажатия
 * «Подтвердить выбор»: до подтверждения набор на бэкенде не меняется, поэтому
 * строительство у гильдий идёт по прежнему набору.
 */
import { computed, onBeforeMount, ref } from 'vue'
import { useCurrentCountry } from '@/composables/useCurrentCountry'
import { engineApi, errorMessage } from '../api'

const STORAGE_KEY = 'dashboard_countries'

// Набор, по которому идёт игра, — это набор бэкенда. Отметки в localStorage
// принадлежат ядру «Дашборда»; здесь они читаются, чтобы экраны показывали одно
// и то же, и перезаписываются при подтверждении.
const { currentCountryId } = useCurrentCountry()

const countries = ref([])
const confirmedIds = ref([])
const selectedIds = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const saved = ref(false)

const pending = computed(() => {
  const a = [...confirmedIds.value].sort((x, y) => x - y)
  const b = [...selectedIds.value].sort((x, y) => x - y)
  return a.length !== b.length || a.some((id, i) => id !== b[i])
})

const confirmedNames = computed(() => countries.value
  .filter(country => confirmedIds.value.includes(country.id))
  .map(country => country.name)
  .join(', '))

function readSelectionFromDashboard() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (Array.isArray(stored)) return stored.map(Number)
  } catch (e) {
    console.warn('[many_teams] не удалось прочитать выбор государств Дашборда:', e)
  }
  return null
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data } = await engineApi.getPlayerCountries()
    countries.value = data.countries || []
    confirmedIds.value = data.country_ids || []

    // Пустой набор в localStorage — не выбор: берём подтверждённый набор с
    // бэкенда, а если и он пуст — текущее государство (как делает ядро).
    const stored = (readSelectionFromDashboard() || []).filter(id => countries.value.some(country => country.id === id))
    selectedIds.value = stored.length
      ? stored
      : (confirmedIds.value.length ? [...confirmedIds.value] : (currentCountryId.value ? [currentCountryId.value] : []))
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

async function confirmSelection() {
  saving.value = true
  error.value = null
  saved.value = false
  try {
    const { data } = await engineApi.savePlayerCountries(selectedIds.value)
    confirmedIds.value = data.country_ids || []
    selectedIds.value = [...confirmedIds.value]
    saved.value = true
    // Держим галочки ядра «Дашборда» на том же наборе, что подтверждён в игре.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(confirmedIds.value))
    } catch (e) {
      console.warn('[many_teams] не удалось сохранить выбор государств Дашборда:', e)
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}

function cancelChanges() {
  selectedIds.value = [...confirmedIds.value]
  saved.value = false
}

onBeforeMount(load)
</script>

<template>
  <VCard class="mt-5">
    <VCardItem>
      <VCardTitle>Государства игроков</VCardTitle>
      <VCardSubtitle>
        Гильдии могут строить предприятия только на территории подтверждённых государств.
        Отметки ниже совпадают с галочками дашборда; в игру они попадают после подтверждения.
      </VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ error }}
      </VAlert>

      <VAlert
        v-if="saved && !pending"
        type="success"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        Набор подтверждён: {{ confirmedNames || 'ничего не отмечено' }}
      </VAlert>

      <VAlert
        v-if="pending"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        Выбор изменён, но не подтверждён — в игре действует прежний набор.
      </VAlert>

      <div v-if="loading" class="text-medium-emphasis">
        Загрузка…
      </div>

      <VRow v-else dense>
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
            @change="saved = false"
          />
        </VCol>
      </VRow>

      <div class="d-flex flex-wrap gap-2 mt-4">
        <VBtn
          color="primary"
          :loading="saving"
          :disabled="!pending"
          @click="confirmSelection"
        >
          Подтвердить выбор
        </VBtn>
        <VBtn
          variant="tonal"
          :disabled="!pending"
          @click="cancelChanges"
        >
          Отменить изменения
        </VBtn>
      </div>

      <VAlert
        v-if="!loading && !confirmedIds.length"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        Набор пуст — ограничение не действует, гильдии могут строить на территории любого
        государства. Подтвердите набор, чтобы ограничить строительство государствами игроков.
      </VAlert>
    </VCardText>
  </VCard>
</template>
