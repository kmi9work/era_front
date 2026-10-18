<script setup>
  import axios from 'axios'
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'

  /**
   * Чек-листы вассалитета текущего государства (ТЗ № 2, § 7.1).
   *
   * Текущее государство — сюзерен: показываются его чек-листы, кнопки
   * «Установить/Снять вассалитет» действуют для пары «сюзерен ↔ вассал».
   * Блок доступен любому государству; если вассалов нет — пустое состояние.
   */
  const emit = defineEmits(['reload-dashboard'])

  const { currentCountry, currentCountryId, reloadToken, loadCurrentCountry } = useCurrentCountry()

  const checklists = ref([])
  const vassalIncomes = ref({})
  const pollInterval = ref(null)

  const countryName = computed(() => currentCountry.value?.name || 'государство не выбрано')
  const isLoading = ref(false)

  async function loadChecklists() {
    if (!currentCountryId.value) return
    isLoading.value = true
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PROXY}/vassals_and_robbers/checklists.json?country_id=${currentCountryId.value}`,
      )
      checklists.value = Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Ошибка при загрузке чек-листов:', error)
      checklists.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function loadVassalageSettings() {
    if (!currentCountryId.value) return
    try {
      // Суммы вассальных доходов — по сюзерену (у каждой команды свои, § 7.2)
      const response = await axios.get(
        `${import.meta.env.VITE_PROXY}/game_parameters/get_vassalage_settings.json?country_id=${currentCountryId.value}`,
      )
      vassalIncomes.value = response.data?.vassal_incomes || {}
    } catch (error) {
      console.error('Ошибка при загрузке настроек вассалитета:', error)
      vassalIncomes.value = {}
    }
  }

  onMounted(async () => {
    await loadCurrentCountry()
    loadVassalageSettings()
    loadChecklists()

    // Автообновление каждые 10 секунд
    pollInterval.value = setInterval(() => {
      loadChecklists()
    }, 10000)
  })

  // Смена государства: сброс списка и повторная загрузка (кеш не переносится)
  watch(reloadToken, () => {
    checklists.value = []
    vassalIncomes.value = {}
    loadVassalageSettings()
    loadChecklists()
  })

  onBeforeUnmount(() => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
    }
  })

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
    const countryNameVassal = checklist.vassal_country.name

    let confirmMessage = `Установить вассалитет ${countryName.value} с ${countryNameVassal}?\nДоход Казначея ${countryName.value} увеличится на ${income?.toLocaleString('ru-RU') || income} руб.`

    // Добавляем предупреждение, если не все условия выполнены
    if (checklist.completion_percentage !== 100) {
      confirmMessage = `⚠️ ВНИМАНИЕ: Не все условия чек-листа выполнены!\n${confirmMessage}`
    }

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      await axios.post(`${import.meta.env.VITE_PROXY}/vassals_and_robbers/checklists/${checklist.id}/establish_vassalage.json?country_id=${currentCountryId.value}`)
      alert(`Вассалитет ${countryName.value} с ${countryNameVassal} установлен!\nДоход Казначея увеличен на ${income?.toLocaleString('ru-RU') || income} руб.`)
      // Обновляем список чек-листов и основную дашборду
      loadChecklists()
      emit('reload-dashboard')
    } catch (error) {
      console.error('Ошибка при установке вассалитета:', error)
      alert('Ошибка при установке вассалитета: ' + (error.response?.data?.error || error.message))
    }
  }

  async function removeVassalage(checklist) {
    const income = vassalIncomes.value[checklist.vassal_country.id]
    const countryNameVassal = checklist.vassal_country.name

    if (!confirm(`Снять вассалитет ${countryName.value} с ${countryNameVassal}?\nДоход Казначея уменьшится на ${income?.toLocaleString('ru-RU') || income} руб.`)) {
      return
    }

    try {
      await axios.post(`${import.meta.env.VITE_PROXY}/vassals_and_robbers/checklists/${checklist.id}/remove_vassalage.json?country_id=${currentCountryId.value}`)
      alert(`Вассалитет ${countryName.value} с ${countryNameVassal} снят!\nДоход Казначея уменьшен на ${income?.toLocaleString('ru-RU') || income} руб.`)
      // Обновляем список чек-листов и основную дашборду
      loadChecklists()
      emit('reload-dashboard')
    } catch (error) {
      console.error('Ошибка при снятии вассалитета:', error)
      alert('Ошибка при снятии вассалитета: ' + (error.response?.data?.error || error.message))
    }
  }
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap gap-2 mb-3">
      <span class="text-subtitle-1">Чек-листы вассалитета: сюзерен — {{ countryName }}</span>
    </div>

    <VRow>
      <template v-for="checklist in checklists" :key="checklist.id">
        <VCol
          v-if="checklist.vassal_country"
          cols="12"
          md="6"
        >
          <VCard>
            <VCardItem>
              <VCardTitle class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-2">
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
              </VCardTitle>
            </VCardItem>

            <VCardText>
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
            </VCardText>
          </VCard>
        </VCol>
      </template>
    </VRow>

    <!-- Пустое состояние: у государства нет вассальных чек-листов (§ 7.1) -->
    <VCard v-if="!checklists.length && !isLoading">
      <VCardText class="text-center py-8 text-medium-emphasis">
        Нет доступных вассалов
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.condition-completed {
  background-color: rgba(76, 175, 80, 0.08);
  border-left: 3px solid rgb(76, 175, 80);
}
</style>
