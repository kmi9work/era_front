<script setup>
/**
 * Разрешения на добычу «государство × гильдия» (п. 4) и действие Казначея (п. 5).
 *
 * По умолчанию добыча открыта гильдии в стране, к которой она привязана, и
 * закрыта в остальных. Переключатель меняет показатель; каждое изменение
 * выполняется на бэкенде действием Казначея и попадает в политдействия.
 */
import { computed, ref, watch } from 'vue'
import { useCurrentCountry } from '@/composables/useCurrentCountry'
import { engineApi, errorMessage } from '../api'

const { currentCountryId, reloadToken, loadCurrentCountry } = useCurrentCountry()

const data = ref(null)
const loading = ref(false)
const error = ref(null)
const notice = ref(null)
const saving = ref(null)

const guilds = computed(() => data.value?.guilds || [])
const countries = computed(() => data.value?.countries || [])
const playerCountryIds = computed(() => data.value?.player_country_ids || [])

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

async function toggle(guild, permission, value) {
  saving.value = `${guild.guild_id}:${permission.country_id}`
  error.value = null
  notice.value = null
  try {
    const { data: payload } = await engineApi.setExtractionPermission({
      guild_id: guild.guild_id,
      country_id: permission.country_id,
      allowed: value,
    })
    notice.value = `Гильдия «${guild.guild_name}»: добыча в государстве «${permission.country_name}» ` +
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
        Показатель «возможно ли производство на добывающих предприятиях» для пары
        «государство × гильдия». По умолчанию открыто в стране гильдии, закрыто в остальных;
        переключатель меняет показатель действием Казначея.
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

      <div v-else class="table-scroll">
        <v-table density="compact">
          <thead>
            <tr>
              <th class="text-left sticky-col">Гильдия</th>
              <th
                v-for="country in countries"
                :key="country.id"
                class="text-center"
              >
                {{ country.short_name || country.name }}
                <VChip
                  v-if="playerCountryIds.includes(country.id)"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  class="ms-1"
                >
                  игрок
                </VChip>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="guild in guilds" :key="guild.guild_id">
              <td class="sticky-col">{{ guild.guild_name }}</td>
              <td
                v-for="permission in guild.permissions"
                :key="permission.country_id"
                class="text-center"
              >
                <VSwitch
                  :model-value="permission.allowed"
                  density="compact"
                  hide-details
                  color="success"
                  :loading="saving === `${guild.guild_id}:${permission.country_id}`"
                  @update:model-value="value => toggle(guild, permission, value)"
                />
                <div class="text-caption text-medium-emphasis">
                  {{ permission.overridden ? 'изменено' : (permission.own ? 'своя страна' : 'по умолчанию') }}
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.table-scroll {
  overflow-x: auto;
}

.table-scroll :deep(table) {
  inline-size: max-content;
  min-inline-size: 100%;
}

.table-scroll :deep(.sticky-col) {
  position: sticky;
  inset-inline-start: 0;
  z-index: 2;
  background: rgb(var(--v-theme-surface));
}

.table-scroll :deep(thead th.sticky-col) {
  z-index: 3;
  background: #f6f7fb;
}
</style>
