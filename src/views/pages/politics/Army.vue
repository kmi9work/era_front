<script setup>
  import axios from 'axios'
  import { ref, computed, watch, onBeforeMount } from 'vue'
  import ArmyDialog from './ArmyDialog.vue' // Добавьте этот импорт

  const getResourceImageUrl = (identificator) => {
    return `${import.meta.env.VITE_PROXY}/images/resources/${identificator}.png`
  }

  const resources = {
    'stone_brick': {
      'img': getResourceImageUrl('stone_brick'),
      'name': 'Каменный кирпич'
    },
    'weapon': {
      'img': getResourceImageUrl('weapon'),
      'name': 'Оружие'
    },
    'tools': {
      'img': getResourceImageUrl('tools'),
      'name': 'Инструменты'
    },
    'timber': {
      'img': getResourceImageUrl('timber'),
      'name': 'Брёвна'
    },
    'stone': {
      'img': getResourceImageUrl('stone'),
      'name': 'Камень'
    },
    'metal_ore': {
      'img': getResourceImageUrl('metal_ore'),
      'name': 'Железная руда'
    },
    'metal': {
      'img': getResourceImageUrl('metal'),
      'name': 'Металл'
    },
    'meat': {
      'img': getResourceImageUrl('meat'),
      'name': 'Мясо'
    },
    'luxury': {
      'img': getResourceImageUrl('luxury'),
      'name': 'Роскошь'
    },
    'horses': {
      'img': getResourceImageUrl('horses'),
      'name': 'Лошади'
    },
    'grain': {
      'img': getResourceImageUrl('grain'),
      'name': 'Зерно'
    },
    'gems': {
      'img': getResourceImageUrl('gems'),
      'name': 'Драгоценный металл'
    },
    'food': {
      'img': getResourceImageUrl('food'),
      'name': 'Провизия'
    },
    'flour': {
      'img': getResourceImageUrl('flour'),
      'name': 'Мука'
    },
    'boards': {
      'img': getResourceImageUrl('boards'),
      'name': 'Доски'
    },
    'armor': {
      'img': getResourceImageUrl('armor'),
      'name': 'Доспехи'
    },
    'money': {
      'img': getResourceImageUrl('money'),
      'name': 'Золото'
    },
  }

  const props = defineProps({
    army: {
      type: Object,
      required: true,
    },
    settlements: {
      type: Array,
      required: true,
    },
    armies: {
      type: Array,
      required: true,
    },
    troop_types: {
      type: Array,
      required: true,
    },
    foreign:{
      type: Boolean,
      required: true
    },
    nobles:{
      type: Array,
      required: true
    },
    countries:{
      type: Array,
      required: true
    }
  })

  const emit = defineEmits(['update-armies', 'edit-army']);

  const attack_dialog = ref(false);
  const add_troop_dialog = ref(false);

  const goto_dialog = ref(false);
  const settle = ref(null);
  
  // Проверка: передана ли армия другой стране
  const isLeased = computed(() => {
    return props.army?.params?.additional?.active === true;
  });
  
  const leasedTo = computed(() => {
    return props.army?.params?.additional?.leased_to || '';
  });
  const enemy = ref(null);
  
  // Активные эффекты для проверки блокировки движения армии
  const activeEffects = ref([]);
  
  // Проверка, является ли владелец армии Великим князем
  const isGrandPrince = computed(() => {
    if (!props.army?.owner?.jobs) return false;
    return props.army.owner.jobs.some((job) => job.name === 'Великий князь');
  });
  
  // Проверка эффекта NO_ARMY_MOVEMENT для Великого князя
  const hasNoArmyMovementEffect = computed(() => {
    if (!isGrandPrince.value) return false;
    return activeEffects.value.some((effect) => 
      effect.effect === 'no_army_movement'
    );
  });
  
  // Загрузка активных эффектов
  async function loadActiveEffects() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_active_lingering_effects.json`);
      activeEffects.value = response.data.effects || [];
    } catch (error) {
      console.error('Ошибка при загрузке активных эффектов:', error);
      activeEffects.value = [];
    }
  }

  const armyProtectingCaravan = computed(() => {
    if (!props.army?.name) return false;
    
    return activeEffects.value.some(effect => 
      effect.effect === "single_army_complete_block" && 
      effect.targets?.includes(props.army.name)
    );
  });


  const tt_counts = ref([]);

  // Выбранные типы новых отрядов. Обычные отряды и пушка выбираются в разных
  // слотах: пушка идёт сверх трёх отрядов, поэтому её выбор не занимает место
  // обычного отряда.
  const selectedRegular = ref([null, null, null]);
  const selectedCannon = ref(null);

  const editArmyDialog = ref(false)

  // Пушка — отдельный слот сверх трёх отрядов (TroopType::CANNON в бэкенде).
  const CANNON_TYPE_ID = 4

  const isCannonType = (troopType) =>
    troopType?.id === CANNON_TYPE_ID || /пушк/i.test(troopType?.name || '')

  const armyCannons = computed(() =>
    props.army.troops.filter(troop => isCannonType(troop.troop_type))
  )

  const armyRegularTroops = computed(() =>
    props.army.troops.filter(troop => !isCannonType(troop.troop_type))
  )

  // Места в составе: 3 обычных отряда и одна пушка сверх них.
  const freeRegularSlots = computed(() => Math.max(0, 3 - armyRegularTroops.value.length))
  const freeCannonSlots = computed(() => (armyCannons.value.length > 0 ? 0 : 1))

  // Стоимость — цена постройки отряда с нуля (buy_cost типа), без цепочки
  // улучшений: отряды больше не улучшаются.
  const totalCost = computed(() => {
    const cost = {};

    pickedTroopTypeIds.value.forEach(troopTypeId => {
      if (!troopTypeId) return
      const troopType = props.troop_types.find(t => t.id === troopTypeId)
      if (!troopType) return

      troopType.params.buy_cost?.forEach(res => {
        if (!res.count) return
        cost[res.identificator] = (cost[res.identificator] || 0) + res.count
      })
    })

    // Фильтрация нулевых значений
    return Object.fromEntries(
      Object.entries(cost).filter(([_, count]) => count > 0)
    );
  });

  // Индексы селектов обычных отрядов: по одному на свободное место.
  const regularSlots = computed(() =>
    Array.from({ length: freeRegularSlots.value }, (_, index) => index)
  )

  // Пушка — отдельный слот, только если её ещё нет в армии.
  const showCannonSlot = computed(() => freeCannonSlots.value > 0)

  const regularTroopTypes = computed(() => props.troop_types.filter(troop => !isCannonType(troop)))
  const cannonTroopType = computed(() => props.troop_types.find(isCannonType) || null)

  // Всё, что мастер отметил к постройке: обычные отряды + пушка.
  const pickedTroopTypeIds = computed(() => [
    ...selectedRegular.value.filter(Boolean),
    ...(selectedCannon.value ? [selectedCannon.value] : []),
  ])

  const resetTroopSelection = () => {
    selectedRegular.value = [null, null, null]
    selectedCannon.value = null
  }

  watch(add_troop_dialog, (newVal) => {
    if (newVal) resetTroopSelection()
  });

  // Строим отряды с нуля: каждый выбранный тип — отдельный POST. Улучшения
  // (PATCH /troops/:id/upgrade) больше не используются.
  async function createTroops() {
    const troopTypeIds = pickedTroopTypeIds.value
    if (troopTypeIds.length === 0) return

    try {
      await Promise.all(
        troopTypeIds.map(troopTypeId =>
          axios.post(`${import.meta.env.VITE_PROXY}/armies/${props.army.id}/troops.json`, {
            troop_type_id: troopTypeId
          })
        )
      );
      emit('update-armies');
      add_troop_dialog.value = false;
      resetTroopSelection();
    } catch (error) {
      console.error('Ошибка при создании отрядов:', error);
      alert(error.response?.data?.error || 'Произошла ошибка при создании отрядов');
    }
  }

  // Функция для инициализации массива
  const initializeCounts = () => {
    tt_counts.value = Array(props.troop_types.length).fill(0);
  };

  // Инициализируем при монтировании
  initializeCounts();

  // Следим за изменениями troop_types
  watch(() => props.troop_types, (newVal) => {
    if (newVal.length !== tt_counts.value.length) {
      initializeCounts();
    }
  }, { deep: true });
  
  // Следим за изменениями армии для обновления эффектов
  watch(() => props.army, async () => {
    await loadActiveEffects();
  }, { deep: true });

  onBeforeMount(async () => {
    await loadActiveEffects();
  })

  const maxBuyCostLength = computed(() => 
    Math.max(...props.troop_types.map(troop => troop.params.buy_cost.length))
  );

  const groupedBuyCost = computed((troop_type) => {
    const groups = {};
    
    // Проходим по всем элементам buy_cost
    troop_type.params.buy_cost.forEach(item => {
      if (!groups[item.identificator]) {
        groups[item.identificator] = {
          identificator: item.identificator,
          total: 0
        };
      }
      groups[item.identificator].total += item.count;
    });
    
    // Преобразуем объект в массив
    return Object.values(groups);
  });


  async function removeTroop(troop_id) {
    await axios.delete(`${import.meta.env.VITE_PROXY}/troops/${troop_id}.json`)
      .then(async (response) => {
        emit('update-armies');
      })
  };

  async function payForTroop(troop_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/troops/${troop_id}/pay_for.json`)
      .then(async (response) => {
        emit('update-armies');
      })
  };

  async function armyGoto(army_id, settlement_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/armies/${army_id}/goto/${settlement_id}.json`)
      .then(async (response) => {
        goto_dialog.value = false;
        emit('update-armies');
      })
      .catch((error) => {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Не удалось переместить армию';
        alert(errorMessage);
      });
  };

  async function armyAttack(army_id, enemy_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/armies/${army_id}/attack/${enemy_id}.json?voevoda_bonus=1`)
      .then(async (response) => {
        if (response.data) {
          alert(`Победил ${response.data?.owner?.name}. Урон армии внесён в программу`);
        }else{
          alert("Ошибка");
        }
        enemy.value = null;
        attack_dialog.value = false;
        emit('update-armies')
      })
  };

  const getIdentificator = (index) => {
    const troopWithResource = props.troop_types.find(troop => troop.params.buy_cost?.[index]);
    return troopWithResource?.params.buy_cost[index]?.identificator;
  };


  const calculateTotal = (resourceIndex) => {
    return props.troop_types.reduce((sum, troop, tt_idx) => {
      const cost = troop.params?.buy_cost;
      if (cost && cost[resourceIndex]) {
        return sum + (cost[resourceIndex].count * tt_counts.value[tt_idx]);
      }
      return sum;
    }, 0);
  };

  async function removeArmy(army_id) {
    if (confirm('Вы уверены, что хотите удалить эту армию?')) {
      await axios.delete(`${import.meta.env.VITE_PROXY}/armies/${army_id}.json`)
        .then(async (response) => {
          emit('update-armies');
        })
        .catch(error => {
          console.error('Ошибка при удалении армии:', error);
          alert('Не удалось удалить армию');
        });
    }
  };
  
  // Вернуть армию из аренды
  async function unleaseArmy(army_id) {
    if (confirm(`Вернуть армию из аренды (${leasedTo.value})?`)) {
      try {
        await axios.patch(`${import.meta.env.VITE_PROXY}/armies/${army_id}/unlease.json`)
          .then(async (response) => {
            alert('Армия возвращена!');
            emit('update-armies');
          })
      } catch (error) {
        console.error('Ошибка при возврате армии:', error);
        alert('Не удалось вернуть армию');
      }
    }
  };

  // Обработчик сохранения изменений
  const handleSubmit = async (armyData) => {
    try {
      await axios.patch(`${import.meta.env.VITE_PROXY}/armies/${props.army.id}.json`, armyData)
      emit('update-armies')
      editArmyDialog.value = false
    } catch (error) {
      console.error('Ошибка при обновлении армии:', error)
      
      // Получаем сообщения об ошибках из ответа сервера
      let errorMessage = 'Не удалось обновить армию'
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        if (Array.isArray(errors) && errors.length > 0) {
          errorMessage = errors.join(', ')
        }
      }
      
      alert(errorMessage)
    }
  }

  async function scoutArmy(army_id, hidden) {
    try {
      let bonus = !hidden && confirm("Зачислить бонус Тайному советнику за разведку?")
      const params = bonus ? '?tainiy_bonus=1' : ''
      await axios.patch(`${import.meta.env.VITE_PROXY}/armies/${army_id}.json${params}`, {hidden: hidden})
      emit('update-armies')
    } catch (error) {
      console.error('Ошибка при разведке армии:', error)
      alert('Не удалось разведать армию')
    }
  }


