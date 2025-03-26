<script setup>
  import axios from 'axios'
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
  })

  const emit = defineEmits(['update-armies']);

  const attack_dialog = ref(false);
  const add_troop_dialog = ref(false);
  const goto_dialog = ref(false);
  const settle = ref(null);
  const enemy = ref(null);

  onBeforeMount(async () => {
    // updateArmy();
  })

  async function removeTroop(troop_id) {
    await axios.delete(`${import.meta.env.VITE_PROXY}/troops/${troop_id}.json`)
      .then(async (response) => {
        emit('update-armies')
      })
  };

  async function upgradeTroop(troop_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/troops/${troop_id}/upgrade.json`)
      .then(async (response) => {
        emit('update-armies')
      })
  };

  async function payForTroop(troop_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/troops/${troop_id}/pay_for.json`)
      .then(async (response) => {
        emit('update-armies')
      })
  };

  async function armyGoto(army_id, settlement_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/armies/${army_id}/goto/${settlement_id}.json`)
      .then(async (response) => {
        goto_dialog.value = false;
        emit('update-armies')
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
            max-width="400"
            title=""
          >
            <VCardText>
              Здесь сложный выбор новых отрядов
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

