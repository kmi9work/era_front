<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useWalletPlayerStore } from '@/stores/walletPlayer'

const walletPlayerStore = useWalletPlayerStore()

const players = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const confirmDialogPlayer = ref(null)

const filteredPlayers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return players.value
  return players.value.filter(p => p.name?.toLowerCase().includes(query))
})

const fetchPlayers = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/players.json`)
    players.value = response.data
  } catch (error) {
    console.error('Error fetching players:', error)
  } finally {
    isLoading.value = false
  }
}

const askConfirmation = (player) => {
  confirmDialogPlayer.value = player
}

const cancelConfirmation = () => {
  confirmDialogPlayer.value = null
}

const confirmSelection = () => {
  const player = confirmDialogPlayer.value
  walletPlayerStore.setPlayer({
    id: player.id,
    name: player.name,
    identificator: player.identificator
  })
  confirmDialogPlayer.value = null
}

onMounted(fetchPlayers)
</script>

<template>
  <VContainer fluid class="pa-0">
    <div class="select-container">
      <div class="select-header">
        <h1 class="select-title">Кто вы?</h1>
        <p class="select-subtitle">Выберите игрока, за которого будете играть с этого устройства.<br>Сменить его потом будет нельзя.</p>
      </div>

      <VTextField
        v-model="searchQuery"
        placeholder="Поиск по имени"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        density="comfortable"
        clearable
        class="search-field"
      />

      <div v-if="isLoading" class="text-center pa-8">
        <VProgressCircular indeterminate color="white" size="48" />
      </div>

      <div v-else class="players-list">
        <VCard
          v-for="player in filteredPlayers"
          :key="player.id"
          class="player-item"
          elevation="2"
          @click="askConfirmation(player)"
        >
          <div class="player-item-content">
            <VIcon icon="mdi-account-circle" size="40" color="white" />
            <div class="player-name">{{ player.name }}</div>
            <VIcon icon="mdi-chevron-right" size="28" color="white" />
          </div>
        </VCard>

        <div v-if="!filteredPlayers.length" class="text-center pa-4" style="color: white;">
          Игроки не найдены
        </div>
      </div>
    </div>

    <VDialog :model-value="!!confirmDialogPlayer" max-width="400" persistent>
      <VCard v-if="confirmDialogPlayer">
        <VCardTitle>Подтверждение</VCardTitle>
        <VCardText>
          Вы играете за «{{ confirmDialogPlayer.name }}»?<br>
          Сменить игрока после подтверждения будет нельзя.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="cancelConfirmation">Отмена</VBtn>
          <VBtn color="primary" variant="flat" @click="confirmSelection">Подтвердить</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>

<style scoped>
.select-container {
  min-height: 100vh;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
    url('@/assets/images/merchant_helper_background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding: 24px 16px;
}

.select-header {
  text-align: center;
  margin-bottom: 16px;
  padding-top: 40px;
}

.select-title {
  font-family: 'Monomakh', serif;
  font-size: 34px;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
}

.select-subtitle {
  font-size: 14px;
  color: white;
  margin-top: 8px;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.8);
}

.search-field {
  max-width: 600px;
  margin: 0 auto 16px;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
}

.player-item {
  cursor: pointer;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.25) !important;
}

.player-item:active {
  transform: scale(0.98);
}

.player-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.player-name {
  flex: 1;
  color: white;
  font-family: 'Monomakh', serif;
  font-size: 20px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}
</style>