</script>

<template>
  <VCard :title="`${army.name}`" width="400">
    <VCardText>
      <v-table>
        <tbody>
          <tr v-for="troop in army.troops">
            <td>
              <span
                  :style="`${troop.to_destroy && !foreign ? 'color: red;' : ''}`"
              >
                {{troop.troop_type?.name}}
              </span>
              
            </td>
            <td style="padding: 0px">
              <v-icon 
                  
                  :title="`Оплачены года [${troop.params['paid'].join(', ')}] с ${troop.params['first_year']}`"
                  icon="ri-question-line">
              </v-icon>
            </td>
            <td style="padding-right: 0px">
              {{troop.power}}
            </td>
            <td class="d-flex align-center">
              <VBtn 
                :color="troop.is_paid ? 'success' : 'error'"
                @click="payForTroop(troop.id)"
                class="mr-2"
                v-if="!foreign"
              >
                Оплата
              </VBtn>
              <IconBtn
                icon="ri-delete-bin-line"
                color="error"
                @click="removeTroop(troop.id)"
                v-if="!isLeased"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
      <div class="text-center pa-4" v-if="!isLeased">
        <IconBtn
            icon="ri-add-circle-line"
            class="me-1"
            fill="rgba(100,205,138,1)"
            @click="add_troop_dialog = true"
          />

        <VDialog
          v-model="add_troop_dialog"
          width="auto"
        >
          <VCard
            width="900"
            title="Формирование армии"
          >
            <VCardText>
              <div class="mb-4">
                Состав: {{ armyRegularTroops.length }} из 3 отрядов{{ armyCannons.length ? ' + пушка' : '' }}.
                Пушка ставится сверх трёх отрядов и только одна.
              </div>

              <!-- Новые отряды: строятся с нуля, улучшений старых отрядов нет -->
              <div v-if="regularSlots.length === 0 && !showCannonSlot" class="mb-4">
                <VAlert type="info" variant="tonal" density="compact">
                  Свободных мест в армии нет: три отряда и пушка уже стоят.
                </VAlert>
              </div>

              <div v-for="index in regularSlots" :key="'new-'+index" class="mb-4">
                <h3>Новый отряд {{ armyRegularTroops.length + index + 1 }}</h3>
                <VSelect
                  v-model="selectedRegular[index]"
                  :items="regularTroopTypes"
                  item-title="name"
                  item-value="id"
                  label="Выберите тип отряда"
                  clearable
                >
                  <template #item="{ item, props: selectProps }">
                    <VListItem v-bind="selectProps" :title="item.title">
                      <template #append>
                        <span class="text-caption text-medium-emphasis">
                          {{ (item.raw?.params?.buy_cost || [])
                            .filter(cost => cost.count)
                            .map(cost => `${cost.count} ${resources[cost.identificator]?.name || cost.identificator}`)
                            .join(', ') }}
                        </span>
                      </template>
                    </VListItem>
                  </template>
                </VSelect>
              </div>

              <div v-if="showCannonSlot" class="mb-4">
                <h3>Пушка (сверх трёх отрядов)</h3>
                <VSelect
                  v-model="selectedCannon"
                  :items="cannonTroopType ? [cannonTroopType] : []"
                  item-title="name"
                  item-value="id"
                  label="Поставить пушку"
                  clearable
                >
                  <template #item="{ item, props: selectProps }">
                    <VListItem v-bind="selectProps" :title="item.title">
                      <template #append>
                        <span class="text-caption text-medium-emphasis">
                          {{ (item.raw?.params?.buy_cost || [])
                            .filter(cost => cost.count)
                            .map(cost => `${cost.count} ${resources[cost.identificator]?.name || cost.identificator}`)
                            .join(', ') }}
                        </span>
                      </template>
                    </VListItem>
                  </template>
                </VSelect>
              </div>

              <div v-if="Object.keys(totalCost).length > 0" class="mt-4">
                <h3>Общая стоимость:</h3>
                <v-list>
                  <v-list-item
                    v-for="([res, count], index) in Object.entries(totalCost)"
                    :key="index"
                  >
                    <template v-slot:prepend>
                      <v-avatar size="30" class="mr-2">
                        <v-img
                          :src="resources[res]?.img"
                          :title="resources[res]?.name"
                        />
                      </v-avatar>
                    </template>
                    
                    <v-list-item-title>
                      {{ count }} {{ resources[res]?.name }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>
            </VCardText>
            
            <VCardActions>
              <VBtn
                color="primary"
                @click="createTroops"
                :disabled="pickedTroopTypeIds.length === 0"
              >
                Построить
              </VBtn>
              <VBtn
                @click="add_troop_dialog = false"
              >
                Отмена
              </VBtn>
            </VCardActions>
          </VCard>
        </VDialog>
      </div>
    </VCardText>
    <VCardText>
      Город: {{army.settlement?.name}}
    </VCardText>
    <VCardText v-if="!isLeased">
      Разведана: 
      <!-- Армии текущего государства всегда разведаны: свои армии мастеру известны,
           а разведка/маскировка имеют смысл только для чужих армий (вкладка «Зарубеж») -->
      <span
        v-if="!foreign"
        class="text-success font-weight-medium"
      >
        Да
      </span>
      <template v-else-if="army.hidden">
        <VBtn 
          color="error"
          variant="text"
          @click="scoutArmy(army.id, false)"
        >
          Нет (разведать)
        </VBtn>
      </template>
      <template v-else>
        <VBtn 
          color="success"
          variant="text"
          @click="scoutArmy(army.id, true)"
        >
          Да (спрятать)
        </VBtn>
      </template>
    </VCardText>
    
    <!-- Показываем информацию о передаче армии -->
    <VCardText v-if="isLeased">
      <VAlert 
        type="warning" 
        variant="tonal"
        density="compact"
      >
        <strong>Армия передана стране:</strong> {{ leasedTo }}
      </VAlert>
    </VCardText>
    
        <!-- Показываем информацию о том, что Волоцкий (Воевода) не может двигать армию армии -->
    <VCardText v-if="armyProtectingCaravan">
      <VAlert 
        type="warning" 
        variant="tonal"
        density="compact"
      >
        <strong>Армии воеводы нельзя передвигать:</strong> 
      </VAlert>
    </VCardText>


    <!-- Показываем предупреждение о блокировке движения для Великого князя -->
    <VCardText v-if="hasNoArmyMovementEffect">
      <VAlert 
        type="error" 
        variant="tonal"
        density="compact"
        prepend-icon="ri-error-warning-line"
      >
        <strong>⚠️ Армию нельзя перемещать</strong><br>
        Великий князь не может командовать армией (эффект "Личный визит")
      </VAlert>
    </VCardText>

    <VCardActions>
      <!-- Если армия передана - показываем только кнопку возврата -->
      <template v-if="isLeased">
        <VBtn 
          color="success"
          prepend-icon="ri-arrow-go-back-line"
          @click="unleaseArmy(army.id)"
          block
        >
          Вернуть армию
        </VBtn>
      </template>
      
      <!-- Если армия НЕ передана - показываем все обычные действия -->
      <template v-else>
        <VBtn @click="attack_dialog = true">Атаковать</VBtn>
        <VDialog
          v-model="attack_dialog"
          width="auto"
        >
          <VCard
            width="400"
            title="Кого?"
          >
            <VCardText>
              <v-autocomplete
                v-model="enemy"
                :items="armies"
                label="Армия"
                :item-title="item => `${item.name}(${item.settlement?.name})`"
                item-value="id"
                clearable
                persistent-hint
              ></v-autocomplete>
            </VCardText>
            <template v-slot:actions>
              <VBtn
                class="ms-auto"
                text="Атаковать"
                @click="armyAttack(army.id, enemy)"
              ></VBtn>
              <VBtn
                class="ms-auto"
                text="Отмена"
                @click="attack_dialog = false"
              ></VBtn>
            </template>
          </VCard>
        </VDialog>

        <VBtn @click="goto_dialog = true">Перейти</VBtn>
        <VDialog
          v-model="goto_dialog"
          width="auto"
        >
          <VCard
            width="400"
            title="Куда?"
          >
            <VCardText>
              <v-autocomplete
                v-model="settle"
                :items="settlements"
                label="Город"
                item-title="name"
                item-value="id"
                clearable
                persistent-hint
              ></v-autocomplete>
            </VCardText>
            <template v-slot:actions>
              <VBtn
                class="ms-auto"
                text="Перейти"
                @click="armyGoto(army.id, settle)"
              ></VBtn>
              <VBtn
                class="ms-auto"
                text="Отмена"
                @click="goto_dialog = false"
              ></VBtn>
            </template>
          </VCard>
        </VDialog>
        <VSpacer />
        <IconBtn
          icon="ri-pencil-line"
          color="primary"
          @click="editArmyDialog = true"
          class="mr-2"
        />
        <IconBtn
          icon="ri-delete-bin-line"
          color="error"
          @click="removeArmy(army.id)"
        />
      </template>
    </VCardActions>
  </VCard>
  <ArmyDialog
    v-model="editArmyDialog"
    :army="army"
    :settlements="settlements"
    :nobles="nobles"
    :countries="countries"
    @submit="handleSubmit"
  />
</template>

<style scoped>
  .total-row {
    background-color: rgba(0, 0, 0, 0.05);
    font-weight: bold;
  }

  .delete-army-btn {
    margin-left: auto;
  }
</style>