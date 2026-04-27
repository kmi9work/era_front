<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

const emit = defineEmits(['back'])

const checklists = ref([])
const vassalIncomes = ref({})
const isLoading = ref(true)
const pollInterval = ref(null)

async function loadChecklists() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/vassals_and_robbers/checklists.json`)
    checklists.value = response.data
  } catch (error) {
    console.error('Ошибка при загрузке чек-листов:', error)
  }
}

async function loadVassalageSettings() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters.json`)
    const vassalageSettings = response.data.find(gp => gp.identificator === 'vassalage_settings')
    if (vassalageSettings && vassalageSettings.params && vassalageSettings.params.vassal_incomes) {
      vassalIncomes.value = vassalageSettings.params.vassal_incomes
    }
  } catch (error) {
    console.error('Ошибка при загрузке настроек вассалитета:', error)
  }
}

function getConditionColor(condition) {
  if (condition.is_completed) {
    return 'success'
  } else {
    return 'error'
  }
}

function getProgressColor(percentage) {
  if (percentage === 100) return 'success'
  if (percentage >= 50) return 'warning'
  return 'error'
}

async function establishVassalage(checklist) {
  const income = vassalIncomes.value[checklist.vassal_country.id]
  const countryName = checklist.vassal_country.name
  
  let confirmMessage = `Установить вассалитет с ${countryName}?\nДоход Казначея увеличится на ${income?.toLocaleString('ru-RU') || income} руб.`
  
  // Добавляем предупреждение, если не все условия выполнены
  if (checklist.completion_percentage !== 100) {
    confirmMessage = `⚠️ ВНИМАНИЕ: Не все условия чек-листа выполнены!\n${confirmMessage}`
  }
  
  if (!confirm(confirmMessage)) {
    return
  }

  try {
    await axios.post(`${import.meta.env.VITE_PROXY}/vassals_and_robbers/checklists/${checklist.id}/establish_vassalage`)
    alert(`Вассалитет с ${countryName} установлен!\nДоход Казначея увеличен на ${income?.toLocaleString('ru-RU') || income} руб.`)
    // Обновляем список чек-листов
    loadChecklists()
  } catch (error) {
    console.error('Ошибка при установке вассалитета:', error)
    alert('Ошибка при установке вассалитета: ' + (error.response?.data?.error || error.message))
  }
}

async function removeVassalage(checklist) {
  const income = vassalIncomes.value[checklist.vassal_country.id]
  const countryName = checklist.vassal_country.name
  
  if (!confirm(`Снять вассалитет с ${countryName}?\nДоход Казначея уменьшится на ${income?.toLocaleString('ru-RU') || income} руб.`)) {
    return
  }

  try {
    await axios.post(`${import.meta.env.VITE_PROXY}/vassals_and_robbers/checklists/${checklist.id}/remove_vassalage`)
    alert(`Вассалитет с ${countryName} снят!\nДоход Казначея уменьшен на ${income?.toLocaleString('ru-RU') || income} руб.`)
    // Обновляем список чек-листов
    loadChecklists()
  } catch (error) {
    console.error('Ошибка при снятии вассалитета:', error)
    alert('Ошибка при снятии вассалитета: ' + (error.response?.data?.error || error.message))
  }
}

onMounted(async () => {
  isLoading.value = true
  await loadVassalageSettings()
  await loadChecklists()
  isLoading.value = false
  
  // Автообновление каждые 10 секунд
  pollInterval.value = setInterval(() => {
    loadChecklists()
  }, 10000)
})

onBeforeUnmount(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
  }
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
      <v-toolbar-title>Чек-листы</v-toolbar-title>
    </v-app-bar>

    <v-main style="padding-bottom: 80px;">
      <div v-if="isLoading" class="text-center" style="padding: 32px;">
        <VProgressCircular indeterminate color="primary" size="64" />
      </div>

      <div v-else class="pa-3">
        <template v-for="checklist in checklists" :key="checklist.id">
          <v-card
            v-if="checklist.vassal_country"
            class="mb-3"
          >
            <v-card-item>
              <v-card-title class="d-flex align-center justify-space-between flex-wrap">
                <div class="d-flex align-center gap-2 mb-2">
                  <span>{{ checklist.vassal_country?.name || 'Неизвестно' }}</span>
                  <VBtn
                    v-if="!checklist.vassalage_established"
                    color="success"
                    variant="outlined"
                    size="small"
                    @click="establishVassalage(checklist)"
                  >
                    Установить вассалитет
                  </VBtn>
                  <VBtn
                    v-if="checklist.vassalage_established"
                    color="error"
                    variant="outlined"
                    size="small"
                    @click="removeVassalage(checklist)"
                  >
                    Снять вассалитет
                  </VBtn>
                </div>
                <VChip
                  :color="getProgressColor(checklist.completion_percentage || 0)"
                  size="small"
                >
                  {{ checklist.completion_percentage || 0 }}%
                </VChip>
              </v-card-title>
            </v-card-item>

            <v-card-text>
              <!-- Прогресс-бар -->
              <VProgressLinear
                :model-value="checklist.completion_percentage || 0"
                :color="getProgressColor(checklist.completion_percentage || 0)"
                height="8"
                rounded
                class="mb-4"
              />

              <!-- Список условий -->
              <VList density="compact">
                <VListItem
                  v-for="(condition, index) in checklist.conditions"
                  :key="index"
                  :class="{'px-0': true, 'condition-completed': condition.is_completed}"
                >
                  <template v-slot:prepend>
                    <VIcon
                      :icon="condition.is_completed ? 'mdi-check-circle' : 'mdi-close-circle'"
                      :color="getConditionColor(condition)"
                      size="24"
                    />
                  </template>

                  <VListItemTitle>
                    {{ condition.description }}
                  </VListItemTitle>

                  <VListItemSubtitle v-if="condition.requirement !== undefined">
                    Требуется: {{ condition.requirement }} | 
                    Текущее: <strong>{{ condition.current_value }}</strong>
                  </VListItemSubtitle>

                  <template v-if="!condition.is_completed && condition.current_value !== undefined">
                    <VListItemSubtitle class="text-error">
                      Не выполнено
                    </VListItemSubtitle>
                  </template>
                </VListItem>
              </VList>
            </v-card-text>
          </v-card>
        </template>

        <div v-if="checklists.length === 0" class="text-center pa-8">
          <VIcon size="64" color="grey">ri-checkbox-multiple-line</VIcon>
          <div class="mt-4 text-grey">Нет чек-листов</div>
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
.condition-completed {
  background-color: rgba(76, 175, 80, 0.08);
  border-left: 3px solid rgb(76, 175, 80);
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
