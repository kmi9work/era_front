<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  player: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'transfer'])

const resourceCounts = ref({}) // { identificator: count }
const resourceNames = ref({}) // { identificator: name }
const isLoading = ref(true)

const walletItems = computed(() => {
  return Object.entries(resourceCounts.value)
    .filter(([, count]) => count > 0)
    .map(([identificator, count]) => ({
      identificator,
      count,
      name: resourceNames.value[identificator] || identificator
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const fetchResourceNames = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/resources/show_all_resources.json`)
    const names = {}
    response.data.forEach(res => {
      if (!names[res.identificator]) names[res.identificator] = res.name
    })
    resourceNames.value = names
  } catch (error) {
    console.error('Error fetching resource names:', error)
  }
}

const fetchWallet = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/players/${props.player.id}/show_players_resources.json`)
    resourceCounts.value = response.data
  } catch (error) {
    console.error('Error fetching player resources:', error)
  } finally {
    isLoading.value = false
  }
}

const handleBack = () => {
  emit('back')
}

const goToTransfer = () => {
  emit('transfer')
}

onMounted(async () => {
  await fetchResourceNames()
  await fetchWallet()
})

defineExpose({
  handleBack,
  refresh: fetchWallet
})
</script>

<template>
  <VApp>
    <div style="width: 100%; height: 100%;">
      <div class="wallet-header">
        <h1 class="wallet-title">Кошель</h1>
        <p class="wallet-subtitle">{{ player.name }}</p>
      </div>

      <div v-if="isLoading" class="text-center" style="padding: 32px;">
        <VProgressCircular indeterminate color="primary" size="64" />
      </div>

      <div v-else class="wallet-grid">
        <div v-for="item in walletItems" :key="item.identificator" class="wallet-card">
          <VImg
            :src="`/images/resources/${item.identificator}.png`"
            width="56"
            height="56"
            class="wallet-icon"
          />
          <div class="wallet-name">{{ item.name }}</div>
          <div class="wallet-count">{{ item.count }}</div>
        </div>

        <div v-if="!walletItems.length" class="wallet-empty">
          У вас пока нет ресурсов
        </div>
      </div>

      <div style="height: 90px;"></div>
    </div>

    <div class="floating-back-button-container">
      <div class="floating-back-button">
        <VRow class="ma-0" dense>
          <VCol cols="6" class="pa-0 pr-1">
            <VBtn
              @click="goToTransfer"
              color="#4caf50"
              block
              size="x-large"
              elevation="8"
              style="color: white !important; font-size: 20px !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: normal !important;"
            >
              Передать
            </VBtn>
          </VCol>
          <VCol cols="6" class="pa-0 pl-1">
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
          </VCol>
        </VRow>
      </div>
    </div>
  </VApp>
</template>

<style scoped>
.wallet-header {
  text-align: center;
  padding: 24px 16px 8px;
}

.wallet-title {
  font-family: 'Monomakh', serif;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
}

.wallet-subtitle {
  font-size: 15px;
  color: #666;
  margin-top: 4px;
}

.wallet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 16px;
}

.wallet-card {
  background: white;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.wallet-icon {
  flex-shrink: 0;
}

.wallet-name {
  font-size: 12px;
  text-align: center;
  color: #444;
}

.wallet-count {
  font-size: 18px;
  font-weight: 700;
  color: #1976d2;
}

.wallet-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #999;
  padding: 32px;
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
