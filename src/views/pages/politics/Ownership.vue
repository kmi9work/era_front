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
  const main_settle = ref({})

  async function updateOwnership(){
    await axios.get(`${import.meta.env.VITE_PROXY}/${props.type}s/${props.id}.json`) 
      .then(response => {
        ownership.value = response.data;
        title.value = (props.type === 'settlement') ? response.data.name : response.data.title
        main_settle.value = (props.type === 'settlement') ? response.data : response.data.capital
      })
      .catch(e => {
      });
  }

  onBeforeMount(async () => {
    updateOwnership();
  })

  async function removeBuilding(building_id) {
    await axios.delete(`${import.meta.env.VITE_PROXY}/buildings/${building_id}.json`)
      .then(async (res) => {
        if (props.type === 'settlement'){
          updateOwnership();
        }
      })
      .catch((error) => {
      })
  };

  async function upgradeBuilding(building_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/buildings/${building_id}/upgrade.json`)
      .then(async (res) => {
        if (props.type === 'settlement'){
          updateOwnership();
        }
      })
      .catch((error) => {
      })
  };


</script>

<template>
  <VCard :title="title">
    <VCardText v-if="ownership.player">
      {{ownership.player?.name}} | {{ownership.player?.job?.name}}
    </VCardText>

    <VCardText>
      <ul>
        <li v-for="building in main_settle.buildings">
          {{building.building_level?.building_type?.title}} - {{building.building_level?.level}} 
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
        </li>
      </ul>
    </VCardText>

    <VCardActions>
      <VBtn>Location</VBtn>
      <VBtn>Reviews</VBtn>
    </VCardActions>
  </VCard>
</template>

