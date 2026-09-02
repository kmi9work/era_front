<script setup>
import { ref } from 'vue'
import axios from 'axios'

const props = defineProps({
  player: {
    type: Object,
    required: true
  },
  recipient: {
    type: Object,
    required: true
  },
  basket: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['back', 'done'])

const isSending = ref(false)
const errorMessage = ref('')

const handleBack = () => {
  emit('back')
}

const confirmTransfer = async () => {
  isSending.value = true
  errorMessage.value = ''
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_PROXY}/players/${props.player.id}/exchange_resources.json`,
      {
        request: {
          with_whom: props.recipient.identificator,
          hashed_resources: props.basket
        }
      }
    )

    if (response.data.success) {
      emit('done')
    } else {
      errorMessage.value = response.data.error || 'Не удалось передать ресурсы'
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Не удалось передать ресурсы'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <VApp>
    <div class="confirm-header">
      <h1 class="confirm-title">Подтверждение</h1>
      <p class="confirm-recipient">Кому: <strong>{{ recipient.name }}</strong></p>
    </div>

    <div class="confirm-list">
      <VCard v-for="item in basket" :key="item.identificator" class="confirm-item" elevation="1">
        <div class="confirm-item-content">
          <VImg :src="`/images/resources/${item.identificator}.png`" width="40" height="40" />
          <div class="confirm-item-name">{{ item.name }}</div>
          <div class="confirm-item-count">{{ item.count }}</div>
        </div>
      </VCard>
    </div>

    <VAlert v-if="errorMessage" type="error" class="mx-4 mt-2" density="compact">
      {{ errorMessage }}
    </VAlert>

    <div style="height: 90px;"></div>

    <div class="floating-back-button">
      <VRow class="ma-0" dense>
        <VCol cols="6" class="pa-0 pr-1">
          <VBtn
            :loading="isSending"
            @click="confirmTransfer"
            color="#4caf50"
            block
            size="x-large"
            elevation="8"
            style="color: white !important; font-size: 20px !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: normal !important;"
          >
            Подтвердить
          </VBtn>
        </VCol>
        <VCol cols="6" class="pa-0 pl-1">
          <VBtn
            :disabled="isSending"
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
  </VApp>
</template>

<style scoped>
.confirm-header {
  text-align: center;
  padding: 24px 16px 8px;
}

.confirm-title {
  font-family: 'Monomakh', serif;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.confirm-recipient {
  font-size: 16px;
  color: #444;
  margin-top: 6px;
}

.confirm-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.confirm-item {
  border-radius: 12px !important;
}

.confirm-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
}

.confirm-item-name {
  flex: 1;
  font-size: 15px;
}

.confirm-item-count {
  font-size: 18px;
  font-weight: 700;
  color: #1976d2;
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
