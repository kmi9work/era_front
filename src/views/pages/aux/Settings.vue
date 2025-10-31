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

// Состояния для вассалов
const vassalIncomes = ref({})
const vassalCountries = ref([
  { id: 12, name: 'Новгород' },
  { id: 8, name: 'Пермь' },
  { id: 11, name: 'Тверь' },
  { id: 10, name: 'Рязань' }
])

// Состояния для типов союзов
const alliancesEnabled = ref(false)
const allianceTypes = ref([])
const isAllianceTypesLoading = ref(false)
const showAllianceTypeForm = ref(false)
const editingAllianceType = ref(null)
const allianceTypeForm = ref({
  name: '',
  min_relations_level: 0
})
const allianceTypeError = ref('')

// Загружаем текущее значение years_count
const loadSettings = async () => {
  try {
    isLoading.value = true
    const [yearsResponse, caravansResponse, statsResponse, vassalResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_years_count.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_caravans_per_guild.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_robbery_stats.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_vassalage_settings.json`)
    ])
    yearsCount.value = yearsResponse.data.years_count || 1
    caravansPerGuild.value = caravansResponse.data.caravans_per_guild || 1
    robbedCount.value = statsResponse.data.robbed_count || 0
    
    // Загружаем доходы от вассалов
    if (vassalResponse.data && vassalResponse.data.vassal_incomes) {
      vassalIncomes.value = vassalResponse.data.vassal_incomes
    }
  } catch (error) {
    console.error('Ошибка при загрузке настроек:', error)
    errorMessage.value = 'Не удалось загрузить настройки'
  } finally {
    isLoading.value = false
  }
}

// Загружаем флаг включения функционала союзов
const loadAlliancesEnabled = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/1.json`)
    alliancesEnabled.value = response.data.alliances_enabled || false
    if (alliancesEnabled.value) {
      await loadAllianceTypes()
    }
  } catch (error) {
    console.error('Ошибка при загрузке флага союзов:', error)
    alliancesEnabled.value = false
  }
}

