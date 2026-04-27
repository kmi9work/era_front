<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">
          Игроки и QR-коды
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          Управление игроками и генерация QR-кодов для мобильного приложения
        </p>
      </div>
      
      <div class="d-flex gap-3">
        <VBtn
          color="primary"
          variant="elevated"
          @click="openCreatePlayer"
        >
          <VIcon start icon="ri-user-add-line" />
          Новый игрок
        </VBtn>
        <VBtn
          color="primary"
          @click="refreshPlayers"
          :loading="loading"
        >
          <VIcon start icon="ri-refresh-line" />
          Обновить
        </VBtn>
        
        <VBtn
          color="success"
          @click="printQRCodes"
        >
          <VIcon start icon="ri-printer-line" />
          Печать QR-кодов
        </VBtn>
        
        <VBtn
          color="info"
          @click="regenerateQRCodes"
          :loading="generatingQR"
        >
          <VIcon start icon="ri-qr-code-line" />
          Перегенерировать QR
        </VBtn>
      </div>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center">
              <VIcon icon="ri-user-line" size="40" color="primary" class="me-3" />
              <div>
                <div class="text-h6 font-weight-bold">{{ players.length }}</div>
                <div class="text-body-2 text-medium-emphasis">Всего игроков</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center">
              <VIcon icon="ri-vip-crown-line" size="40" color="warning" class="me-3" />
              <div>
                <div class="text-h6 font-weight-bold">{{ noblesCount }}</div>
                <div class="text-body-2 text-medium-emphasis">Знать</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center">
              <VIcon icon="ri-store-line" size="40" color="success" class="me-3" />
              <div>
                <div class="text-h6 font-weight-bold">{{ merchantsCount }}</div>
                <div class="text-body-2 text-medium-emphasis">Купец</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center">
              <VIcon icon="ri-qr-code-line" size="40" color="info" class="me-3" />
              <div>
                <div class="text-h6 font-weight-bold">{{ players.length }}</div>
                <div class="text-body-2 text-medium-emphasis">QR-кодов</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Search and Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="6">
            <VTextField
              v-model="searchQuery"
              placeholder="Поиск по имени или идентификатору..."
              prepend-inner-icon="ri-search-line"
              clearable
              variant="outlined"
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="filterType"
              :items="playerTypes"
              placeholder="Тип игрока"
              clearable
              variant="outlined"
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="sortBy"
              :items="sortOptions"
              placeholder="Сортировка"
              variant="outlined"
              density="compact"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Tabs: Players | Guilds -->
    <VTabs v-model="activeTab" class="mb-4">
      <VTab value="players">Игроки</VTab>
      <VTab value="guilds">Гильдии</VTab>
    </VTabs>

    <VWindow v-model="activeTab">
      <VWindowItem value="players">
        <!-- Players Grid -->
    <VRow>
      <VCol
        v-for="player in filteredPlayers"
        :key="player.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <VCard class="player-card" elevation="2">
          <VCardText class="text-center">
            <!-- Player Info -->
            <div>
              <h3 class="text-h6 font-weight-bold mb-3">
                {{ player.name }}
              </h3>
            </div>

            <!-- QR Code -->
            <div class="qr-container mb-4">
              <div v-if="generatingQR" class="qr-loading">
                <VProgressCircular
                  indeterminate
                  color="primary"
                  size="40"
                />
                <div class="text-caption mt-2">Генерация QR-кода...</div>
              </div>
              <div v-else ref="qrCodeRef" :id="`qr-${player.id}`" class="qr-code"></div>
            </div>

            <!-- Identificator (всегда показывается) -->
            <VTextField
              :model-value="player.identificator"
              readonly
              variant="outlined"
              density="compact"
              class="mb-2"
              append-inner-icon="ri-copy-line"
              @click:append-inner="copyIdentificator(player.identificator)"
            />

            <!-- Actions -->
            <div class="d-flex gap-1 justify-center mt-2">
              <VBtn icon size="small" color="primary" variant="text" @click="copyIdentificator(player.identificator)">
                <VIcon icon="ri-copy-line" />
              </VBtn>
              <VBtn icon size="small" color="success" variant="text" @click="downloadQRCode(player)">
                <VIcon icon="ri-download-line" />
              </VBtn>
              <VBtn icon size="small" color="info" variant="text" @click="openEditPlayer(player)">
                <VIcon icon="ri-edit-line" />
              </VBtn>
              <VBtn icon size="small" color="error" variant="text" @click="confirmDeletePlayer(player)">
                <VIcon icon="ri-delete-bin-line" />
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VCol>
        </VRow>

        <!-- Empty State -->
        <VCard v-if="filteredPlayers.length === 0" class="text-center pa-8">
      <VIcon icon="ri-user-search-line" size="64" color="medium-emphasis" class="mb-4" />
      <h3 class="text-h6 mb-2">Игроки не найдены</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Попробуйте изменить параметры поиска или фильтрации
      </p>
      <VBtn @click="clearFilters">
        <VIcon start icon="ri-refresh-line" />
        Сбросить фильтры
      </VBtn>
        </VCard>
      </VWindowItem>

      <VWindowItem value="guilds">
        <Guilds />
      </VWindowItem>
    </VWindow>
  </div>

  <!-- Диалог создания/редактирования игрока -->
  <VDialog v-model="playerDialog" max-width="520">
    <VCard>
      <VCardTitle>{{ editingPlayer?.id ? 'Редактировать игрока' : 'Новый игрок' }}</VCardTitle>
      <VCardText>
        <VTextField
          v-model="playerForm.name"
          label="Имя"
          variant="outlined"
          density="compact"
          :error="!!playerErrors.name"
          :error-messages="playerErrors.name"
        />
        <VSelect
          v-model="playerForm.player_type_id"
          :items="playerTypeOptions"
          item-title="title"
          item-value="value"
          label="Тип игрока"
          variant="outlined"
          density="compact"
          clearable
        />
        <VSelect
          v-model="playerForm.family_id"
          :items="familyOptions"
          item-title="title"
          item-value="value"
          label="Семья"
          variant="outlined"
          density="compact"
          clearable
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="closePlayerDialog">Отмена</VBtn>
        <VBtn color="primary" :loading="savingPlayer" @click="savePlayer">Сохранить</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Диалог удаления игрока -->
  <VDialog v-model="deleteDialog" max-width="480">
    <VCard>
      <VCardTitle>Удалить игрока</VCardTitle>
      <VCardText>
        Вы действительно хотите удалить игрока «{{ deletingPlayer?.name }}»?
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="deleteDialog=false">Отмена</VBtn>
        <VBtn color="error" :loading="deletingPlayerLoading" @click="deletePlayer">Удалить</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import QRCode from 'qrcode'
