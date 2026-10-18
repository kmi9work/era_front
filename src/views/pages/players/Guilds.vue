<template>
  <div>
    <VCard class="mb-4">
      <VCardTitle class="d-flex justify-space-between align-center flex-wrap gap-2">
        <span>Гильдии</span>
        <div class="d-flex gap-2">
          <VBtn color="primary" @click="openCreate">Новая гильдия</VBtn>
          <VBtn color="secondary" variant="tonal" @click="loadAll" :loading="loading">Обновить</VBtn>
        </div>
      </VCardTitle>
      <VCardText class="d-flex flex-wrap align-center gap-2">
        <VSelect
          v-model="filterCountry"
          :items="countryFilterOptions"
          item-title="title"
          item-value="value"
          label="Государство"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 320px"
        />
        <span class="text-caption text-medium-emphasis">
          Гильдия принадлежит государству: в списке — гильдии выбранной страны.
        </span>
      </VCardText>
    </VCard>

    <VTable>
      <thead>
        <tr>
          <th class="text-left">Название</th>
          <th class="text-left">Государство</th>
          <th class="text-left">Игроков</th>
          <th class="text-center" style="width:220px">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="g in guilds" :key="g.id">
          <td>{{ g.name }}</td>
          <td>
            <div class="d-flex align-center gap-2">
              <img
                v-if="guildCountry(g)?.flag_image_name"
                :src="`/images/countries/${guildCountry(g).flag_image_name}.png`"
                :alt="guildCountry(g)?.name"
                height="16"
              >
              <span>{{ guildCountry(g)?.name || '—' }}</span>
            </div>
          </td>
          <td>{{ g.player_ids?.length || 0 }}</td>
          <td class="text-center">
            <VBtn size="small" variant="tonal" color="primary" class="me-2" @click="openEdit(g)">
              <VIcon start icon="ri-edit-line" /> Редактировать
            </VBtn>
            <VBtn size="small" variant="tonal" color="error" @click="confirmDelete(g)">
              <VIcon start icon="ri-delete-bin-line" /> Удалить
            </VBtn>
          </td>
        </tr>
      </tbody>
    </VTable>

    <!-- Диалог создания/редактирования -->
    <VDialog v-model="dialog" max-width="640">
      <VCard>
        <VCardTitle>{{ editedGuild?.id ? 'Редактировать гильдию' : 'Новая гильдия' }}</VCardTitle>
        <VCardText>
          <VTextField v-model="form.name" label="Название" variant="outlined" density="compact" />

          <VSelect
            v-model="form.country_id"
            :items="countryOptions"
            item-title="title"
            item-value="value"
            label="Государство"
            variant="outlined"
            density="compact"
            class="mt-3"
          />

          <VSelect
            v-model="form.player_ids"
            :items="availablePlayers"
            item-title="name"
            item-value="id"
            label="Игроки"
            chips
            multiple
            variant="outlined"
            density="compact"
            class="mt-3"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog=false">Отмена</VBtn>
          <VBtn color="primary" :loading="saving" @click="saveGuild">Сохранить</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Диалог удаления -->
    <VDialog v-model="deleteDialog" max-width="520">
      <VCard>
        <VCardTitle>Удалить гильдию</VCardTitle>
        <VCardText>
          Вы действительно хотите удалить гильдию «{{ toDelete?.name }}»?
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="deleteDialog=false">Отмена</VBtn>
          <VBtn color="error" :loading="deleting" @click="deleteGuild">Удалить</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
  
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useCurrentCountry } from '@/composables/useCurrentCountry'

/**
 * Гильдии привязаны к государству (`guilds.country_id`, Д11 ТЗ «несколько
 * команд»): список фильтруется по выбранной стране, при создании страна по
 * умолчанию — текущая, поле можно поменять в диалоге.
 */
const { currentCountryId, countries, loadCurrentCountry } = useCurrentCountry()

const guilds = ref([])
const availablePlayers = ref([])
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editedGuild = ref(null)
const toDelete = ref(null)

// null — «Все государства»
const filterCountry = ref(null)
// Первый показ списка: подставить текущее государство; дальше выбор мастера не трогаем
let filterInitialized = false

const form = ref({ name: '', player_ids: [], country_id: null })

const countryOptions = computed(() =>
  countries.value.map(country => ({ title: country.name, value: country.id }))
)

const countryFilterOptions = computed(() => [
  { title: 'Все государства', value: null },
  ...countryOptions.value,
])

const guildCountry = (guild) =>
  guild?.country || countries.value.find(country => country.id === guild?.country_id) || null

const loadGuilds = async () => {
  const params = filterCountry.value ? { country_id: filterCountry.value } : {}
  const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/guilds/list.json`, { params })
  guilds.value = data || []
}

const loadPlayersWithoutGuild = async () => {
  const params = { without_guild: 1 }
  if (form.value.country_id) params.country_id = form.value.country_id
  const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/players.json`, { params })
  availablePlayers.value = data || []
}

const loadAll = async () => {
  loading.value = true
  try {
    await loadCurrentCountry()
    // По умолчанию показываем гильдии текущего государства (только при первом
    // открытии: явно выбранное «Все государства» кнопка «Обновить» не сбрасывает)
    if (!filterInitialized && currentCountryId.value) {
      filterCountry.value = currentCountryId.value
      filterInitialized = true
    }
    await Promise.all([loadGuilds(), loadPlayersWithoutGuild()])
  } finally {
    loading.value = false
  }
}

const openCreate = async () => {
  editedGuild.value = null
  form.value = {
    name: '',
    player_ids: [],
    country_id: filterCountry.value || currentCountryId.value || null,
  }
  dialog.value = true
  await loadPlayersWithoutGuild()
}

const openEdit = async (g) => {
  editedGuild.value = g
  form.value = {
    name: g.name,
    player_ids: [...(g.player_ids || [])],
    country_id: g.country_id ?? currentCountryId.value ?? null,
  }
  dialog.value = true
  // В списке доступных показываем и текущих участников
  const params = { without_guild: 1 }
  if (form.value.country_id) params.country_id = form.value.country_id
  const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/players.json`, { params })
  const currentMembers = (g.players || [])
  availablePlayers.value = [...currentMembers, ...(data || [])]
}

const saveGuild = async () => {
  saving.value = true
  try {
    if (editedGuild.value?.id) {
      await axios.patch(`${import.meta.env.VITE_PROXY}/guilds/${editedGuild.value.id}.json`, { guild: form.value })
    } else {
      await axios.post(`${import.meta.env.VITE_PROXY}/guilds.json`, { guild: form.value })
    }
    dialog.value = false
    await loadAll()
  } catch (e) {
    console.error('Ошибка сохранения гильдии:', e)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (g) => {
  toDelete.value = g
  deleteDialog.value = true
}

const deleteGuild = async () => {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await axios.delete(`${import.meta.env.VITE_PROXY}/guilds/${toDelete.value.id}.json`)
    deleteDialog.value = false
    await loadAll()
  } catch (e) {
    console.error('Ошибка удаления гильдии:', e)
  } finally {
    deleting.value = false
  }
}

onMounted(loadAll)

// Смена государства в шапке переключает список гильдий на новую страну
watch(currentCountryId, (id) => {
  if (!id || filterCountry.value === id) return
  filterCountry.value = id
})

// Фильтр по государству перечитывает список
watch(filterCountry, () => loadGuilds())

</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>


