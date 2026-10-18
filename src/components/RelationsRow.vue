<script setup>
  import axios from 'axios'
  import { computed } from 'vue'
  import PairRelationsCell from '@/components/PairRelationsCell.vue'
  import { usePairEffects } from '@/composables/usePairEffects'

  /**
   * Строка таблицы «Отношения» раздела «Информация о стране» (ТЗ № 2, § 3.5).
   *
   * Вид таблицы прежний, как до перехода на несколько государств: два столбца —
   * «Страна» (государство строки с меню ручных правок) и «Отношения» (значение пары
   * и кнопки действий). Отличие только в данных: значение и правки относятся к паре
   * «текущее государство ↔ государство строки», поэтому во все запросы уходит
   * `partner_country_id`.
   *
   * country        — государство B (страна строки)
   * partnerCountry — государство A (текущее государство: пара, за которую идёт игра)
   *
   * Кнопочная логика пары живёт в общем компоненте `components/PairRelationsCell.vue`
   * (его же использует матрица Дашборда); здесь остаётся столбец «Страна» с меню
   * ручных правок пары.
   */
  const props = defineProps({
    country: {
      type: Object,
      required: true,
    },
    partnerCountry: {
      type: Object,
      default: null,
    },
    // Активные длящиеся эффекты (общий загруженный список; фильтруется по паре)
    effects: {
      type: Array,
      default: () => [],
    },
  })

  const emit = defineEmits(['reload'])

  const partnerRef = computed(() => props.partnerCountry)
  const effectsRef = computed(() => props.effects)

  const { partnerId, hasNoRelationImprovement } = usePairEffects(partnerRef, effectsRef)

  const EXPORT_EFFECT_WARNING = '⚠️ Внимание: Действует эффект "Поддержать экспорт". Отношения не будут улучшены автоматически, но изменение будет применено вручную. Продолжить?'

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
        emit('reload')
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
          emit('reload');
        })
    }
  }
</script>

<template>
  <tr>
    <!-- Страна: государство строки и меню ручных правок пары (как было до many_teams) -->
    <td>
      <v-btn
        class="text-none"
        color="medium-emphasis"
        variant="text"
        rounded
        prepend-icon="ri-arrow-down-double-fill"
        width="270"
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
                <v-btn variant="text" @click="addItem">
                  Добавить ручную правку
                </v-btn>
              </VListItemTitle>
            </VListItem>
          </VList>
        </v-menu>
      </v-btn>
    </td>

    <!-- Отношения пары и кнопки действий: общий компонент с матрицей Дашборда -->
    <td>
      <PairRelationsCell
        :country="country"
        :partner-country="partnerCountry"
        :effects="effects"
        :with-relation-items-menu="false"
        :with-comment="false"
        @reload="emit('reload')"
      />
    </td>
  </tr>
</template>