import Guilds from '@/views/pages/players/Guilds.vue'

// Reactive data
const activeTab = ref('players')
const players = ref([])
const loading = ref(false)
const generatingQR = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const sortBy = ref('name')

// Player CRUD state
const playerDialog = ref(false)
const editingPlayer = ref(null)
const savingPlayer = ref(false)
const playerErrors = ref({ name: '' })
const playerForm = ref({ name: '', player_type_id: null, family_id: null })
const playerTypeOptions = ref([])
const familyOptions = ref([])
const deleteDialog = ref(false)
const deletingPlayer = ref(null)
const deletingPlayerLoading = ref(false)

// Computed properties
const noblesCount = computed(() => 
  players.value.filter(p => p.player_type?.name === 'Знать').length
)

const merchantsCount = computed(() => 
  players.value.filter(p => p.player_type?.name === 'Купец').length
)

const playerTypes = computed(() => {
  const types = [...new Set(players.value.map(p => p.player_type?.name).filter(Boolean))]
  return types.map(type => ({ title: type, value: type }))
})

const sortOptions = [
  { title: 'По имени', value: 'name' },
  { title: 'По типу', value: 'type' },
  { title: 'По семье', value: 'family' },
  { title: 'По ID', value: 'id' }
]

const filteredPlayers = computed(() => {
  let filtered = players.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(player => 
      player.name.toLowerCase().includes(query) ||
      player.identificator.toLowerCase().includes(query) ||
      player.family?.name?.toLowerCase().includes(query)
    )
  }

  // Type filter
  if (filterType.value) {
    filtered = filtered.filter(player => player.player_type?.name === filterType.value)
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'type':
        return (a.player_type?.name || '').localeCompare(b.player_type?.name || '')
      case 'family':
        return (a.family?.name || '').localeCompare(b.family?.name || '')
      case 'id':
        return a.id - b.id
      default:
        return 0
    }
  })

  return filtered
})

