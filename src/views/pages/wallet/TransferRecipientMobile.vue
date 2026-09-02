<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  player: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'selected'])

const players = ref([])
const isLoading = ref(true)
const searchQuery = ref('')

const filteredPlayers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const others = players.value.filter(p => p.id !== props.player.id)
  if (!query) return others
  return others.filter(p => p.name?.toLowerCase().includes(query))
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

const handleBack = () => {
  emit('back')
}

const selectRecipient = (recipient) => {
  emit('selected', recipient)
}

onMounted(fetchPlayers)
</script>

<template>
  <VApp>
    <div class="recipient-header">
      <h1 class="recipient-title">Кому передать?</h1>
    </div>

    <VTextField
      v-model="searchQuery"
      placeholder="Поиск по имени"
      prepend-inner-icon="mdi-magnify"
      variant="solo"
      density="comfortable"
      clearable
      class="search-field mx-4"
    />

    <div v-if="isLoading" class="text-center pa-8">
      <VProgressCircular indeterminate color="primary" size="48" />
    </div>

    <div v-else class="recipients-list">
      <VCard
        v-for="recipient in filteredPlayers"
        :key="recipient.id"
        class="recipient-item"
        elevation="1"
        @click="selectRecipient(recipient)"
      >
        <div class="recipient-item-content">
          <VIcon icon="mdi-account-circle" size="36" color="#1976d2" />
          <div class="recipient-name">{{ recipient.name }}</div>
          <VIcon icon="mdi-chevron-right" size="24" color="grey" />
        </div>
      </VCard>

      <div v-if="!filteredPlayers.length" class="text-center pa-4 text-grey">
        Игроки не найдены
      </div>
    </div>

    <div style="height: 90px;"></div>

    <div class="floating-back-button">
      <VBtn
        @click="handleBack"
        color="#1976d2"
        block
        size="x-large"
        elevation="8"
        style="color: white !important; font-size: 20px !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: normal !important;"
      >
        Назад
      </VBtn>
    </div>
  </VApp>
</template>

<style scoped>
.recipient-header {
  text-align: center;
  padding: 24px 16px 8px;
}

.recipient-title {
  font-family: 'Monomakh', serif;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.recipients-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.recipient-item {
  cursor: pointer;
  border-radius: 12px !important;
}

.recipient-item:active {
  transform: scale(0.98);
}

.recipient-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.recipient-name {
  flex: 1;
  font-size: 17px;
}

.floating-back-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 12px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}
</style>
