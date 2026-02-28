<script setup>
  import axios from 'axios'
  const props = defineProps({
    noble_job: {
      type: Object,
      required: true,
    },
    action: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['close-dialog']);

  const regions = ref([]);
  const region = ref(0);
  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=0`) 
      .then(response => {
        regions.value = response.data;
        region.value = regions.value[0].id;
      })
  })

  async function runAction(noble_job_id, action_id){
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        success: true,
        job_id: noble_job_id,
        params: {region_id: region.value}
      })
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item
      subtitle="Эффект"
    >Общественный порядок в выбранном регионе увеличивается на 5.</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Параметры</v-list-subheader>

    <v-list-item>
      <v-select
        label="Регион"
        :items="regions"
        v-model="region"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Выполнить" variant="tonal" color="primary" @click="runAction(noble_job.id, action.id)"></v-btn>
  </v-card-text>
</template>