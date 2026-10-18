<script setup>
/**
 * Разрешения на добычу (п. 4) и действие Казначея (п. 5).
 *
 * Таблица — ВСЕ гильдии игры (решение заказчика), переключатель один: «добыча на
 * территории текущего государства». Другие территории отсюда не правятся: страна
 * решает только за свою землю. По умолчанию добыча открыта гильдии в стране, к
 * которой она привязана, и закрыта в остальных; каждое изменение выполняется на
 * бэкенде действием Казначея и попадает в политдействия.
 */
import { computed, ref, watch } from 'vue'
import { useCurrentCountry } from '@/composables/useCurrentCountry'
import { engineApi, errorMessage } from '../api'

const { currentCountryId, currentCountry, reloadToken, loadCurrentCountry } = useCurrentCountry()

const data = ref(null)
const loading = ref(false)
const error = ref(null)
const notice = ref(null)
const saving = ref(null)

const guilds = computed(() => data.value?.guilds || [])
const permissionsCountry = computed(() => data.value?.country || null)

// Сортировка таблицы: по государству гильдии (по умолчанию) и по названию
// гильдии. Данных мало (все гильдии игры), поэтому сортируем на клиенте;
// второй уровень — название гильдии, чтобы порядок был предсказуемым.
const sortKey = ref('country')
const sortDir = ref('asc')
const collator = new Intl.Collator('ru')

const sortedGuilds = computed(() => {
  const field = row => (sortKey.value === 'country' ? row.guild_country_name : row.guild_name) || ''
  return [...guilds.value].sort((a, b) => {
    const primary = collator.compare(field(a), field(b))
    if (primary !== 0) return sortDir.value === 'asc' ? primary : -primary
    const secondary = collator.compare(a.guild_name || '', b.guild_name || '')
    return secondary !== 0 ? secondary : a.guild_id - b.guild_id
  })
})

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    return
  }
  sortKey.value = key
  sortDir.value = 'asc'
}

function sortIcon(key) {
  if (sortKey.value !== key) return 'ri-arrow-up-down-line'
  return sortDir.value === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'
}

function ariaSort(key) {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

async function load() {
  await loadCurrentCountry()
  if (!currentCountryId.value) {
    data.value = null
    return
  }

  loading.value = true
  error.value = null
  try {
    const { data: payload } = await engineApi.getExtractionPermissions(currentCountryId.value)
    data.value = payload
  } catch (e) {
    data.value = null
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

async function toggle(guild, value) {
  saving.value = guild.guild_id
  error.value = null
  notice.value = null
  try {
    const { data: payload } = await engineApi.setExtractionPermission({
      guild_id: guild.guild_id,
      country_id: permissionsCountry.value.id,
      allowed: value,
    })
    notice.value = `Гильдия «${guild.guild_name}»: добыча на территории «${permissionsCountry.value.name}» ` +
      `${payload.allowed ? 'разрешена' : 'запрещена'} (действие Казначея № ${payload.action_id})`
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    saving.value = null
  }
}

watch(currentCountryId, load, { immediate: true })
watch(reloadToken, load)
</script>

<template>
  <VCard class="mt-5">
    <VCardItem>
      <VCardTitle>Добыча по гильдиям</VCardTitle>
      <VCardSubtitle>
        Все гильдии игры. Переключатель — «добыча разрешена на территории
        {{ currentCountry?.name ? `«${currentCountry.name}»` : 'текущего государства' }}»:
        страна решает только за свою землю. По умолчанию открыто в стране гильдии,
        закрыто в остальных; изменение выполняется действием Казначея.
      </VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VAlert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
        {{ error }}
      </VAlert>
      <VAlert v-else-if="notice" type="success" variant="tonal" density="compact" class="mb-3">
        {{ notice }}
      </VAlert>

      <div v-if="loading" class="text-medium-emphasis">
        Загрузка…
      </div>

      <v-table v-else density="compact">
        <thead>
          <tr>
            <th
              class="text-left sortable"
              :aria-sort="ariaSort('name')"
              title="Сортировать по названию гильдии"
              @click="toggleSort('name')"
            >
              Гильдия
              <VIcon :icon="sortIcon('name')" size="14" class="ms-1" />
            </th>
            <th
              class="text-left sortable"
              :aria-sort="ariaSort('country')"
              title="Сортировать по государству гильдии"
              @click="toggleSort('country')"
            >
              Государство гильдии
              <VIcon :icon="sortIcon('country')" size="14" class="ms-1" />
            </th>
            <th class="text-center">
              Добыча на территории «{{ permissionsCountry?.name || currentCountry?.name || '—' }}»
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="guild in sortedGuilds" :key="guild.guild_id">
            <td>{{ guild.guild_name }}</td>
            <td>
              {{ guild.guild_country_name || '—' }}
              <VChip
                v-if="guild.own"
                size="x-small"
                color="primary"
                variant="tonal"
                class="ms-1"
              >
                своя страна
              </VChip>
            </td>
            <td class="text-center">
              <VSwitch
                :model-value="guild.allowed"
                density="compact"
                hide-details
                color="success"
                :loading="saving === guild.guild_id"
                @update:model-value="value => toggle(guild, value)"
              />
              <div class="text-caption text-medium-emphasis">
                {{ guild.overridden ? 'изменено вручную' : 'по умолчанию' }}
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>

<style scoped>
.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.sortable:hover {
  color: rgb(var(--v-theme-primary));
}
</style>
