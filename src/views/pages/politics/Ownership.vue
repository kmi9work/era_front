<script setup>
  import axios from 'axios'
  const props = defineProps({
    id: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  })

  const ownership = ref({});
  const title = ref('');
  const main_settle = ref({});
  const building_types = ref([]);
  const add_building_dialog = ref(false);
  const change_owner_dialog = ref(false);
  const nobles = ref([]);

  const filteredBuildingTypes = computed(() => {
      return building_types.value.filter(bt => 
        !main_settle.value.buildings?.map(
          (b) => b.building_level?.building_type?.id
        )?.includes(bt.id)
      )
  })

  async function updateOwnership(){
    await axios.get(`${import.meta.env.VITE_PROXY}/${props.type}s/${props.id}.json`) 
      .then(response => {
        ownership.value = response.data;
        title.value = (props.type === 'settlement') ? response.data.name : response.data.title
        main_settle.value = (props.type === 'settlement') ? response.data : response.data.capital
      })
  }

  onBeforeMount(async () => {
    updateOwnership();
    await axios.get(`${import.meta.env.VITE_PROXY}/building_types.json`)
      .then(async (response) => {
        building_types.value = response.data;
      })
    await axios.get(`${import.meta.env.VITE_PROXY}/players.json`) 
      .then(response => {
        nobles.value = response.data.filter((player) => player.player_type?.id == 2); // 2 - Знать
      })
  })

  async function removeBuilding(building_id) {
    await axios.delete(`${import.meta.env.VITE_PROXY}/buildings/${building_id}.json`)
      .then(async (response) => {
        updateOwnership();
      })
  };

  async function upgradeBuilding(building_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/buildings/${building_id}/upgrade.json`)
      .then(async (response) => {
        updateOwnership();
      })
  };

  async function addBuilding(bt_id) {
    await axios.post(`${import.meta.env.VITE_PROXY}/settlements/${main_settle.value.id}/build.json?building_type_id=${bt_id}`)
      .then(async (response) => {
        add_building_dialog.value = false;
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


</script>

<template>
  <VCard :title="title" min-width="300px">
    <VCardText v-if="main_settle.player">
      {{main_settle.player?.name}} | {{main_settle.player?.job?.name}}
    </VCardText>

    <VCardText>
      <v-table>
        <tbody>
          <tr v-for="building in main_settle.buildings">
            <td>
              {{building.building_level?.building_type?.title}} - {{building.building_level?.level}} 
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
                  @click="upgradeBuilding(building.id)"
                />
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="filteredBuildingTypes.length > 0 && main_settle.player?.id" class="text-center pa-4">
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
                @click="addBuilding(item.id)"
              >
                <template v-slot:prepend>
                  <VIcon :icon="item.icon"></VIcon>
                </template>

                <VListItemTitle v-text="item.title"></VListItemTitle>
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
    </VCardText>

    <VCardActions>
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
    </VCardActions>
  </VCard>
</template>

