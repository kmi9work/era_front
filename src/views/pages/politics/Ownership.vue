<script setup>
  import axios from 'axios'
  import CaptureRegion from '@/views/pages/politics/CaptureRegion.vue'
  const props = defineProps({
    id: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    countries: {
      type: Array,
      required: true
    },
    nobles: {
      type: Array,
      required: true
    },
    building_types: {
      type: Array,
      required: true
    },
  })

  const emit = defineEmits(['capture-region']);

  const ownership = ref({});
  const name = ref('');
  const main_settle = ref({});
  const add_building_dialog = ref(false);
  const change_owner_dialog = ref(false);

  const builder_choice_dialog = ref(false);
  const current_building_action = ref({ type: '', id: null, building_type_id: null }); // Добавим building_type_id

  const filteredBuildingTypes = computed(() => {
      return props.building_types.filter(bt => 
        !main_settle.value.buildings?.map(
          (b) => b.building_level?.building_type?.id
        )?.includes(bt.id)
      )
  })

  async function updateOwnership(){
    await axios.get(`${import.meta.env.VITE_PROXY}/${props.type}s/${props.id}.json`) 
      .then(response => {
        ownership.value = response.data;
        name.value = response.data.name
        main_settle.value = (props.type === 'settlement') ? response.data : response.data.capital
      })
  }

  onBeforeMount(async () => {
    updateOwnership();
  })

  async function removeBuilding(building_id) {
    await axios.delete(`${import.meta.env.VITE_PROXY}/buildings/${building_id}.json`)
      .then(async (response) => {
        updateOwnership();
      })
  };

  async function changeOwner(player_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/settlements/${main_settle.value.id}.json?settlement[player_id]=${player_id}`)
      .then(async (response) => {
        change_owner_dialog.value = false;
        updateOwnership();
      })
  };

  async function removeOwner() {
    await axios.patch(`${import.meta.env.VITE_PROXY}/settlements/${main_settle.value.id}.json?settlement[player_id]=`)
      .then(async (response) => {
        change_owner_dialog.value = false;
        updateOwnership();
      })
  };

  function superEmit(name){
    emit(name);
  }

  async function addBuilding(bt_id, type) {
    builder_choice_dialog.value = false;
    let params = '';
    if (type == 'metropolitan')
      params = '&metropolitan_bonus=1'
    else if(type == 'zodchiy'){
      params = '&zodchiy_bonus=1'
    }

    await axios.post(`${import.meta.env.VITE_PROXY}/settlements/${main_settle.value.id}/build.json?building_type_id=${bt_id}${params}`)
      .then(async (response) => {
        add_building_dialog.value = false;
        updateOwnership();
      })
  };

  async function upgradeBuilding(building_id, type) {
    builder_choice_dialog.value = false;
    let params = '';
    if (type == 'metropolitan')
      params = '?metropolitan_bonus=1'
    else if(type == 'zodchiy'){
      params = '?zodchiy_bonus=1'
    }
    
    await axios.patch(`${import.meta.env.VITE_PROXY}/buildings/${building_id}/upgrade.json${params}`)
      .then(async (response) => {
        updateOwnership();
      })
  };

<<<<<<< Updated upstream
  function showBuilderChoice(action, id) {
    current_building_action.value = { type: action, id: id };
    builder_choice_dialog.value = true;
=======
  // Функция для проверки, нужно ли показывать диалог выбора строителя
  function shouldShowBuilderDialog(action, id, building_type_id = null) {
    // Для добавления здания: показываем только для церкви (id=1)
    if (action === 'add') {
      return building_type_id === 1;
    }
    
    // Для улучшения здания: получаем текущий уровень и проверяем, будет ли следующий уровень 3
    if (action === 'upgrade') {
      const building = main_settle.value.buildings.find(b => b.id === id);
      if (building && building.building_level && building.building_level.level === 2) {
        return true; // Улучшение до 3 уровня
      }
    }
    
    return false;
  }

  function showBuilderChoice(action, id, building_type_id = null) {
    // Проверяем, нужно ли показывать диалог
    if (shouldShowBuilderDialog(action, id, building_type_id)) {
      current_building_action.value = { type: action, id, building_type_id };
      builder_choice_dialog.value = true;
    } else {
      // Если диалог не нужен, сразу выполняем действие с параметром 'master'
      if (action === 'add') {
        addBuilding(id, 'master');
      } else if (action === 'upgrade') {
        upgradeBuilding(id, 'master');
      }
    }
>>>>>>> Stashed changes
  }

  async function payChurch(building_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/buildings/${building_id}/pay_for_maintenance.json`)
      .then(async (response) => {
        updateOwnership();
      })
  };
</script>