// Функции для управления типами союзов
const loadAllianceTypes = async () => {
  try {
    isAllianceTypesLoading.value = true
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/alliance_types.json`)
    allianceTypes.value = response.data
  } catch (error) {
    console.error('Ошибка при загрузке типов союзов:', error)
    allianceTypeError.value = 'Не удалось загрузить типы союзов'
  } finally {
    isAllianceTypesLoading.value = false
  }
}

const openAllianceTypeForm = (type = null) => {
  editingAllianceType.value = type
  if (type) {
    allianceTypeForm.value = {
      name: type.name,
      min_relations_level: type.min_relations_level
    }
  } else {
    allianceTypeForm.value = {
      name: '',
      min_relations_level: 0
    }
  }
  showAllianceTypeForm.value = true
  allianceTypeError.value = ''
}

const closeAllianceTypeForm = () => {
  showAllianceTypeForm.value = false
  editingAllianceType.value = null
  allianceTypeForm.value = {
    name: '',
    min_relations_level: 0
  }
  allianceTypeError.value = ''
}

const saveAllianceType = async () => {
  try {
    allianceTypeError.value = ''
    
    if (!allianceTypeForm.value.name.trim()) {
      allianceTypeError.value = 'Название обязательно'
      return
    }

    if (editingAllianceType.value) {
      await axios.patch(
        `${import.meta.env.VITE_PROXY}/alliance_types/${editingAllianceType.value.id}.json`,
        {
          alliance_type: allianceTypeForm.value
        }
      )
    } else {
      await axios.post(
        `${import.meta.env.VITE_PROXY}/alliance_types.json`,
        {
          alliance_type: allianceTypeForm.value
        }
      )
    }
    
    await loadAllianceTypes()
    closeAllianceTypeForm()
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message
    allianceTypeError.value = errorMsg
  }
}

const deleteAllianceType = async (typeId) => {
  if (!confirm('Точно удалить тип союза?')) return
  
  try {
    await axios.delete(`${import.meta.env.VITE_PROXY}/alliance_types/${typeId}.json`)
    await loadAllianceTypes()
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message
    alert(`Ошибка: ${errorMsg}`)
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
      }),
      axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/update_vassalage_settings.json`, {
        vassal_incomes: vassalIncomes.value
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
  loadAlliancesEnabled()
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

        <!-- Настройка доходов от вассалов -->
        <div class="setting-item">
          <VLabel class="mb-3">
            Доходы от вассальной зависимости (руб.):
          </VLabel>
          
          <VRow dense>
            <VCol
              v-for="country in vassalCountries"
              :key="country.id"
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="vassalIncomes[country.id]"
                :label="country.name"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
                :disabled="isLoading"
                hint="Доход Казначея от вассала"
                persistent-hint
              />
            </VCol>
          </VRow>
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

    <!-- Секция "Типы союзов" -->
    <VCard v-if="alliancesEnabled" class="mt-4">
      <VCardTitle class="text-h5 mb-4">
        <VIcon icon="ri-group-line" class="me-2" />
        Типы союзов
      </VCardTitle>
      
      <VDivider />
      
      <VCardText>
        <div class="d-flex justify-space-between align-center mb-4">
          <VBtn
            color="primary"
            @click="openAllianceTypeForm(null)"
          >
            <VIcon icon="ri-add-line" class="me-2" />
            Добавить тип союза
          </VBtn>
        </div>

        <!-- Таблица типов союзов -->
        <v-table v-if="!isAllianceTypesLoading" density="compact">
          <thead>
            <tr>
              <th class="text-left">Название</th>
              <th class="text-left">Минимальный уровень отношений</th>
              <th class="text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="type in allianceTypes"
              :key="type.id"
            >
              <td>{{ type.name }}</td>
              <td>{{ type.min_relations_level }}</td>
              <td>
                <IconBtn
                  icon="ri-pencil-line"
                  color="primary"
                  @click="openAllianceTypeForm(type)"
                  title="Редактировать"
                />
                <IconBtn
                  icon="ri-delete-bin-line"
                  color="error"
                  @click="deleteAllianceType(type.id)"
                  title="Удалить"
                />
              </td>
            </tr>
            <tr v-if="allianceTypes.length === 0">
              <td colspan="3" class="text-center text-medium-emphasis">
                Нет типов союзов
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-else class="text-center pa-4">
          <VProgressCircular indeterminate color="primary" />
        </div>
      </VCardText>
    </VCard>

    <!-- Диалог добавления/редактирования типа союза -->
    <v-dialog
      v-model="showAllianceTypeForm"
      max-width="500"
    >
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center bg-primary">
          <span class="text-white">
            {{ editingAllianceType ? 'Редактировать тип союза' : 'Добавить тип союза' }}
          </span>
          <IconBtn
            icon="ri-close-line"
            color="white"
            @click="closeAllianceTypeForm"
          />
        </v-card-title>
        
        <v-divider />
        
        <v-card-text class="pa-4">
          <VAlert
            v-if="allianceTypeError"
            type="error"
            variant="tonal"
            class="mb-4"
            dismissible
            @click:close="allianceTypeError = ''"
          >
            {{ allianceTypeError }}
          </VAlert>

          <VTextField
            v-model="allianceTypeForm.name"
            label="Название"
            variant="outlined"
            density="compact"
            class="mb-3"
          />

          <VTextField
            v-model.number="allianceTypeForm.min_relations_level"
            type="number"
            label="Минимальный уровень отношений"
            variant="outlined"
            density="compact"
            min="0"
            max="2"
            hint="От 0 до 2"
            persistent-hint
          />
        </v-card-text>
        
        <v-divider />
        
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="closeAllianceTypeForm"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveAllianceType"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

