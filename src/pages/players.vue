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
            <div class="mb-4">
              <VAvatar
                :color="getPlayerColor(player)"
                size="60"
                class="mb-3"
              >
                <VIcon :icon="getPlayerIcon(player)" size="30" />
              </VAvatar>
              
              <h3 class="text-h6 font-weight-bold mb-1">
                {{ player.name }}
              </h3>
              
              <div class="text-body-2 text-medium-emphasis mb-2">
                {{ player.player_type?.name || 'Игрок' }}
              </div>
              
              <VChip
                :color="getPlayerTypeColor(player)"
                size="small"
                class="mb-2"
              >
                {{ player.family?.name || 'Без семьи' }}
              </VChip>
            </div>

            <!-- QR Code Type Selector -->
            <div class="d-flex justify-center mb-3" style="gap: 8px;">
              <VBtn
                size="small"
                :color="qrCodeTypes[player.id] === 'main' ? 'primary' : 'default'"
                :variant="qrCodeTypes[player.id] === 'main' ? 'flat' : 'outlined'"
                @click="changeQRType(player, 'main')"
              >
                Главный
              </VBtn>
              <VBtn
                size="small"
                :color="qrCodeTypes[player.id] === 'game' ? 'primary' : 'default'"
                :variant="qrCodeTypes[player.id] === 'game' ? 'flat' : 'outlined'"
                @click="changeQRType(player, 'game')"
              >
                Игровой
              </VBtn>
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

            <!-- Identificator -->
            <VTextField
              :model-value="player.identificator"
              readonly
              variant="outlined"
              density="compact"
              class="mb-3"
              append-inner-icon="ri-copy-line"
              @click:append-inner="copyIdentificator(player.identificator)"
            />

            <!-- Actions -->
            <div class="d-flex justify-center flex-wrap" style="gap: 8px;">
              <VBtn
                size="small"
                color="primary"
                variant="outlined"
                @click="copyIdentificator(player.identificator)"
              >
                <VIcon start icon="ri-copy-line" />
                Копировать
              </VBtn>
              
              <VBtn
                size="small"
                color="success"
                variant="outlined"
                @click="downloadQRCode(player)"
              >
                <VIcon start icon="ri-download-line" />
                Скачать
              </VBtn>
              
              <VBtn
                size="small"
                color="info"
                variant="outlined"
                @click="openPlayerDialog(player)"
              >
                <VIcon start icon="ri-user-settings-line" />
                Характеристика
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

    <!-- Player Dialog -->
    <VDialog v-model="playerDialog" max-width="800">
      <VCard v-if="selectedPlayer">
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Характеристика игрока</span>
          <VBtn icon variant="text" @click="playerDialog = false">
            <VIcon icon="ri-close-line" />
          </VBtn>
        </VCardTitle>

        <VCardText>
          <!-- Player Info -->
          <div class="mb-6">
            <div class="d-flex align-center mb-4">
              <VAvatar :color="getPlayerColor(selectedPlayer)" size="80" class="me-4">
                <VIcon :icon="getPlayerIcon(selectedPlayer)" size="40" />
              </VAvatar>
              <div>
                <h2 class="text-h5 font-weight-bold mb-1">{{ selectedPlayer.name }}</h2>
                <div class="text-body-1 text-medium-emphasis mb-1">
                  {{ selectedPlayer.player_type?.name || 'Игрок' }}
                </div>
                <VChip :color="getPlayerTypeColor(selectedPlayer)" size="small">
                  {{ selectedPlayer.family?.name || 'Без семьи' }}
                </VChip>
              </div>
            </div>

            <VDivider class="mb-4" />

            <div class="d-flex flex-column gap-2">
              <div class="d-flex">
                <span class="text-medium-emphasis" style="width: 150px;">ID:</span>
                <span class="font-weight-medium">{{ selectedPlayer.id }}</span>
              </div>
              <div class="d-flex">
                <span class="text-medium-emphasis" style="width: 150px;">Идентификатор:</span>
                <span class="font-weight-medium">{{ selectedPlayer.identificator }}</span>
              </div>
            </div>
          </div>

          <!-- Resources -->
          <div class="mb-6">
            <div class="d-flex justify-space-between align-center mb-3">
              <h3 class="text-h6 font-weight-bold">Ресурсы игрока</h3>
              <VBtn
                color="primary"
                size="small"
                @click="loadPlayerResources"
                :loading="loadingResources"
              >
                <VIcon start icon="ri-refresh-line" />
                Обновить
              </VBtn>
            </div>

            <div v-if="loadingResources" class="text-center py-8">
              <VProgressCircular indeterminate color="primary" />
            </div>

            <div v-else-if="playerResources.length === 0" class="text-center py-8 text-medium-emphasis">
              У игрока нет ресурсов
            </div>

            <div v-else class="resources-grid">
              <div
                v-for="resource in playerResources"
                :key="resource.identificator"
                class="resource-item"
              >
                <VImg
                  :src="`/images/resources/${resource.identificator}.png`"
                  width="40"
                  height="40"
                  class="me-3"
                />
                <div class="flex-grow-1">
                  <div class="font-weight-medium">{{ resource.name || resource.identificator }}</div>
                  <div class="text-caption text-medium-emphasis">{{ resource.identificator }}</div>
                </div>
                <VChip color="primary" size="small">
                  {{ resource.count }}
                </VChip>
              </div>
            </div>
          </div>

          <!-- Add Resources Section -->
          <VDivider class="mb-4" />
          
          <div>
            <h3 class="text-h6 font-weight-bold mb-3">Добавить ресурсы</h3>
            
            <div class="add-resources-grid mb-4">
              <div
                v-for="(resource, index) in newResources"
                :key="index"
                class="add-resource-item"
              >
                <VImg
                  :src="`/images/resources/${resource.identificator}.png`"
                  width="40"
                  height="40"
                  class="me-2"
                />
                <VTextField
                  v-model.number="resource.count"
                  :label="resource.name || resource.identificator"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="flex: 1;"
                  min="0"
                />
              </div>
            </div>

            <VBtn
              color="success"
              block
              @click="addResourcesToPlayer"
              :loading="addingResources"
              :disabled="!hasResourcesToAdd"
            >
              <VIcon start icon="ri-add-line" />
              Добавить выбранные ресурсы
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import QRCode from 'qrcode'

