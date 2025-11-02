<script setup>
  import axios from 'axios'
  import { ref, watch } from 'vue'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false
    },
    country: {
      type: Object,
      default: null
    }
  })

  const emit = defineEmits(['update:modelValue', 'alliance-created', 'alliance-deleted'])

  const alliances = ref([])
  const allianceTypes = ref([])
  const selectedAllianceType = ref(null)
  const isLoadingAlliances = ref(false)

  // Computed для управления открытием/закрытием
  const dialogOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // Следим за открытием диалога и загружаем данные
  watch(() => props.modelValue, async (newVal) => {
    if (newVal && props.country) {
      await loadAlliances(props.country.id)
      await loadAllianceTypes()
    }
  })

  // Следим за изменением страны
  watch(() => props.country, async (newCountry) => {
    if (newCountry && props.modelValue) {
      await loadAlliances(newCountry.id)
      await loadAllianceTypes()
    }
  })

  async function loadAlliances(partnerCountryId) {
    try {
      isLoadingAlliances.value = true
      // Загружаем союзы Руси (id=1 = Country::RUS) с выбранной страной
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/1/alliances.json`)
      // Фильтруем только союзы с выбранной страной
      alliances.value = response.data.filter(a => a.partner_country.id === partnerCountryId)
    } catch (error) {
      console.error('Ошибка при загрузке союзов:', error)
      alert('Не удалось загрузить союзы')
    } finally {
      isLoadingAlliances.value = false
    }
  }

  async function loadAllianceTypes() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/alliance_types.json`)
      allianceTypes.value = response.data
    } catch (error) {
      console.error('Ошибка при загрузке типов союзов:', error)
    }
  }

  async function createAlliance() {
    if (!props.country || !selectedAllianceType.value) return
    
    try {
      // Союз создается от Руси (id=1 = Country::RUS) с выбранной страной
      await axios.post(`${import.meta.env.VITE_PROXY}/alliances.json`, {
        country_id: 1, // Русь
        partner_country_id: props.country.id,
        alliance_type_id: selectedAllianceType.value.id
      })
      await loadAlliances(props.country.id)
      emit('alliance-created')
      selectedAllianceType.value = null
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message
      alert(`Ошибка: ${errorMsg}`)
    }
  }

  async function deleteAlliance(allianceId) {
    if (!confirm('Точно удалить союз?')) return
    
    try {
      await axios.delete(`${import.meta.env.VITE_PROXY}/alliances/${allianceId}.json`)
      await loadAlliances(props.country.id)
      emit('alliance-deleted')
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message
      alert(`Ошибка: ${errorMsg}`)
    }
  }

  function isAllianceTypeAvailable(allianceType) {
    if (!props.country) return false
    return props.country.relations >= allianceType.min_relations_level
  }

  function closeDialog() {
    dialogOpen.value = false
    alliances.value = []
    allianceTypes.value = []
    selectedAllianceType.value = null
  }
</script>

<template>
  <!-- Модальное окно управления союзами -->
  <v-dialog
    v-model="dialogOpen"
    max-width="600"
  >
    <v-card v-if="country">
      <v-card-title class="d-flex justify-space-between align-center bg-primary">
        <span class="text-white">Союзы: {{ country.name }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="closeDialog"
        />
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-4">
        <!-- Текущие союзы -->
        <div class="mb-4">
          <h3 class="mb-2">Текущие союзы:</h3>
          <v-list v-if="alliances.length > 0" density="compact">
            <v-list-item
              v-for="alliance in alliances"
              :key="alliance.id"
              class="px-0"
            >
              <v-list-item-title>
                {{ alliance.alliance_type.name }} с {{ alliance.partner_country.name }}
              </v-list-item-title>
              <template v-slot:append>
                <IconBtn
                  icon="ri-delete-bin-line"
                  color="error"
                  @click="deleteAlliance(alliance.id)"
                  title="Удалить союз"
                />
              </template>
            </v-list-item>
          </v-list>
          <v-alert v-else type="info" variant="tonal" density="compact">
            Нет активных союзов
          </v-alert>
        </div>

        <v-divider class="my-4" />

        <!-- Добавление нового союза -->
        <div>
          <h3 class="mb-3">Добавить союз:</h3>
          <v-select
            v-model="selectedAllianceType"
            :items="allianceTypes"
            item-title="name"
            item-value="id"
            label="Тип союза"
            variant="outlined"
            density="compact"
            return-object
            :disabled="isLoadingAlliances"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :subtitle="`Минимальный уровень отношений: ${item.raw.min_relations_level}`"
                :class="{ 'text-disabled': !isAllianceTypeAvailable(item.raw) }"
              >
                <template v-slot:prepend>
                  <v-icon
                    :color="isAllianceTypeAvailable(item.raw) ? 'success' : 'disabled'"
                    icon="ri-group-line"
                  />
                </template>
              </v-list-item>
            </template>
          </v-select>

          <v-alert
            v-if="selectedAllianceType && !isAllianceTypeAvailable(selectedAllianceType)"
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            Требуется уровень отношений: {{ selectedAllianceType.min_relations_level }},
            текущий: {{ country.relations }}
          </v-alert>

          <v-btn
            :color="selectedAllianceType && !isAllianceTypeAvailable(selectedAllianceType) ? 'warning' : 'primary'"
            variant="elevated"
            class="mt-3"
            :disabled="!selectedAllianceType || isLoadingAlliances"
            @click="createAlliance"
          >
            <v-icon icon="ri-add-line" class="mr-2" />
            Добавить союз
          </v-btn>
        </div>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="primary"
          variant="text"
          @click="closeDialog"
        >
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