// Methods
const loadPlayers = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/players.json`)
    players.value = response.data
    
    // Ждем обновления DOM и генерируем QR-коды
    await nextTick()
    setTimeout(() => {
      generateQRCodes()
    }, 100) // Небольшая задержка для гарантии готовности DOM
  } catch (error) {
    console.error('Error loading players:', error)
  } finally {
    loading.value = false
  }
}

const loadPlayerTypes = async () => {
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/player_types.json`)
    playerTypeOptions.value = (data || []).map(pt => ({ title: pt.name || `#${pt.id}`, value: pt.id }))
  } catch (e) {
    playerTypeOptions.value = []
  }
}

const loadFamilies = async () => {
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/families.json`)
    familyOptions.value = (data || []).map(f => ({ title: f.name || `#${f.id}`, value: f.id }))
  } catch (e) {
    familyOptions.value = []
  }
}

const openCreatePlayer = async () => {
  editingPlayer.value = null
  playerForm.value = { name: '', player_type_id: null, family_id: null }
  playerErrors.value = { name: '' }
  await Promise.all([loadPlayerTypes(), loadFamilies()])
  playerDialog.value = true
}

const openEditPlayer = async (player) => {
  editingPlayer.value = player
  playerForm.value = {
    name: player.name || '',
    player_type_id: player.player_type?.id || null,
    family_id: player.family?.id || null,
  }
  playerErrors.value = { name: '' }
  await Promise.all([loadPlayerTypes(), loadFamilies()])
  playerDialog.value = true
}

const closePlayerDialog = () => {
  playerDialog.value = false
}

const validatePlayer = () => {
  let valid = true
  playerErrors.value = { name: '' }
  if (!playerForm.value.name || !playerForm.value.name.trim()) {
    playerErrors.value.name = 'Имя обязательно'
    valid = false
  }
  return valid
}

const savePlayer = async () => {
  if (!validatePlayer()) return
  savingPlayer.value = true
  try {
    if (editingPlayer.value?.id) {
      await axios.patch(`${import.meta.env.VITE_PROXY}/players/${editingPlayer.value.id}.json`, { player: playerForm.value })
    } else {
      await axios.post(`${import.meta.env.VITE_PROXY}/players.json`, { player: playerForm.value })
    }
    playerDialog.value = false
    await loadPlayers()
  } catch (e) {
    console.error('Ошибка сохранения игрока:', e)
  } finally {
    savingPlayer.value = false
  }
}

const confirmDeletePlayer = (player) => {
  deletingPlayer.value = player
  deleteDialog.value = true
}

const deletePlayer = async () => {
  if (!deletingPlayer.value) return
  deletingPlayerLoading.value = true
  try {
    await axios.delete(`${import.meta.env.VITE_PROXY}/players/${deletingPlayer.value.id}.json`)
    deleteDialog.value = false
    await loadPlayers()
  } catch (e) {
    console.error('Ошибка удаления игрока:', e)
  } finally {
    deletingPlayerLoading.value = false
  }
}