// Reactive data
const players = ref([])
const loading = ref(false)
const generatingQR = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const sortBy = ref('name')
const qrCodeTypes = ref({}) // { playerId: 'main' | 'game' }

// Player dialog
const playerDialog = ref(false)
const selectedPlayer = ref(null)
const playerResources = ref([])
const loadingResources = ref(false)
const addingResources = ref(false)

// Available resources for adding
const allResources = ref([])
const newResources = ref([])

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

const hasResourcesToAdd = computed(() => {
  return newResources.value.some(r => r.count > 0)
})

// Methods
const loadPlayers = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/players.json`)
    players.value = response.data
    
    // Инициализируем тип QR-кода для каждого игрока (по умолчанию "главный")
    players.value.forEach(player => {
      if (!qrCodeTypes.value[player.id]) {
        qrCodeTypes.value[player.id] = 'main'
      }
    })
    
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

const generateQRCodes = async () => {
  // Проверяем, что библиотека QRCode загружена
  if (typeof QRCode === 'undefined') {
    console.error('QRCode library not loaded')
    return
  }

  // Ждем следующий тик, чтобы DOM обновился
  await nextTick()
  
  for (const player of players.value) {
    await generateSingleQRCode(player)
  }
}

const changeQRType = async (player, type) => {
  qrCodeTypes.value[player.id] = type
  await generateSingleQRCode(player)
}

const generateSingleQRCode = async (player) => {
  try {
    const qrType = qrCodeTypes.value[player.id] || 'main'
    
    console.log(`Generating QR for player ${player.name}, type: ${qrType}`)
    console.log(`Identificator: ${player.identificator}, Name: ${player.name}`)
    
    // Главный QR-код содержит только identificator, игровой - только name
    const qrData = qrType === 'main' ? player.identificator : player.name
    
    console.log('QR Data:', qrData)

    const container = document.getElementById(`qr-${player.id}`)
    if (!container) {
      console.warn(`Container not found for player ${player.id}`)
      return
    }

    // Очищаем контейнер
    container.innerHTML = ''

    // Создаем canvas
    const canvas = document.createElement('canvas')
    canvas.width = 150
    canvas.height = 150
    container.appendChild(canvas)

    // Генерируем QR-код (теперь qrData - это простая строка)
    await QRCode.toCanvas(canvas, qrData, {
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
      const qrType = qrCodeTypes.value[player.id] || 'main'
      const displayText = qrType === 'main' ? player.identificator : player.name
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
          ${displayText}
        </div>
      `
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

