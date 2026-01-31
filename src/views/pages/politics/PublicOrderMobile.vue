<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const emit = defineEmits(['back'])

const regions = ref([])
const isLoading = ref(true)

async function loadRegions() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=0`)
    regions.value = response.data
  } catch (error) {
    console.error('Ошибка при загрузке регионов:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRegions()
})

const handleBack = () => {
  emit('back')
}

defineExpose({
  handleBack
})
</script>

<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-btn icon @click="handleBack">
        <VIcon>mdi-arrow-left</VIcon>
      </v-btn>
      <v-toolbar-title>Общественный порядок</v-toolbar-title>
    </v-app-bar>

    <v-main style="padding-bottom: 80px;">
      <div v-if="isLoading" class="text-center" style="padding: 32px;">
        <VProgressCircular indeterminate color="primary" size="64" />
      </div>

      <div v-else>
        <v-card v-if="regions.length === 0" class="ma-3 text-center pa-8">
          <VIcon size="64" color="grey">ri-shield-check-line</VIcon>
          <div class="mt-4 text-grey">Нет данных</div>
        </v-card>

        <div v-else class="pa-3">
          <v-card
            v-for="region in regions"
            :key="region.id"
            class="mb-3"
          >
            <v-card-text class="d-flex justify-space-between align-center pa-4">
              <span class="text-h6">{{ region.name }}</span>
              <v-chip color="primary" size="large">
                {{ region.show_overall_po }}
              </v-chip>
            </v-card-text>
          </v-card>
        </div>
      </div>
      
      <!-- Фиксированная кнопка Назад -->
      <div class="back-button-fixed">
        <v-btn
          block
          color="primary"
          size="large"
          prepend-icon="mdi-arrow-left"
          @click="handleBack"
        >
          Назад
        </v-btn>
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.back-button-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
</style>