const generateQRCodes = async () => {
  // Проверяем, что библиотека QRCode загружена
  if (typeof QRCode === 'undefined') {
    console.error('QRCode library not loaded')
    return
  }

  // Ждем следующий тик, чтобы DOM обновился
  await nextTick()
  
  for (const player of players.value) {
    try {
      const qrData = {
        type: 'player_auth',
        identificator: player.identificator,
        player_name: player.name,
        generated_at: new Date().toISOString()
      }

      const container = document.getElementById(`qr-${player.id}`)
      if (!container) {
        console.warn(`Container not found for player ${player.id}`)
        continue
      }

      // Очищаем контейнер
      container.innerHTML = ''

      // Создаем canvas
      const canvas = document.createElement('canvas')
      canvas.width = 150
      canvas.height = 150
      container.appendChild(canvas)

      // Генерируем QR-код
      await QRCode.toCanvas(canvas, JSON.stringify(qrData), {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

    } catch (error) {
      console.error(`Error generating QR code for player ${player.id}:`, error)
      
      // Fallback: показываем текстовый идентификатор
      const container = document.getElementById(`qr-${player.id}`)
      if (container) {
        container.innerHTML = `
          <div style="
            width: 150px; 
            height: 150px; 
            border: 1px solid #ccc; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            text-align: center; 
            font-size: 10px; 
            word-break: break-all;
            padding: 5px;
            background: #f5f5f5;
          ">
            ${player.identificator}
          </div>
        `
      }
    }
  }
}

const refreshPlayers = () => {
  loadPlayers()
}

const regenerateQRCodes = async () => {
  generatingQR.value = true
  try {
    await nextTick()
    await generateQRCodes()
  } catch (error) {
    console.error('Error regenerating QR codes:', error)
  } finally {
    generatingQR.value = false
  }
}

const printQRCodes = () => {
  window.print()
}

const copyIdentificator = async (identificator) => {
  try {
    await navigator.clipboard.writeText(identificator)
    // Можно добавить уведомление об успешном копировании
  } catch (error) {
    console.error('Error copying identificator:', error)
  }
}

const downloadQRCode = (player) => {
  if (typeof QRCode === 'undefined') {
    console.error('QRCode library not loaded')
    return
  }

  const container = document.getElementById(`qr-${player.id}`)
  if (container) {
    const canvas = container.querySelector('canvas')
    if (canvas) {
      const link = document.createElement('a')
      link.download = `qr-${player.name}-${player.id}.png`
      link.href = canvas.toDataURL()
      link.click()
    } else {
      // Fallback: создаем QR-код для скачивания
      const qrData = {
        type: 'player_auth',
        identificator: player.identificator,
        player_name: player.name,
        generated_at: new Date().toISOString()
      }
      
      QRCode.toDataURL(JSON.stringify(qrData), {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(url => {
        const link = document.createElement('a')
        link.download = `qr-${player.name}-${player.id}.png`
        link.href = url
        link.click()
      }).catch(error => {
        console.error('Error generating QR code for download:', error)
      })
    }
  }
}

const getPlayerColor = (player) => {
  if (player.player_type?.name === 'Купец') return 'success'
  if (player.player_type?.name === 'Знать') return 'warning'
  if (player.player_type?.name === 'Мудрец') return 'info'
  if (player.player_type?.name === 'Дух народного бунта') return 'error'
  return 'primary'
}

const getPlayerIcon = (player) => {
  if (player.player_type?.name === 'Купец') return 'ri-store-line'
  if (player.player_type?.name === 'Знать') return 'ri-vip-crown-line'
  if (player.player_type?.name === 'Мудрец') return 'ri-book-line'
  if (player.player_type?.name === 'Дух народного бунта') return 'ri-flame-line'
  return 'ri-user-line'
}

const getPlayerTypeColor = (player) => {
  if (player.player_type?.name === 'Купец') return 'success'
  if (player.player_type?.name === 'Знать') return 'warning'
  if (player.player_type?.name === 'Мудрец') return 'info'
  if (player.player_type?.name === 'Дух народного бунта') return 'error'
  return 'primary'
}

const clearFilters = () => {
  searchQuery.value = ''
  filterType.value = ''
  sortBy.value = 'name'
}

// Lifecycle
onMounted(() => {
  loadPlayers()
})
</script>

<style scoped>
.player-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.player-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.qr-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.qr-code {
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 150px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

@media print {
  .player-card {
    page-break-inside: avoid;
    margin-bottom: 20px;
  }
  
  .qr-container {
    background: white;
    border: 1px solid #000;
  }
}
</style>
