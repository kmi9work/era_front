<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'

const qrCodeUrl = ref('')
const mobileUrl = `${window.location.origin}/noble_helper.html`

const generateQRCode = async () => {
  try {
    const canvas = document.getElementById('qr-canvas-noble')
    await QRCode.toCanvas(canvas, mobileUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
  }
}

const copyLink = () => {
  navigator.clipboard.writeText(mobileUrl)
  alert('Ссылка скопирована в буфер обмена!')
}

const openInNewTab = () => {
  window.open(mobileUrl, '_blank')
}

onMounted(() => {
  generateQRCode()
})
</script>

<template>
  <VContainer>
    <VRow justify="center">
      <VCol cols="12" md="8" lg="6">
        <VCard class="pa-6">
          <VCardTitle class="text-center text-h4 mb-4">
            <VIcon icon="ri-smartphone-line" size="36" class="mr-2" color="primary" />
            Помощник знати
          </VCardTitle>

          <VCardText>
            <div class="text-center mb-6">
              <p class="text-h6 mb-2">Отсканируйте QR-код на телефоне</p>
              <p class="text-body-2 text-medium-emphasis">
                или скопируйте ссылку для доступа к помощнику знати
              </p>
            </div>

            <!-- QR Code -->
            <div class="d-flex justify-center mb-6">
              <VCard class="pa-4" elevation="3">
                <canvas id="qr-canvas-noble"></canvas>
              </VCard>
            </div>

            <!-- Ссылка -->
            <VCard class="mb-4" variant="tonal" color="primary">
              <VCardText>
                <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                  <div class="flex-grow-1" style="min-width: 0;">
                    <div class="text-caption text-medium-emphasis mb-1">Ссылка для мобильного устройства:</div>
                    <div class="text-body-1 font-weight-medium text-break">
                      {{ mobileUrl }}
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <!-- Кнопки -->
            <VRow dense>
              <VCol cols="12" sm="6">
                <VBtn
                  @click="copyLink"
                  block
                  size="large"
                  color="primary"
                  prepend-icon="ri-file-copy-line"
                >
                  Скопировать ссылку
                </VBtn>
              </VCol>
              <VCol cols="12" sm="6">
                <VBtn
                  @click="openInNewTab"
                  block
                  size="large"
                  color="secondary"
                  prepend-icon="ri-external-link-line"
                >
                  Открыть в новой вкладке
                </VBtn>
              </VCol>
            </VRow>

            <!-- Инструкция -->
            <VCard class="mt-6" variant="outlined">
              <VCardTitle class="text-h6">
                <VIcon icon="ri-information-line" class="mr-2" />
                Как использовать:
              </VCardTitle>
              <VCardText>
                <ol class="pl-4">
                  <li class="mb-2">
                    <strong>На телефоне:</strong> Откройте камеру и наведите на QR-код
                  </li>
                  <li class="mb-2">
                    <strong>Или:</strong> Скопируйте ссылку и отправьте на телефон через мессенджер
                  </li>
                  <li class="mb-2">
                    <strong>Убедитесь:</strong> Телефон и компьютер подключены к одной WiFi сети
                  </li>
                  <li>
                    <strong>Готово!</strong> Используйте помощник знати для управления
                  </li>
                </ol>
              </VCardText>
            </VCard>

            <!-- Особенности -->
            <VCard class="mt-4" variant="outlined" color="success">
              <VCardTitle class="text-h6">
                <VIcon icon="ri-check-line" class="mr-2" />
                Возможности помощника знати:
              </VCardTitle>
              <VCardText>
                <VChip class="ma-1" color="success" size="small">Просмотр армий</VChip>
                <VChip class="ma-1" color="success" size="small">Политические действия</VChip>
                <VChip class="ma-1" color="success" size="small">Управление владениями</VChip>
                <VChip class="ma-1" color="success" size="small">Сенсорное управление</VChip>
                <VChip class="ma-1" color="success" size="small">Красивый интерфейс</VChip>
                <VChip class="ma-1" color="success" size="small">Автономная работа</VChip>
              </VCardText>
            </VCard>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped>
.text-break {
  word-break: break-all;
}

ol li {
  line-height: 1.6;
}

#qr-canvas-noble {
  display: block;
}
</style>

