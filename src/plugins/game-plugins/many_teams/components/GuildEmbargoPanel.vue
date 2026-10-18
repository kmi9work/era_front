<script setup>
/**
 * Обзор эмбарго на гильдии (п. 9) — только чтение.
 *
 * Наложение и снятие выполняются в блоке «Отношения» на «Информации о стране» и
 * на «Дашборде» (кнопка в ячейке пары, модалка выбора гильдии): эмбарго
 * накладывает иностранное государство, торгующее на рынке, на гильдии текущего
 * государства. Здесь — сводка «кто на кого наложил» для всех гильдий игры.
 */
import { computed, ref, watch } from 'vue'
import { useCurrentCountry } from '@/composables/useCurrentCountry'
import { engineApi, errorMessage } from '../api'

const { currentCountryId, currentCountry, reloadToken, loadCurrentCountry } = useCurrentCountry()

const data = ref(null)
const loading = ref(false)
const error = ref(null)

const guilds = computed(() => data.value?.guilds || [])
const embargoedTotal = computed(() => guilds.value.reduce((sum, guild) => sum + guild.embargoes.length, 0))

async function load() {
  await loadCurrentCountry()
  if (!currentCountryId.value) {
    data.value = null
    return
  }

  loading.value = true
  error.value = null
  try {
    const { data: payload } = await engineApi.getEmbargoes(currentCountryId.value)
    data.value = payload
  } catch (e) {
    data.value = null
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

watch(currentCountryId, load, { immediate: true })
watch(reloadToken, load)
</script>

<template>
  <VCard class="mt-5">
    <VCardItem>
      <VCardTitle>Эмбарго по гильдиям</VCardTitle>
      <VCardSubtitle>
        Обзор: какие государства наложили эмбарго на гильдии. Наложить или снять эмбарго —
        кнопка в блоке «Отношения» на «Информации о стране» и в ячейке «Дашборда»:
        эмбарго накладывает иностранное государство, торгующее на рынке, на гильдии
        текущего государства ({{ currentCountry?.name || '—' }}).
      </VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VAlert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
        {{ error }}
      </VAlert>

      <div v-if="loading" class="text-medium-emphasis">
        Загрузка…
      </div>

      <v-table v-else density="compact">
        <thead>
          <tr>
            <th class="text-left">Гильдия</th>
            <th class="text-left">Государство гильдии</th>
            <th class="text-left">Эмбарго государств</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="guild in guilds" :key="guild.id">
            <td>{{ guild.name }}</td>
            <td>{{ guild.country_name || '—' }}</td>
            <td>
              <span v-if="!guild.embargoes.length" class="text-medium-emphasis">—</span>
              <VChip
                v-for="row in guild.embargoes"
                :key="row.country_id"
                size="x-small"
                color="error"
                variant="tonal"
                class="me-1"
              >
                {{ row.country_name }}<span v-if="row.year">, {{ row.year }} г.</span>
              </VChip>
            </td>
          </tr>
        </tbody>
      </v-table>

      <div class="text-body-2 text-medium-emphasis mt-3">
        Всего эмбарго: {{ embargoedTotal }}.
      </div>
    </VCardText>
  </VCard>
</template>
