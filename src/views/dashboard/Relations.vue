<script setup>
  import axios from 'axios'
  import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

  const props = defineProps({
    countries: {
      type: Array,
      required: true,
    },
  })

  const emit = defineEmits(['reload-dashboard']);
  
  // Модальное окно для улучшения отношений
  const showImproveDialog = ref(false)
  const selectedCountryForImprove = ref(null)
  const isImproving = ref(false)
  const updateCounter = ref(0)  // Счетчик обновлений для принудительного ререндера
  
  // Polling для отслеживания появления торговых очков
  const pollInterval = ref(null)
  const previousRelationPoints = ref({})
  
  // Уведомления
  const snackbar = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('success')
  
  // Модальное окно для управления союзами
  const showAlliancesDialog = ref(false)
  const selectedCountryForAlliances = ref(null)
  const alliances = ref([])
  const allianceTypes = ref([])
  const selectedAllianceType = ref(null)
  const isLoadingAlliances = ref(false)
  
  async function addItem(country_id){
    let new_value = prompt("Новое значение");
    let comment = prompt("Комментарий");
    axios.patch(`${import.meta.env.VITE_PROXY}/countries/${country_id}/add_relation_item.json`, {value: new_value, comment: comment}) 
      .then(response => {
        emit('reload-dashboard');
      })
  }

  async function removeItem(item_id){
    let fl = confirm("Точно удалить?");
    if (fl){
      axios.delete(`${import.meta.env.VITE_PROXY}/relation_items/${item_id}.json`) 
        .then(response => {
          emit('reload-dashboard');
        })
    }
  }

  async function relationsChange(country_id, value){
    axios.patch(`${import.meta.env.VITE_PROXY}/countries/${country_id}/add_relation_item.json?value=${value}`) 
      .then(response => {
        emit('reload-dashboard');
      })
  }

  async function setEmbargo(country_id){
    axios.patch(`${import.meta.env.VITE_PROXY}/countries/${country_id}/set_embargo`) 
      .then(response => {
        emit('reload-dashboard');
      })
  }

  function openImproveDialog(country) {
    // Сбрасываем счетчик обновлений
    updateCounter.value = 0
    
    // Создаем реактивную копию объекта страны
    selectedCountryForImprove.value = {
      id: country.id,
      name: country.name,
      relations: country.relations,
      relation_points: country.relation_points || 0,
      embargo: country.embargo
    }
    showImproveDialog.value = true
  }

  function closeImproveDialog() {
    showImproveDialog.value = false
    selectedCountryForImprove.value = null
    isImproving.value = false
    updateCounter.value = 0
  }

  async function confirmImproveRelations() {
    if (!selectedCountryForImprove.value) return
    
    // Проверки
    if (selectedCountryForImprove.value.relations >= 2) {
      alert('Отношения уже максимальные!')
      return
    }
    
    if ((selectedCountryForImprove.value.relation_points || 0) < 1) {
      alert('Недостаточно торговых очков!')
      return
    }
    
    isImproving.value = true
    
    // СРАЗУ обновляем UI (оптимистичное обновление)
    selectedCountryForImprove.value = {
      ...selectedCountryForImprove.value,
      relations: selectedCountryForImprove.value.relations + 1,
      relation_points: selectedCountryForImprove.value.relation_points - 1
    }
    
    // Ждем обновления DOM
    await nextTick()
    
    // Увеличиваем счетчик для триггера анимации
    updateCounter.value++
    
    // Отправляем запрос на сервер в фоне
    try {
      await axios.patch(
        `${import.meta.env.VITE_PROXY}/countries/${selectedCountryForImprove.value.id}/improve_relations_via_trade.json`
      );
      
      // Обновляем dashboard для синхронизации с сервером
      emit('reload-dashboard');
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      alert(`❌ Ошибка: ${errorMsg}`);
      
      // В случае ошибки откатываем изменения
      selectedCountryForImprove.value = {
        ...selectedCountryForImprove.value,
        relations: selectedCountryForImprove.value.relations - 1,
        relation_points: selectedCountryForImprove.value.relation_points + 1
      }
      await nextTick()
      updateCounter.value++
    } finally {
      isImproving.value = false
    }
  }

  // Инициализация предыдущих значений
  function initializePreviousPoints() {
    props.countries.forEach(country => {
      previousRelationPoints.value[country.id] = country.relation_points || 0
    })
  }

  // Проверка появления новых торговых очков
  function checkForNewRelationPoints() {
    props.countries.forEach(country => {
      const currentPoints = country.relation_points || 0
      const previousPoints = previousRelationPoints.value[country.id] || 0
      
      // Если появились новые очки
      if (currentPoints > previousPoints) {
        const diff = currentPoints - previousPoints
        showNotification(
          `🎉 ${country.name}: получено ${diff} торговое очко!`,
          'success'
        )
      }
      
      // Обновляем сохраненное значение
      previousRelationPoints.value[country.id] = currentPoints
    })
  }

  // Показать уведомление
  function showNotification(message, color = 'success') {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbar.value = true
  }

  // Watch для отслеживания изменений в props.countries
  watch(
    () => props.countries,
    (newCountries) => {
      if (newCountries && newCountries.length > 0) {
        checkForNewRelationPoints()
      }
    },
    { deep: true }
  )

  // Lifecycle hooks
  onMounted(() => {
    // Инициализируем начальные значения
    initializePreviousPoints()
  })

  onBeforeUnmount(() => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
    }
  })

  // Функции для управления союзами
  async function openAlliancesDialog(country) {
    if (!country.alliances_enabled) return
    selectedCountryForAlliances.value = country
    showAlliancesDialog.value = true
    await loadAlliances(country.id)
    await loadAllianceTypes()
  }

  function closeAlliancesDialog() {
    showAlliancesDialog.value = false
    selectedCountryForAlliances.value = null
    alliances.value = []
    allianceTypes.value = []
    selectedAllianceType.value = null
  }

  async function loadAlliances(partnerCountryId) {
    try {
      isLoadingAlliances.value = true
      // Загружаем союзы Руси (id=1) с выбранной страной
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
    if (!selectedCountryForAlliances.value || !selectedAllianceType.value) return
    
    try {
      // Союз создается от Руси (id=1) с выбранной страной
      await axios.post(`${import.meta.env.VITE_PROXY}/alliances.json`, {
        country_id: 1, // Русь
        partner_country_id: selectedCountryForAlliances.value.id,
        alliance_type_id: selectedAllianceType.value.id
      })
      await loadAlliances(selectedCountryForAlliances.value.id)
      emit('reload-dashboard')
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
      await loadAlliances(selectedCountryForAlliances.value.id)
      emit('reload-dashboard')
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message
      alert(`Ошибка: ${errorMsg}`)
    }
  }

  function isAllianceTypeAvailable(allianceType) {
    if (!selectedCountryForAlliances.value) return false
    return selectedCountryForAlliances.value.relations >= allianceType.min_relations_level
  }

</script>


<template>
  <VCard width="600">
    <VCardItem>
      <VCardTitle>Отношения</VCardTitle>
    </VCardItem>

    <VCardText>
      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">
              Страна
            </th>
            <th class="text-left">
              Отношения
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(country, ri) in countries"
            :key="country.id"
          >
            <td>
              <v-btn
                class="text-none"
                color="medium-emphasis"
                variant="text"
                rounded
                prepend-icon="ri-arrow-down-double-fill"
                min-width="300"
                style="justify-content: start;"
              >
                {{ country.name }}
                <v-menu activator="parent">
                  <VList>
                    <VListItem 
                      v-for="(item, i) in country.relation_items"
                      :key="i"
                    >
                      <VListItemTitle>
                        {{item.comment}} ({{item.value}}) <span v-if="item.year">Год: {{item.year}}</span>
                        <IconBtn
                          icon="ri-delete-bin-line"
                          class="me-1"
                          @click="removeItem(item.id)"
                        />
                      </VListItemTitle>
                    </VListItem>
                    <VListItem key="_0">
                      <VListItemTitle>
                        <v-btn variant="text" @click="addItem(country.id)">
                          Добавить ручную правку
                        </v-btn>
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </v-menu>
              </v-btn>
              
            </td>
            <td>
              {{ country.relations }} 

              <IconBtn icon="ri-arrow-up-double-line" @click="relationsChange(country.id, 1)" title="Повысить отношения на 1"></IconBtn>
              <IconBtn icon="ri-arrow-down-double-line" @click="relationsChange(country.id, -1)" title="Понизить отношения на 1"></IconBtn>
              <VBadge
                v-if="country.alliances_enabled"
                :content="(country.alliances || []).length"
                color="primary"
                location="top end"
                offset-x="2"
                offset-y="2"
                :model-value="(country.alliances || []).length > 0"
              >
                <IconBtn 
                  icon="ri-group-line" 
                  color="primary"
                  @click="openAlliancesDialog(country)" 
                  title="Управление союзами"
                ></IconBtn>
              </VBadge>
              <IconBtn 
                  icon="ri-store-line" 
                  :color="country.embargo == 1 ? 'error' : 'success'" 
                  @click="setEmbargo(country.id)"
                  v-if="country.embargo != null"
                  :title="`Эмбарго ${country.embargo == 1 ? 'введено' : 'нет'}`"
              ></IconBtn>
                            <IconBtn 
                icon="ri-arrow-up-circle-fill" 
                color="success"
                @click="openImproveDialog(country)" 
                :title="`Улучшить через торговлю (${country.relation_points || 0} очков)`"
                v-if="country.relation_points && country.relation_points > 0"
              ></IconBtn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>

  <!-- Модальное окно улучшения отношений через торговлю -->
  <v-dialog
    v-model="showImproveDialog"
    max-width="500"
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center bg-success">
        <span class="text-white">Улучшение отношений через торговлю</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="closeImproveDialog"
        />
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-6">
        <div v-if="selectedCountryForImprove" class="text-center">
          <!-- Название страны -->
          <h3 class="mb-4 text-h5">{{ selectedCountryForImprove.name }}</h3>
          
          <!-- Визуализация изменения отношений -->
          <Transition name="relations-update" mode="out-in">
            <div class="relations-transition-container" :key="`relations-${updateCounter}`">
              <!-- Текущее состояние -->
              <div class="relation-state">
                <div class="relation-label">Текущие отношения</div>
                <Transition name="image-swap" mode="out-in">
                  <div class="relation-image-wrapper" :key="`current-${selectedCountryForImprove.relations}-${updateCounter}`">
                    <v-img
                      :src="`/images/relations/${selectedCountryForImprove.relations}.png`"
                      width="80"
                      height="80"
                      class="mx-auto"
                      :key="`img-current-${updateCounter}`"
                    />
                  </div>
                </Transition>
                <Transition name="value-change" mode="out-in">
                  <div class="relation-value" :key="`value-${selectedCountryForImprove.relations}-${updateCounter}`">
                    {{ selectedCountryForImprove.relations }}
                  </div>
                </Transition>
              </div>
              
              <!-- Стрелка -->
              <div class="arrow-container">
                <v-icon icon="mdi-arrow-right" size="48" color="success" />
              </div>
              
              <!-- Новое состояние -->
              <div class="relation-state">
                <div class="relation-label">После улучшения</div>
                <Transition name="image-swap" mode="out-in">
                  <div class="relation-image-wrapper new-relation" :key="`next-${selectedCountryForImprove.relations}-${updateCounter}`">
                    <v-img
                      :src="`/images/relations/${Math.min(selectedCountryForImprove.relations + 1, 2)}.png`"
                      width="80"
                      height="80"
                      class="mx-auto"
                      :key="`img-next-${updateCounter}`"
                    />
                  </div>
                </Transition>
                <Transition name="value-change" mode="out-in">
                  <div class="relation-value new" :key="`next-value-${selectedCountryForImprove.relations}-${updateCounter}`">
                    {{ Math.min(selectedCountryForImprove.relations + 1, 2) }}
                  </div>
                </Transition>
              </div>
            </div>
          </Transition>
          
          <v-divider class="my-4" />
          
          <!-- Информация о стоимости -->
          <v-alert type="info" variant="tonal" class="mb-4">
            <div class="d-flex align-center justify-space-between">
              <span>
                <strong>Стоимость:</strong> 1 торговое очко
              </span>
              <Transition name="chip-update" mode="out-in">
                <v-chip 
                  :color="(selectedCountryForImprove.relation_points || 0) > 0 ? 'primary' : 'error'" 
                  size="small"
                  :key="selectedCountryForImprove.relation_points"
                >
                  Доступно: {{ selectedCountryForImprove.relation_points || 0 }}
                </v-chip>
              </Transition>
            </div>
          </v-alert>
          
          <!-- Предупреждения -->
          <v-alert 
            v-if="selectedCountryForImprove.relations >= 2"
            type="warning" 
            variant="tonal"
          >
            <strong>Внимание:</strong> Отношения уже максимальные (2)
          </v-alert>
          
          <v-alert 
            v-else-if="(selectedCountryForImprove.relation_points || 0) < 1"
            type="error" 
            variant="tonal"
          >
            <strong>Недостаточно очков!</strong> Необходимо 1 торговое очко для улучшения отношений.
          </v-alert>
          
          <v-alert 
            v-else
            type="success" 
            variant="tonal"
          >
            <strong>Готово к улучшению!</strong> Нажмите кнопку ниже, чтобы улучшить отношения.
          </v-alert>
        </div>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions class="pa-4">
        <v-btn
          color="primary"
          variant="text"
          @click="closeImproveDialog"
          :disabled="isImproving"
        >
          <v-icon icon="mdi-close" class="mr-1" />
          Закрыть
        </v-btn>
        <v-spacer />
        <v-btn
          color="success"
          variant="elevated"
          @click="confirmImproveRelations"
          :loading="isImproving"
          :disabled="selectedCountryForImprove?.relations >= 2 || (selectedCountryForImprove?.relation_points || 0) < 1"
        >
          <v-icon icon="mdi-arrow-up-circle" class="mr-2" />
          Улучшить отношения
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar для уведомлений о новых торговых очках -->
  <v-snackbar
    v-model="snackbar"
    :color="snackbarColor"
    :timeout="5000"
    location="top right"
    elevation="24"
  >
    <div class="d-flex align-center">
      <v-icon icon="mdi-gift" class="mr-3" size="large" />
      <div>
        <div class="text-subtitle-1 font-weight-bold">Новые торговые очки!</div>
        <div class="text-body-2">{{ snackbarMessage }}</div>
      </div>
    </div>
    
    <template v-slot:actions>
      <v-btn
        variant="text"
        @click="snackbar = false"
      >
        Закрыть
      </v-btn>
    </template>
  </v-snackbar>

  <!-- Модальное окно управления союзами -->
  <v-dialog
    v-model="showAlliancesDialog"
    max-width="600"
  >
    <v-card v-if="selectedCountryForAlliances">
      <v-card-title class="d-flex justify-space-between align-center bg-primary">
        <span class="text-white">Союзы: {{ selectedCountryForAlliances.name }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="closeAlliancesDialog"
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
            текущий: {{ selectedCountryForAlliances.relations }}
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
          @click="closeAlliancesDialog"
        >
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.relations-transition-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(33, 150, 243, 0.05));
  border-radius: 12px;
  margin: 1rem 0;
}

