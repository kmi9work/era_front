<script setup>
  import axios from 'axios'
  import stone_brick from '@images/resources/stone_brick.png'
  import weapon from '@images/resources/weapon.png'
  import tools from '@images/resources/tools.png'
  import timber from '@images/resources/timber.png'
  import stone from '@images/resources/stone.png'
  import metal_ore from '@images/resources/metal_ore.png'
  import metal from '@images/resources/metal.png'
  import meat from '@images/resources/meat.png'
  import luxury from '@images/resources/luxury.png'
  import horses from '@images/resources/horses.png'
  import grain from '@images/resources/grain.png'
  import gems from '@images/resources/gems.png'
  import food from '@images/resources/food.png'
  import flour from '@images/resources/flour.png'
  import boards from '@images/resources/boards.png'
  import armor from '@images/resources/armor.png'
  import money from '@images/resources/money.png'

  const resources = {
    'stone_brick': {
      'img': stone_brick,
      'name': 'Каменный кирпич'
    },
    'weapon': {
      'img': weapon,
      'name': 'Оружие'
    },
    'tools': {
      'img': tools,
      'name': 'Инструменты'
    },
    'timber': {
      'img': timber,
      'name': 'Брёвна'
    },
    'stone': {
      'img': stone,
      'name': 'Камень'
    },
    'metal_ore': {
      'img': metal_ore,
      'name': 'Железная руда'
    },
    'metal': {
      'img': metal,
      'name': 'Металл'
    },
    'meat': {
      'img': meat,
      'name': 'Мясо'
    },
    'luxury': {
      'img': luxury,
      'name': 'Роскошь'
    },
    'horses': {
      'img': horses,
      'name': 'Лошади'
    },
    'grain': {
      'img': grain,
      'name': 'Зерно'
    },
    'gems': {
      'img': gems,
      'name': 'Драгоценный металл'
    },
    'food': {
      'img': food,
      'name': 'Провизия'
    },
    'flour': {
      'img': flour,
      'name': 'Мука'
    },
    'flour': {
      'img': flour,
      'name': 'Мука'
    },
    'boards': {
      'img': boards,
      'name': 'Доски'
    },
    'armor': {
      'img': armor,
      'name': 'Доспехи'
    },
    'money': {
      'img': money,
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
    }
  })

  const emit = defineEmits(['update-armies']);

  const attack_dialog = ref(false);
  const add_troop_dialog = ref(false);
  const goto_dialog = ref(false);
  const settle = ref(null);
  const enemy = ref(null);

  const tt_counts = ref([]);

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
    // updateArmy();
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

  async function upgradeTroop(troop_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/troops/${troop_id}/upgrade.json`)
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
    await axios.patch(`${import.meta.env.VITE_PROXY}/armies/${army_id}/attack/${enemy_id}.json`)
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

  

  // async function addBuilding(bt_id) {
  //   await axios.post(`${import.meta.env.VITE_PROXY}/settlements/${main_settle.value.id}/build.json?building_type_id=${bt_id}`)
  //     .then(async (response) => {
  //       add_building_dialog.value = false;
  //       updateOwnership();
  //     })
  // };

  // async function changeOwner(player_id) {
  //   await axios.patch(`${import.meta.env.VITE_PROXY}/settlements/${main_settle.value.id}.json?settlement[player_id]=${player_id}`)
  //     .then(async (response) => {
  //       change_owner_dialog.value = false;
  //       updateOwnership();
  //     })
  // };

  // async function removeOwner() {
  //   await axios.patch(`${import.meta.env.VITE_PROXY}/settlements/${main_settle.value.id}.json?settlement[player_id]=`)
  //     .then(async (response) => {
  //       change_owner_dialog.value = false;
  //       updateOwnership();
  //     })
  // };

  // function superEmit(name){
  //   emit(name);
  // }

  const getIdentificator = (index) => {
    const troopWithResource = props.troop_types.find(troop => troop.params.buy_cost?.[index]);
    return troopWithResource?.params.buy_cost[index]?.identificator;
  };


  const calculateTotal = (resourceIndex) => {
    return props.troop_types.reduce((sum, troop, tt_idx) => {
      const resource = troop.params.buy_cost?.[resourceIndex];
      if (resource) {
        return sum + (resource.count * tt_counts.value[tt_idx]);
      }
      return sum;
    }, 0);
  };


</script>

<template>
  <VCard :title="`${army.owner?.name} - ${army.power}`" width="400">
    <VCardText>
      <v-table>
        <tbody>
          <tr v-for="troop in army.troops">
            <td>
              {{troop.troop_type?.name}}
            </td>
            <td>
              {{troop.power}}
            </td>
            <td>
              <span v-if="troop.damage > 0" style="color: red">{{troop.health}}/{{troop.max_health}}</span>
              <span v-else>{{troop.health}}/{{troop.max_health}}</span>
            </td>
            <td>
              <VBtn 
                :color="troop.is_paid ? 'success' : 'error'"
                @click="payForTroop(troop.id)"
              >
                Оплата
              </VBtn>
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="army.troops.length < 3" class="text-center pa-4">
        <IconBtn
            icon="ri-arrow-up-circle-line"
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
            title=""
          >
            <VCardText>
              <v-table>
                <tbody>
                  <tr v-for="(troop_type, tt_idx) in troop_types">
                    <td width="100">
                      {{troop_type.name}}
                    </td>
                    <td v-for="idx in maxBuyCostLength">
                      <div style="display: inline-block; font-size: 30px">{{troop_type.params['buy_cost'][idx-1]?.count}}</div>
                      <div style="display: inline-block;">
                        <VImg
                          :height="30"
                          :width="30"
                          :src="resources[troop_type.params['buy_cost'][idx-1]?.identificator]?.img"
                          :title="resources[troop_type.params['buy_cost'][idx-1]?.identificator]?.name"
                        />
                      </div>
                    </td>
                    <td width="300">
                      Количество: {{tt_counts[tt_idx]}}
                      <IconBtn
                        icon="ri-arrow-up-circle-line"
                        class="me-1"
                        @click="tt_counts[tt_idx] += 1"
                      />
                      <IconBtn
                        icon="ri-arrow-down-circle-line"
                        class="me-1"
                        @click="tt_counts[tt_idx] -= 1"
                      />
                    </td>
                  </tr>
                  <tr class="total-row">
                    <td><strong>Итого нужно:</strong></td>
                    <td v-for="idx in maxBuyCostLength" :key="'total-'+idx">
                      <div style="display: inline-block; font-size: 30px">
                        {{ calculateTotal(idx-1) }}
                      </div>
                      <div style="display: inline-block;">
                        <VImg
                          :height="30"
                          :width="30"
                          :src="resources[getIdentificator(idx-1)]?.img"
                          :title="resources[getIdentificator(idx-1)]?.name"
                        />
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </v-table>
            </VCardText>
            <template v-slot:actions>
              <VBtn
                class="ms-auto"
                text="Отмена"
                @click="add_troop_dialog = false"
              ></VBtn>
            </template>
          </VCard>
        </VDialog>
      </div>
    </VCardText>
    <VCardText>
      Город: {{army.settlement?.name}}
    </VCardText>

    <VCardActions>
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
              item-title="owner.name"
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
    </VCardActions>
  </VCard>
</template>

<style scoped>
  .total-row {
    background-color: rgba(0, 0, 0, 0.05);
    font-weight: bold;
  }
</style>