// Player dialog methods
const openPlayerDialog = async (player) => {
  selectedPlayer.value = player
  playerDialog.value = true
  
  // Загружаем список всех ресурсов, если еще не загружен
  if (allResources.value.length === 0) {
    await loadAllResources()
  }
  
  // Инициализируем список ресурсов для добавления
  newResources.value = allResources.value.map(r => ({ ...r, count: 0 }))
  
  // Загружаем ресурсы игрока
  await loadPlayerResources()
}

const loadAllResources = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_PROXY}/resources/show_all_resources`
    )
    // Берем только identificator и name
    allResources.value = response.data.map(r => ({
      identificator: r.identificator,
      name: r.name
    }))
  } catch (error) {
    console.error('Error loading all resources:', error)
    allResources.value = []
  }
}

const loadPlayerResources = async () => {
  if (!selectedPlayer.value) return
  
  loadingResources.value = true
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_PROXY}/players/${selectedPlayer.value.id}/show_players_resources`
    )
    playerResources.value = response.data || []
  } catch (error) {
    console.error('Error loading player resources:', error)
    playerResources.value = []
  } finally {
    loadingResources.value = false
  }
}

const addResourcesToPlayer = async () => {
  if (!selectedPlayer.value || !hasResourcesToAdd.value) return
  
  addingResources.value = true
  try {
    // Фильтруем только ресурсы с количеством > 0
    const resourcesToAdd = newResources.value
      .filter(r => r.count > 0)
      .map(r => ({
        identificator: r.identificator,
        count: r.count,
        name: r.name
      }))

    console.log('Adding resources to player:', selectedPlayer.value.id)
    console.log('Resources:', resourcesToAdd)

    const url = `${import.meta.env.VITE_PROXY}/players/${selectedPlayer.value.id}/receive_from_masters`
    console.log('POST URL:', url)

    const response = await axios.post(url, {
      hashed_resources: resourcesToAdd
    })

    console.log('Response:', response.data)

    if (response.data.success) {
      // Сбрасываем форму
      newResources.value = allResources.value.map(r => ({ ...r, count: 0 }))
      
      // Перезагружаем ресурсы игрока
      await loadPlayerResources()
      
      // Можно добавить уведомление об успехе
      alert('Ресурсы успешно добавлены!')
    } else {
      alert('Ошибка при добавлении ресурсов: ' + (response.data.error || 'Неизвестная ошибка'))
    }
  } catch (error) {
    console.error('Error adding resources:', error)
    console.error('Error details:', error.response?.data)
    alert('Произошла ошибка при добавлении ресурсов: ' + (error.response?.data?.error || error.message))
  } finally {
    addingResources.value = false
  }
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

.resources-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.resource-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.add-resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.add-resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
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
