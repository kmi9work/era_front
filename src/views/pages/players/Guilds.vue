<template>
  <div>
    <VCard class="mb-4">
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Гильдии</span>
        <div class="d-flex gap-2">
          <VBtn color="primary" @click="openCreate">Новая гильдия</VBtn>
          <VBtn color="secondary" variant="tonal" @click="loadAll" :loading="loading">Обновить</VBtn>
        </div>
      </VCardTitle>
    </VCard>

    <VTable>
      <thead>
        <tr>
          <th class="text-left">Название</th>
          <th class="text-left">Игроков</th>
          <th class="text-center" style="width:220px">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="g in guilds" :key="g.id">
          <td>{{ g.name }}</td>
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
            v-model="form.player_ids"
            :items="availablePlayers"
            item-title="name"
            item-value="id"
            label="Игроки"
            chips
            multiple
            variant="outlined"
            density="compact"
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
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const guilds = ref([])
const availablePlayers = ref([])
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editedGuild = ref(null)
const toDelete = ref(null)

const form = ref({ name: '', player_ids: [] })

const loadGuilds = async () => {
  const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/guilds/list.json`)
  guilds.value = data || []
}

const loadPlayersWithoutGuild = async () => {
  const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/players.json`, { params: { without_guild: 1 } })
  availablePlayers.value = data || []
}

const loadAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadGuilds(), loadPlayersWithoutGuild()])
  } finally {
    loading.value = false
  }
}

const openCreate = async () => {
  editedGuild.value = null
  form.value = { name: '', player_ids: [] }
  dialog.value = true
  await loadPlayersWithoutGuild()
}

const openEdit = async (g) => {
  editedGuild.value = g
  form.value = { name: g.name, player_ids: [...(g.player_ids || [])] }
  dialog.value = true
  // В списке доступных показываем и текущих участников
  const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/players.json`, { params: { without_guild: 1 } })
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

</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>


