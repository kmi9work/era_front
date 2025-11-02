<script setup>
  import axios from 'axios'
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
    upgrade_paths:{
      type: Object,
      required: true
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

  const tt_counts = ref([]);

  const selected_troop_types = ref([]); // Массив выбранных типов отрядов

  const editArmyDialog = ref(false)

  // Получаем имя следующего уровня улучшения
  function getNextLevelName(currentId) {
    const nextId = props.upgrade_paths[currentId];
    if (!nextId) return null;
    return props.troop_types.find(t => t.id === nextId)?.name;
  }

  // Проверяем, можно ли улучшить отряд с fromType до toType
  function canUpgradeTo(fromType, toType) {
    let current = props.troop_types.find(t => t.name === fromType);
    if (!current) return false;
    
    while (current) {
      if (current.name === toType) return true;
      const nextId = props.upgrade_paths[current.id];
      if (!nextId) break;
      current = props.troop_types.find(t => t.id === nextId);
    }
    return false;
  }


  // Вычисляем общую стоимость улучшений
  const totalCost = computed(() => {
    const cost = {};
    
    selected_troop_types.value.forEach((troopType, index) => {
      if (!troopType) return;
      
      const existingTroop = props.army.troops[index];
      const targetTroop = props.troop_types.find(t => t.name === troopType);
      if (!targetTroop) return;
      
      if (existingTroop) {
        // Улучшение существующего отряда
        const currentTroopType = props.troop_types.find(t => t.id === existingTroop.troop_type.id);
        if (!currentTroopType || currentTroopType.name === troopType) return;
        
        let currentId = currentTroopType.id;
        let found = false;
        
        while (currentId && !found) {
          const nextId = props.upgrade_paths[currentId];
          if (!nextId) break;
          
          const nextTroop = props.troop_types.find(t => t.id === nextId);
          if (!nextTroop) break;
          
          nextTroop.params.buy_cost?.forEach(res => {
            cost[res.identificator] = (cost[res.identificator] || 0) + res.count;
          });
          
          if (nextTroop.id === targetTroop.id) found = true;
          currentId = nextId;
        }
      } else {
        // Создание нового отряда
        let currentId = 1;
        let found = false;
        
        while (currentId && !found) {
          const troop = props.troop_types.find(t => t.id === currentId);
          if (!troop) break;
          
          troop.params.buy_cost?.forEach(res => {
            cost[res.identificator] = (cost[res.identificator] || 0) + res.count;
          });
          
          if (troop.id === targetTroop.id) found = true;
          currentId = props.upgrade_paths[currentId];
        }
      }
    });

    // Фильтрация нулевых значений
    return Object.fromEntries(
      Object.entries(cost).filter(([_, count]) => count > 0)
    );
  });

  // Доступные для выбора типы отрядов
  const availableTroopTypes = computed(() => {
    return props.troop_types.filter(troop => {
      // Для новых отрядов проверяем, что можно добавить
      if (props.army.troops.length < 3) return true;
      // Для существующих отрядов всегда доступны варианты улучшения
      return true;
    });
  });

  watch(add_troop_dialog, (newVal) => {
    if (newVal) {
      selected_troop_types.value = props.army.troops.map(t => t.troop_type.name);
    }
  });

  // Добавляем/улучшаем отряды
  async function createTroops() {
    try {
      // Создаем массив промисов для создания/обновления отрядов
      const promises = selected_troop_types.value.map(async (troopType, index) => {
        const existingTroop = props.army.troops[index];
        
        if (existingTroop) {
          // Улучшаем существующий отряд
          if (existingTroop.troop_type.name !== troopType) {
            return axios.patch(`${import.meta.env.VITE_PROXY}/troops/${existingTroop.id}/upgrade.json`, {
              target_type_id: props.troop_types.find(t => t.name === troopType).id
            });
          }
        } else {
          // Создаем новый отряд
          return axios.post(`${import.meta.env.VITE_PROXY}/armies/${props.army.id}/troops.json`, {
            troop_type_id: props.troop_types.find(t => t.name === troopType).id
          });
        }
      });

      // Выполняем все запросы
      await Promise.all(promises.filter(Boolean));
      emit('update-armies');
      add_troop_dialog.value = false;
      selected_troop_types.value = [];
    } catch (error) {
      console.error('Ошибка при создании отрядов:', error);
      alert('Произошла ошибка при создании отрядов');
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

  onBeforeMount(async () => {
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
  <VCard :title="`${army.name} - ${army.power}`" width="400">
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
            width="1200"
            title="Формирование армии"
          >
            <VCardText>
              <!-- Отображение текущих отрядов -->
              <div v-for="(troop, index) in army.troops" :key="troop.id" class="mb-4">
                <h3>Текущий отряд {{ index + 1 }}: {{ troop.troop_type.name }}</h3><br>
                <VSelect
                  v-model="selected_troop_types[index]"
                  :items="availableTroopTypes.filter(t => 
                    t.name === troop.troop_type.name || 
                    canUpgradeTo(troop.troop_type.name, t.name)
                  )"
                  item-title="name"
                  item-value="name"
                  :label="`Улучшить отряд ${index + 1}`"
                  clearable
                />
              </div>
              
              <!-- Добавление новых отрядов -->
              <div v-for="index in 3 - army.troops.length" :key="'new-'+index" class="mb-4">
                <h3>Новый отряд {{ army.troops.length + index }}</h3>
                <VSelect
                  v-model="selected_troop_types[army.troops.length + index - 1]"
                  :items="availableTroopTypes"
                  item-title="name"
                  item-value="name"
                  label="Выберите тип отряда"
                  clearable
                />
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
                :disabled="selected_troop_types.filter(Boolean).length === 0"
              >
                Подтвердить
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
      <template v-if="army.hidden">
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