<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// Состояния
const yearsCount = ref(1)
const guilds = ref([])
const robberySettings = ref({
  robbery_by_year: {},
  protected_guilds_by_year: {}
})
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Загружаем years_count
const loadYearsCount = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_years_count.json`)
    yearsCount.value = response.data.years_count || 1
  } catch (error) {
    console.error('Ошибка при загрузке years_count:', error)
  }
}

// Загружаем список гильдий
const loadGuilds = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/guilds/list.json`)
    guilds.value = response.data
  } catch (error) {
    console.error('Ошибка при загрузке гильдий:', error)
    errorMessage.value = 'Не удалось загрузить список гильдий'
  }
}

// Загружаем текущие настройки
const loadSettings = async () => {
  try {
    isLoading.value = true
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_caravan_robbery_settings.json`)
    robberySettings.value = {
      robbery_by_year: response.data.robbery_by_year || {},
      protected_guilds_by_year: response.data.protected_guilds_by_year || {}
    }
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
    
    await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/update_caravan_robbery_settings.json`, 
      robberySettings.value
    )
    
    successMessage.value = 'Настройки успешно сохранены'
    
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

// Инициализация значения для года
const initYearValue = (year, defaultValue) => {
  const key = year.toString()
  if (robberySettings.value.robbery_by_year && robberySettings.value.robbery_by_year[key] === undefined) {
    if (!robberySettings.value.robbery_by_year) {
      robberySettings.value.robbery_by_year = {}
    }
    robberySettings.value.robbery_by_year[key] = defaultValue
  }
}

// Инициализация защищенных гильдий для года
const initProtectedGuilds = (year) => {
  const key = year.toString()
  if (!robberySettings.value.protected_guilds_by_year[key]) {
    if (!robberySettings.value.protected_guilds_by_year) {
      robberySettings.value.protected_guilds_by_year = {}
    }
    robberySettings.value.protected_guilds_by_year[key] = []
  }
}

// Получить значение для года
const getRobberyCount = (year) => {
  return robberySettings.value.robbery_by_year?.[year.toString()] || 0
}

// Установить значение для года
const setRobberyCount = (year, value) => {
  const key = year.toString()
  if (!robberySettings.value.robbery_by_year) {
    robberySettings.value.robbery_by_year = {}
  }
  robberySettings.value.robbery_by_year[key] = parseInt(value) || 0
}

// Проверка, защищена ли гильдия
const isProtected = (year, guildId) => {
  return robberySettings.value.protected_guilds_by_year?.[year.toString()]?.includes(guildId) || false
}

// Переключение защиты гильдии
const toggleProtected = (year, guildId) => {
  const key = year.toString()
  if (!robberySettings.value.protected_guilds_by_year) {
    robberySettings.value.protected_guilds_by_year = {}
  }
  if (!robberySettings.value.protected_guilds_by_year[key]) {
    robberySettings.value.protected_guilds_by_year[key] = []
  }
  
  const index = robberySettings.value.protected_guilds_by_year[key].indexOf(guildId)
  if (index > -1) {
    robberySettings.value.protected_guilds_by_year[key].splice(index, 1)
  } else {
    robberySettings.value.protected_guilds_by_year[key].push(guildId)
  }
}

// Генерация массива лет
const years = computed(() => {
  return Array.from({ length: yearsCount.value }, (_, i) => i + 1)
})

onMounted(async () => {
  await loadYearsCount()
  await loadGuilds()
  await loadSettings()
})
</script>

<template>
  <div class="caravan-robbery-container">
    <VCard>
      <VCardTitle class="text-h5 mb-4">
        <VIcon icon="ri-skull-line" class="me-2" />
        Настройки ограбления караванов
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

        <!-- Настройки для каждого года -->
        <div 
          v-for="year in years" 
          :key="year"
          class="year-settings mb-6"
        >
          <VCard variant="outlined">
            <VCardTitle class="text-h6">
              Год {{ year }}
            </VCardTitle>
            
            <VCardText>
              <!-- Количество караванов для ограбления -->
              <VRow>
                <VCol cols="12" md="6">
                  <VTextField
                    :model-value="getRobberyCount(year)"
                    @update:model-value="setRobberyCount(year, $event)"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="compact"
                    :label="`Количество караванов для ограбления`"
                    :disabled="isLoading"
                  />
                </VCol>
              </VRow>

              <!-- Защищенные гильдии -->
              <div class="mt-4">
                <VLabel class="mb-2">Не грабить гильдии:</VLabel>
                <VRow>
                  <VCol 
                    v-for="guild in guilds" 
                    :key="guild.id"
                    cols="12" 
                    sm="6" 
                    md="4"
                  >
                    <VCheckbox
                      :model-value="isProtected(year, guild.id)"
                      @update:model-value="toggleProtected(year, guild.id)"
                      :label="guild.name"
                      :disabled="isLoading"
                      hide-details
                      color="success"
                    />
                  </VCol>
                </VRow>
              </div>
            </VCardText>
          </VCard>
        </div>

        <!-- Кнопка сохранения -->
        <VBtn
          color="primary"
          size="large"
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
.caravan-robbery-container {
  padding: 16px;
}

.year-settings {
  margin-bottom: 24px;
}

.year-settings:last-of-type {
  margin-bottom: 0;
}
</style>


