<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// Состояния
const yearsCount = ref(1)
const caravansPerGuild = ref(1)
const robbedCount = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Загружаем текущее значение years_count
const loadSettings = async () => {
  try {
    isLoading.value = true
    const [yearsResponse, caravansResponse, statsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_years_count.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_caravans_per_guild.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_robbery_stats.json`)
    ])
    yearsCount.value = yearsResponse.data.years_count || 1
    caravansPerGuild.value = caravansResponse.data.caravans_per_guild || 1
    robbedCount.value = statsResponse.data.robbed_count || 0
  } catch (error) {
    console.error('Ошибка при загрузке настроек:', error)
    errorMessage.value = 'Не удалось загрузить настройки'
  } finally {
    isLoading.value = false
  }
}

// Сохраняем настройки
const saveSettings = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    await Promise.all([
      axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/update_years_count.json`, {
        years_count: yearsCount.value
      }),
      axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/update_caravans_per_guild.json`, {
        caravans_per_guild: caravansPerGuild.value
      })
    ])
    
    successMessage.value = 'Настройки успешно сохранены'
    
    // Скрываем сообщение об успехе через 3 секунды
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Ошибка при сохранении настроек:', error)
    errorMessage.value = 'Не удалось сохранить настройки'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="settings-container">
    <VCard>
      <VCardTitle class="text-h5 mb-4">
        <VIcon icon="ri-settings-3-line" class="me-2" />
        Настройки игры
      </VCardTitle>
      
      <VDivider />
      
      <VCardText>
        <!-- Сообщения об ошибках и успехе -->
        <VAlert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          dismissible
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </VAlert>
        
        <VAlert
          v-if="successMessage"
          type="success"
          variant="tonal"
          class="mb-4"
        >
          {{ successMessage }}
        </VAlert>

        <!-- Настройка лет в игре -->
        <div class="setting-item">
          <VLabel class="mb-2">
            Количество лет:
          </VLabel>
          
          <VTextField
            v-model.number="yearsCount"
            type="number"
            min="1"
            max="10"
            variant="outlined"
            density="compact"
            :disabled="isLoading"
            hint="Установите, сколько лет будет в игре"
            persistent-hint
          />
        </div>

        <!-- Настройка количества караванов в гильдии -->
        <div class="setting-item">
          <VLabel class="mb-2">
            Количество караванов в гильдии:
          </VLabel>
          
          <VTextField
            v-model.number="caravansPerGuild"
            type="number"
            min="1"
            max="20"
            variant="outlined"
            density="compact"
            :disabled="isLoading"
            hint="Установите, сколько караванов может иметь гильдия"
            persistent-hint
          />
        </div>

        <!-- Статистика ограблений -->
        <div class="setting-item">
          <VLabel class="mb-2">
            Статистика ограблений:
          </VLabel>
          
          <VCard variant="outlined" color="warning">
            <VCardText>
              <div class="text-body-1">
                Ограблено караванов в текущем году: <strong>{{ robbedCount }}</strong>
              </div>
            </VCardText>
          </VCard>
        </div>
          
        <VBtn
          color="primary"
          class="mt-4"
          :loading="isLoading"
          @click="saveSettings"
        >
          <VIcon icon="ri-save-line" class="me-2" />
          Сохранить настройки
        </VBtn>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 16px;
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item:last-child {
  margin-bottom: 0;
}
</style>