<template>
  <VCard width="350">
    <v-card-title>
      <span>
        {{name}}<br>
        <small><i>({{main_settle?.settlement_type?.name}})</i></small>
      </span>
    </v-card-title>
    <VCardText v-if="main_settle.player">
      {{main_settle.player?.name}} | {{main_settle.player?.jobs.map((j) => j.name)?.join(", ")}}
      <IconBtn
          icon="ri-close-line"
          class="me-1"
          @click="removeOwner(main_settle.id)"
        />
    </VCardText>

    <VCardText>
      <v-table>
        <tbody>
          <tr v-for="building in main_settle.buildings">
            <td>
              <span :style="building.fined ? 'color: red' : ''">
                {{building.building_level?.building_type?.name}} - {{building.building_level?.level}} 
              </span>
            </td>
            <td>
              <IconBtn
                  icon="ri-delete-bin-line"
                  class="me-1"
                  @click="removeBuilding(building.id)"
                />
              <IconBtn
                  icon="ri-arrow-up-circle-line"
                  class="me-1"
                  @click="showBuilderChoice('upgrade', building.id)"
                />
              <IconBtn
                  icon="ri-hand-coin-line"
                  :color="building.is_paid ? 'success' : 'error'"
                  class="me-1"
                  @click="payChurch(building.id)"
                  v-if="building.building_level?.building_type.id == 1"
                />
            </td>
          </tr>
        </tbody>
      </v-table>
      <div class="text-center pa-4">
        <IconBtn
            icon="ri-add-circle-line"
            class="me-1"
            fill="rgba(100,205,138,1)"
            @click="add_building_dialog = true"
          />

        <VDialog
          v-model="add_building_dialog"
          width="auto"
        >
          <VCard
            max-width="400"
            title="Выбрать здание"
          >
            <VList>
              <VListItem
                v-for="(item, i) in filteredBuildingTypes"
                :key="i"
                :value="item.id"
                color="primary"
                rounded="xl"
                @click="showBuilderChoice('add', item.id, item.id)"
              >
                <template v-slot:prepend>
                  <VIcon :icon="item.icon"></VIcon>
                </template>
                <VListItemTitle v-text="item.name"></VListItemTitle>
              </VListItem>
            </VList>
            <template v-slot:actions>
              <VBtn
                class="ms-auto"
                text="Отмена"
                @click="add_building_dialog = false"
              ></VBtn>
            </template>
          </VCard>
        </VDialog>
      </div>
      
      <!-- Модальное окно выбора строителя -->
      <VDialog
        v-model="builder_choice_dialog"
        width="auto"
      >
        <VCard
          width="600"
          title="Кто строит?"
        >
          <VCardText>
            Выберите, кому бонус за строительство:
          </VCardText>
          
          <VCardActions>
            <VBtn
              color="primary"
              @click="current_building_action.type === 'add' 
                ? addBuilding(current_building_action.id, 'metropolitan') 
                : upgradeBuilding(current_building_action.id, 'metropolitan')"
<<<<<<< Updated upstream
=======
              v-if="current_building_action.building_type_id == 1"
>>>>>>> Stashed changes
            >
              Митрополит
            </VBtn>
            
            <VBtn
              color="primary"
              v-if="current_building_action.type != 'add'"
              @click="current_building_action.type === 'add' 
                ? addBuilding(current_building_action.id, 'zodchiy') 
                : upgradeBuilding(current_building_action.id, 'zodchiy')"
            >
              Зодчий
            </VBtn>

            <VBtn
              color="primary"
              @click="current_building_action.type === 'add' 
                ? addBuilding(current_building_action.id, 'master') 
                : upgradeBuilding(current_building_action.id, 'master')"
            >
              Никому (Мастер строит)
            </VBtn>
            
            <VBtn
              class="ms-auto"
              text="Отмена"
              @click="builder_choice_dialog = false"
            ></VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </VCardText>

    <VCardActions>
      <template v-if="type == 'settlement'">
        <VBtn @click="change_owner_dialog = true">Передать</VBtn>
        <VDialog
          v-model="change_owner_dialog"
          width="auto"
        >
          <VCard
            width="400"
            title="Кому?"
          >
            <VList>
              <VListItem
                v-for="(noble, i) in nobles"
                :key="i"
                :value="noble.id"
                color="primary"
                rounded="xl"
                @click="changeOwner(noble.id)"
              >
                <VListItemTitle v-text="`${noble.name}`"></VListItemTitle>
              </VListItem>
            </VList>
            <template v-slot:actions>
              <VBtn
                class="ms-auto"
                text="Отмена"
                @click="change_owner_dialog = false"
              ></VBtn>
            </template>
          </VCard>
        </VDialog>
      </template>
      <template v-if="type == 'region' && ownership.country?.id != 1">
        <CaptureRegion 
          :countries="countries"
          :ownership="ownership"
          title="Передать регион"
          @capture-region="superEmit('capture-region')"
        />
      </template>
    </VCardActions>
  </VCard>
</template>