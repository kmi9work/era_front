<script setup>
  import axios from 'axios'
  import { ref, computed, nextTick } from 'vue'
  import AlliancesDialog from '@/components/AlliancesDialog.vue'
  import { usePairEffects } from '@/composables/usePairEffects'

  /**
   * Действия пары «A ↔ B» в одной ячейке (ТЗ № 2, § 2.3).
   *
   * country        — государство B (строка: страна, для которой показываются отношения)
   * partnerCountry — государство A (страна, «за которую идёт игра»: правки и кнопки
   *                  ячейки действуют от имени пары A↔B)
   * effects        — активные длящиеся эффекты (общий загруженный список; фильтруется по паре)
   *
   * Один компонент на оба экрана: ячейка матрицы Дашборда и столбец «Отношения»
   * в «Информации о стране» (`components/RelationsRow.vue`). Копий кнопочной логики
   * быть не должно — ТЗ № 2, § 3.
   *
   * withRelationItemsMenu — меню ручных правок пары. В матрице оно живёт в ячейке
   *   (другого места для него нет), в строке «Информации о стране» — в столбце
   *   государства A, поэтому там передаётся false.
   * withComment — подсказка о действующем эффекте. В матрице это иконка в ячейке,
   *   в строке «Информации о стране» есть отдельный столбец «Комментарий».
   */
  const props = defineProps({
    country: {
      type: Object,
      required: true,
    },
    partnerCountry: {
      type: Object,
      required: true,
    },
    effects: {
      type: Array,
      default: () => [],
    },
    withRelationItemsMenu: {
      type: Boolean,
      default: true,
    },
    withComment: {
      type: Boolean,
      default: true,
    },
  })

  const emit = defineEmits(['reload'])

  const partnerRef = computed(() => props.partnerCountry)
  const effectsRef = computed(() => props.effects)

  const {
    partnerId,
    hasNoRelationImprovement,
    nonNegativeRelations,
    commentText,
  } = usePairEffects(partnerRef, effectsRef)

  // Модальное окно для улучшения отношений через торговлю
  const showImproveDialog = ref(false)
  const selectedCountryForImprove = ref(null)
  const isImproving = ref(false)
  const updateCounter = ref(0)

  // Модальное окно для управления союзами
  const showAlliancesDialog = ref(false)
  const selectedCountryForAlliances = ref(null)

  const EXPORT_EFFECT_WARNING = '⚠️ Внимание: Действует эффект "Поддержать экспорт". Отношения не будут улучшены автоматически, но изменение будет применено вручную. Продолжить?'
  const ARMY_TRANSFER_EFFECT_WARNING = '⚠️ Внимание: Действует эффект "Передача армии". Отношения  автоматически не падают ниже нейтральных, но изменение будет применено вручную. Продолжить?'

  function reload() {
    emit('reload')
  }

  async function addItem(){
    let new_value = prompt("Новое значение");
    if (new_value === null) return

    let comment = prompt("Комментарий");
    if (comment === null) return

    const value = parseInt(new_value)
    if (!Number.isFinite(value)) {
      alert('Введите корректное число')
      return
    }

    if (value > 0 && hasNoRelationImprovement.value) {
      if (!confirm(EXPORT_EFFECT_WARNING)) return
    }

    axios.patch(`${import.meta.env.VITE_PROXY}/countries/${props.country.id}/add_relation_item.json`, {
      value: value,
      comment: comment,
      partner_country_id: partnerId.value,
    })
      .then(response => {
        if (response.data.warning) alert(response.data.warning)
        reload()
      })
      .catch(error => {
        console.error('Ошибка при добавлении правки отношений:', error)
        alert('Не удалось изменить отношения')
      })
  }

  async function removeItem(item_id){
    let fl = confirm("Точно удалить?");
    if (fl){
      axios.delete(`${import.meta.env.VITE_PROXY}/relation_items/${item_id}.json`)
        .then(() => {
          reload();
        })
    }
  }

  async function relationsChange(value){
    if (value > 0 && hasNoRelationImprovement.value) {
      if (!confirm(EXPORT_EFFECT_WARNING)) return
    }

    if (value < 0 && nonNegativeRelations.value) {
      if (!confirm(ARMY_TRANSFER_EFFECT_WARNING)) return
    }

    axios.patch(`${import.meta.env.VITE_PROXY}/countries/${props.country.id}/add_relation_item.json`, {
      value: value,
      comment: 'Ручная правка',
      partner_country_id: partnerId.value,
    })
      .then(response => {
        if (response.data.warning) alert(response.data.warning)
        reload();
      })
      .catch(error => {
        console.error('Ошибка при изменении отношений:', error)
        alert('Не удалось изменить отношения')
      })
  }

  async function setEmbargo(){
    axios.patch(`${import.meta.env.VITE_PROXY}/countries/${props.country.id}/set_embargo`)
      .then(() => {
        reload();
      })
  }

  function openImproveDialog() {
    updateCounter.value = 0
    selectedCountryForImprove.value = {
      id: props.country.id,
      name: props.country.name,
      relations: props.country.relations,
      relation_points: props.country.relation_points || 0,
      embargo: props.country.embargo
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

    if (selectedCountryForImprove.value.relations >= 2) {
      alert('Отношения уже максимальные!')
      return
    }

    if ((selectedCountryForImprove.value.relation_points || 0) < 1) {
      alert('Недостаточно торговых очков!')
      return
    }

    if (hasNoRelationImprovement.value) {
      if (!confirm(EXPORT_EFFECT_WARNING)) return
    }

    isImproving.value = true

    // Оптимистичное обновление UI
    selectedCountryForImprove.value = {
      ...selectedCountryForImprove.value,
      relations: selectedCountryForImprove.value.relations + 1,
      relation_points: selectedCountryForImprove.value.relation_points - 1
    }

    await nextTick()
    updateCounter.value++

    try {
      const url = `${import.meta.env.VITE_PROXY}/countries/${selectedCountryForImprove.value.id}/improve_relations_via_trade.json?partner_country_id=${partnerId.value}`
      const response = await axios.patch(url);

      if (response.data.warning) alert(response.data.warning)

      reload();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;

      // Откатываем оптимистичное обновление
      selectedCountryForImprove.value = {
        ...selectedCountryForImprove.value,
        relations: selectedCountryForImprove.value.relations - 1,
        relation_points: selectedCountryForImprove.value.relation_points + 1
      }
      await nextTick()
      updateCounter.value++

      if (errorMsg.includes('Поддержать экспорт') || errorMsg.includes('не были улучшены')) {
        alert(`⚠️ ${errorMsg}`)
        reload()
      } else {
        alert(`❌ Ошибка: ${errorMsg}`);
      }
    } finally {
      isImproving.value = false
    }
  }

  function openAlliancesDialog() {
    if (!props.country.alliances_enabled) return
    selectedCountryForAlliances.value = props.country
    showAlliancesDialog.value = true
  }

  function onAllianceChanged() {
    reload()
  }
</script>

<template>
  <div class="pair-relations-cell d-flex align-center flex-wrap">
    <!-- Значение пары: в матрице — с меню ручных правок, в строке — просто число -->
    <v-btn
      v-if="withRelationItemsMenu"
      class="text-none px-1"
      color="medium-emphasis"
      variant="text"
      rounded
      size="small"
    >
      {{ country.relations }}
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
              <v-btn variant="text" @click="addItem">
                Добавить ручную правку
              </v-btn>
            </VListItemTitle>
          </VListItem>
        </VList>
      </v-menu>
    </v-btn>
    <span v-else>{{ country.relations }}</span>

    <IconBtn icon="ri-arrow-up-double-line" @click="relationsChange(1)" title="Повысить отношения на 1"></IconBtn>
    <IconBtn icon="ri-arrow-down-double-line" @click="relationsChange(-1)" title="Понизить отношения на 1"></IconBtn>
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
        @click="openAlliancesDialog"
        title="Управление союзами"
      ></IconBtn>
    </VBadge>
    <IconBtn
      icon="ri-store-line"
      :color="country.embargo == 1 ? 'error' : 'success'"
      @click="setEmbargo"
      v-if="country.embargo != null"
      :title="`Эмбарго ${country.embargo == 1 ? 'введено' : 'нет'}`"
    ></IconBtn>
    <IconBtn
      icon="ri-arrow-up-circle-fill"
      color="success"
      @click="openImproveDialog"
      :title="`Улучшить через торговлю (${country.relation_points || 0} очков)`"
      v-if="country.relation_points && country.relation_points > 0"
    ></IconBtn>

    <!-- Причина, по которой улучшение недоступно (в матрице — вместо столбца «Комментарий») -->
    <VIcon
      v-if="withComment && commentText"
      icon="ri-information-line"
      size="16"
      color="warning"
      class="ms-1"
    >
      <VTooltip activator="parent" location="top">
        {{ commentText }}
      </VTooltip>
    </VIcon>
  </div>

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
          <h3 class="mb-4 text-h5">{{ selectedCountryForImprove.name }}</h3>

          <Transition name="relations-update" mode="out-in">
            <div class="relations-transition-container" :key="`relations-${updateCounter}`">
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

              <div class="arrow-container">
                <v-icon icon="mdi-arrow-right" size="48" color="success" />
              </div>

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

  <AlliancesDialog
    v-model="showAlliancesDialog"
    :country="selectedCountryForAlliances"
    :partner-country-id="partnerId"
    @alliance-created="onAllianceChanged"
    @alliance-deleted="onAllianceChanged"
  />
</template>

<style scoped>
.pair-relations-cell {
  gap: 0.125rem;
}
</style>
