<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ChecklistDetailMobile from './ChecklistDetailMobile.vue'

const emit = defineEmits(['back'])

const checklists = ref([])
const isLoading = ref(true)
const selectedChecklistId = ref(null)
const error = ref(null)

async function loadChecklists() {
  try {
    error.value = null
    isLoading.value = true
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/vassals_and_robbers/checklists.json`)
    console.log('Загружены чек-листы:', response.data)
    checklists.value = Array.isArray(response.data) ? response.data : []
    console.log('Отфильтрованные чек-листы с vassal_country:', checklists.value.filter(c => c.vassal_country))
  } catch (err) {
    console.error('Ошибка при загрузке чек-листов:', err)
    error.value = err.response?.data?.error || err.message || 'Не удалось загрузить чек-листы'
    checklists.value = []
  } finally {
    isLoading.value = false
  }
}

function getProgressColor(percentage) {
  if (percentage === 100) return 'success'
  if (percentage >= 50) return 'warning'
  return 'error'
}

function openChecklist(checklistId) {
  console.log('Открываем чек-лист:', checklistId)
  selectedChecklistId.value = checklistId
}

function backToList() {
  selectedChecklistId.value = null
}

onMounted(async () => {
  await loadChecklists()
})

const handleBack = () => {
  if (selectedChecklistId.value) {
    backToList()
  } else {
    emit('back')
  }
}

defineExpose({
  handleBack
})
</script>

<template>
  <v-app>
    <!-- Детальная страница чек-листа -->
    <ChecklistDetailMobile
      v-if="selectedChecklistId"
      :checklist-id="selectedChecklistId"
      @back="backToList"
    />

    <!-- Список чек-листов -->
    <template v-else>
      <v-app-bar color="primary" dark>
        <v-btn icon @click="handleBack">
          <VIcon>mdi-arrow-left</VIcon>
        </v-btn>
        <v-toolbar-title>Чек-листы</v-toolbar-title>
      </v-app-bar>

      <v-main style="padding-bottom: 80px;">
        <div v-if="isLoading" class="text-center" style="padding: 32px;">
          <VProgressCircular indeterminate color="primary" size="64" />
        </div>

        <div v-else-if="error" class="pa-3">
          <v-alert type="error" class="mb-3">
            {{ error }}
          </v-alert>
          <v-btn block color="primary" @click="loadChecklists">
            Попробовать снова
          </v-btn>
        </div>

        <div v-else class="pa-3">
          <div v-if="checklists.length === 0" class="text-center pa-8">
            <VIcon size="64" color="grey">ri-checkbox-multiple-line</VIcon>
            <div class="mt-4 text-grey">Нет чек-листов</div>
          </div>

          <template v-else-if="checklists.filter(c => c.vassal_country).length === 0">
            <div class="text-center pa-8">
              <VIcon size="64" color="grey">ri-checkbox-multiple-line</VIcon>
              <div class="mt-4 text-grey">Нет чек-листов с вассальными странами</div>
            </div>
          </template>

          <template v-else>
            <v-card
              v-for="checklist in checklists.filter(c => c.vassal_country)"
              :key="checklist.id"
              class="mb-3 checklist-card"
              elevation="2"
              @click.stop="openChecklist(checklist.id)"
              style="cursor: pointer;"
            >
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <h2 class="text-h5 mb-0">{{ checklist.vassal_country?.name || 'Неизвестно' }}</h2>
                <v-chip
                  :color="getProgressColor(checklist.completion_percentage || 0)"
                  size="large"
                >
                  {{ checklist.completion_percentage || 0 }}%
                </v-chip>
              </div>

              <!-- Прогресс-бар -->
              <VProgressLinear
                :model-value="checklist.completion_percentage || 0"
                :color="getProgressColor(checklist.completion_percentage || 0)"
                height="12"
                rounded
                class="mb-2"
              />

              <div class="d-flex align-center justify-space-between mt-2">
                <span class="text-caption text-medium-emphasis">
                  {{ checklist.completed_count || 0 }} / {{ checklist.total_count || 0 }} условий
                </span>
                <VIcon color="primary">mdi-chevron-right</VIcon>
              </div>
            </v-card-text>
          </v-card>
          </template>
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
    </template>
  </v-app>
</template>

<style scoped>
.checklist-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.checklist-card:active {
  transform: scale(0.98);
}

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
