<script setup>
  import axios from 'axios'
  import CaptureRegion from '@/views/pages/politics/CaptureRegion.vue'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'

  // Владение в разрезе текущего государства (ТЗ № 2, § 4): кнопка «Передать регион»
  // показывается для регионов, принадлежащих НЕ текущему государству — прежде
  // условие было жёстко «не Русь».
  const { currentCountryId, loadCurrentCountry } = useCurrentCountry()

  onBeforeMount(() => {
    loadCurrentCountry()
  })

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

  // Поиск по знати: владельца можно передать знатному игроку любой страны,
  // поэтому список длинный (знать всех государств).
  const noble_search = ref('');
  const filteredNobles = computed(() => {
    const query = noble_search.value.trim().toLowerCase();
    if (!query) return props.nobles;

    return props.nobles.filter(noble =>
      `${noble.name} ${noble.countryName || ''}`.toLowerCase().includes(query)
    );
  });

  const builder_choice_dialog = ref(false);
  const current_building_action = ref({ type: '', id: null, building_type_id: null }); // Добавим building_type_id

  const filteredBuildingTypes = computed(() => {
      return props.building_types.filter(bt => 
        !main_settle.value.buildings?.map(
          (b) => b.building_level?.building_type?.id
        )?.includes(bt.id)
      )
  })

  const sortedBuildings = computed(() => {
    if (!main_settle.value.buildings) return []
    
    return main_settle.value.buildings.sort((a, b) => {
      const typeA = a.building_level?.building_type?.name || ''
      const typeB = b.building_level?.building_type?.name || ''
      return typeA.localeCompare(typeB)
    })
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

  const delete_building_dialog = ref(false);
  const building_to_delete = ref(null);

  // Удаление постройки: если за постройкой числится начисленное влияние (штрафы
  // за неоплаченную церковь), мастер сам решает, удалять ли его вместе с ней.
  function askRemoveBuilding(building) {
    if ((building.influence_items_count || 0) > 0) {
      building_to_delete.value = building;
      delete_building_dialog.value = true;
      return;
    }
    removeBuilding(building.id);
  }

  function influenceSummary(items) {
    if (!items || items.length === 0) return 'нет';

    const total = items.reduce((sum, item) => sum + (item.value || 0), 0);
    const details = items
      .map(item => `${item.value > 0 ? '+' : ''}${item.value} за «${item.comment || 'без комментария'}», год ${item.year}${item.player_name ? `, ${item.player_name}` : ''}`)
      .join('; ');

    return items.length > 1 ? `${total}: ${details}` : details;
  }

  async function removeBuilding(building_id, deleteInfluence = false) {
    const params = deleteInfluence ? '?delete_influence=1' : '';

    await axios.delete(`${import.meta.env.VITE_PROXY}/buildings/${building_id}.json${params}`)
      .then(async (response) => {
        delete_building_dialog.value = false;
        building_to_delete.value = null;
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

  // Функция для проверки, нужно ли показывать диалог выбора строителя
  function shouldShowBuilderDialog(action, id, building_type_id = null) {
    // Для добавления здания: не показываем диалог для церкви (id=1) - сразу применяем бонус мастера
    if (action === 'add') {
      return false; // Убираем диалог для всех зданий при создании
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
  }

  async function payChurch(building_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/buildings/${building_id}/pay_for_maintenance.json`)
      .then(async (response) => {
        updateOwnership();
      })
  };
</script>

<template>
  <VCard :title="name" width="350">
    <VCardText v-if="main_settle.player">
      {{main_settle.player?.name}}<template v-if="main_settle.player?.country"> ({{ main_settle.player.country.short_name || main_settle.player.country.name }})</template> | {{main_settle.player?.jobs.map((j) => j.name)?.join(", ")}}
      <IconBtn
          icon="ri-close-line"
          class="me-1"
          @click="removeOwner(main_settle.id)"
        />
    </VCardText>

    <VCardText>
      <v-table>
        <tbody>
          <tr v-for="building in sortedBuildings">
            <td>
              <span :style="building.fined ? 'color: red' : ''">
                {{building.building_level?.building_type?.name}} - {{building.building_level?.level}} 
              </span>
            </td>
            <td>
              <IconBtn
                  icon="ri-delete-bin-line"
                  class="me-1"
                  @click="askRemoveBuilding(building)"
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
      
      <!-- Удаление постройки: за церковью может числиться начисленное влияние -->
      <VDialog
        v-model="delete_building_dialog"
        width="auto"
      >
        <VCard
          max-width="460"
          title="Удалить постройку?"
        >
          <VCardText v-if="building_to_delete">
            {{ building_to_delete.building_type_name || 'Постройка' }} —
            {{ building_to_delete.building_level_name }}.
            Начислено влияния: {{ influenceSummary(building_to_delete.influence_items) }}.
            Удалить это влияние вместе с постройкой?
          </VCardText>

          <VCardActions>
            <VBtn
              color="error"
              @click="removeBuilding(building_to_delete.id, true)"
            >
              Удалить с влиянием
            </VBtn>
            <VBtn
              color="primary"
              @click="removeBuilding(building_to_delete.id, false)"
            >
              Удалить только постройку
            </VBtn>
            <VBtn
              class="ms-auto"
              text="Отмена"
              @click="delete_building_dialog = false"
            ></VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
      
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
              v-if="current_building_action.building_type_id == 1"
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
            <VCardText class="pb-0">
              <VTextField
                v-model="noble_search"
                label="Поиск по имени или стране"
                density="compact"
                prepend-inner-icon="ri-search-line"
                clearable
              />
            </VCardText>
            <VList>
              <VListItem
                v-for="(noble, i) in filteredNobles"
                :key="i"
                :value="noble.id"
                color="primary"
                rounded="xl"
                @click="changeOwner(noble.id)"
              >
                <VListItemTitle v-text="`${noble.name}`"></VListItemTitle>
                <VListItemSubtitle
                  v-if="noble.countryName"
                  v-text="noble.countryName"
                />
              </VListItem>
              <VListItem v-if="filteredNobles.length === 0">
                <VListItemTitle>Никого не найдено</VListItemTitle>
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
      <template v-if="type == 'region' && ownership.country?.id != currentCountryId">
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