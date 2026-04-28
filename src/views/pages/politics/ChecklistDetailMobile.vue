<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const emit = defineEmits(['back'])

const props = defineProps({
  checklistId: {
    type: Number,
    required: true
  }
})

const checklist = ref(null)
const isLoading = ref(true)

async function loadChecklist() {
  try {
    isLoading.value = true
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/vassals_and_robbers/checklists.json`)
    console.log('Загружаем чек-лист с ID:', props.checklistId)
    console.log('Все чек-листы:', response.data)
    const found = response.data.find(c => c.id === props.checklistId)
    if (found) {
      console.log('Найден чек-лист:', found)
      checklist.value = found
    } else {
      console.error('Чек-лист не найден для ID:', props.checklistId)
    }
  } catch (error) {
    console.error('Ошибка при загрузке чек-листа:', error)
  } finally {
    isLoading.value = false
  }
}

function getConditionColor(condition) {
  return condition.is_completed ? 'success' : 'error'
}

function getProgressColor(percentage) {
  if (percentage === 100) return 'success'
  if (percentage >= 50) return 'warning'
  return 'error'
}

const progressColor = computed(() => {
  if (!checklist.value) return 'primary'
  return getProgressColor(checklist.value.completion_percentage || 0)
})

onMounted(async () => {
  await loadChecklist()
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
      <v-toolbar-title>Чек-лист</v-toolbar-title>
    </v-app-bar>

    <v-main style="padding-bottom: 80px;">
      <div v-if="isLoading" class="text-center" style="padding: 32px;">
        <VProgressCircular indeterminate color="primary" size="64" />
      </div>

      <div v-else-if="!checklist" class="text-center pa-8">
        <VIcon size="64" color="grey">ri-error-warning-line</VIcon>
        <div class="mt-4 text-h6">Чек-лист не найден</div>
      </div>

      <div v-else class="pa-4">
        <!-- Название страны -->
        <div class="text-center mb-6">
          <h1 class="country-name">{{ checklist.vassal_country?.name || 'Неизвестно' }}</h1>
          <v-chip
            :color="progressColor"
            size="large"
            class="mt-2"
          >
            {{ checklist.completion_percentage || 0 }}%
          </v-chip>
        </div>

        <!-- Прогресс-бар -->
        <v-card class="mb-6" elevation="2">
          <v-card-text class="pa-4">
            <div class="mb-2 text-caption text-medium-emphasis">Прогресс выполнения</div>
            <VProgressLinear
              :model-value="checklist.completion_percentage || 0"
              :color="progressColor"
              height="16"
              rounded
              class="mb-2"
            />
            <div class="text-caption text-center">
              {{ checklist.completed_count || 0 }} из {{ checklist.total_count || 0 }} условий выполнено
            </div>
          </v-card-text>
        </v-card>

        <!-- Список условий -->
        <v-card elevation="2">
          <v-card-title class="text-h6 pa-4">
            Условия
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list>
              <v-list-item
                v-for="(condition, index) in checklist.conditions"
                :key="index"
                :class="{'condition-item': true, 'condition-completed': condition.is_completed, 'condition-failed': !condition.is_completed}"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="getConditionColor(condition)"
                    size="40"
                    class="mr-3"
                  >
                    <VIcon
                      :icon="condition.is_completed ? 'mdi-check' : 'mdi-close'"
                      color="white"
                      size="24"
                    />
                  </v-avatar>
                </template>

                <v-list-item-title class="text-h6 mb-1">
                  {{ condition.description }}
                </v-list-item-title>

                <v-list-item-subtitle v-if="condition.requirement !== undefined" class="text-body-1">
                  <div class="mt-2">
                    <v-chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      class="mr-2"
                    >
                      Требуется: {{ condition.requirement }}
                    </v-chip>
                    <v-chip
                      size="small"
                      :color="condition.is_completed ? 'success' : 'error'"
                      variant="outlined"
                    >
                      Текущее: {{ condition.current_value }}
                    </v-chip>
                  </div>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </div>
      
      <!-- Фиксированные кнопки -->
      <div class="back-button-fixed">
        <div class="d-flex gap-2">
          <v-btn
            color="secondary"
            size="large"
            prepend-icon="mdi-refresh"
            @click="loadChecklist"
            :loading="isLoading"
            class="flex-grow-1"
          >
            Обновить
          </v-btn>
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-arrow-left"
            @click="handleBack"
            class="flex-grow-1"
          >
            Назад
          </v-btn>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.country-name {
  font-size: 32px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
}

.condition-item {
  padding: 16px !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  transition: background-color 0.2s;
}

.condition-item:last-child {
  border-bottom: none;
}

.condition-completed {
  background-color: rgba(76, 175, 80, 0.05);
}

.condition-failed {
  background-color: rgba(244, 67, 54, 0.05);
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