.relation-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.relation-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.relation-image-wrapper {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.relation-image-wrapper.new-relation {
  border-color: #4CAF50;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(76, 175, 80, 0.5);
  }
}

.relation-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.7);
}

.relation-value.new {
  color: #4CAF50;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.arrow-container {
  display: flex;
  align-items: center;
  animation: slideRight 1s ease-in-out infinite;
}

@keyframes slideRight {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
}

/* Transition для обновления отношений */
.relations-update-enter-active,
.relations-update-leave-active {
  transition: all 0.4s ease;
}

.relations-update-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.relations-update-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* Transition для чипа с очками */
.chip-update-enter-active,
.chip-update-leave-active {
  transition: all 0.3s ease;
}

.chip-update-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.chip-update-leave-to {
  opacity: 0;
  transform: scale(1.2);
}

/* Transition для смены изображений */
.image-swap-enter-active,
.image-swap-leave-active {
  transition: all 0.4s ease;
}

.image-swap-enter-from {
  opacity: 0;
  transform: scale(0.7) rotate(-10deg);
}

.image-swap-leave-to {
  opacity: 0;
  transform: scale(1.3) rotate(10deg);
}

/* Transition для смены значений */
.value-change-enter-active,
.value-change-leave-active {
  transition: all 0.3s ease;
}

.value-change-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.value-change-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>


