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
  const region_id = ref(0);
  
  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/regions.json`) 
      .then(response => {
        regions.value = response.data;
        if (regions.value.length > 0) {
          region_id.value = regions.value[0].id;
        }
      })
  })

  async function runAction(noble_job_id, action_id){
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        job_id: noble_job_id,
        params: {region_id: region_id.value}
      })
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item
      subtitle="Эффект"
    >Тайный советник убирает со стратегической карты одну из армий мятежников по своему выбору или повышает общественный порядок в регионе на 5, если он ниже 0.</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Параметры</v-list-subheader>

    <v-list-item>
      <v-select
        label="Выберите регион"
        :items="regions"
        v-model="region_id"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Выполнить" variant="tonal" color="primary" @click="runAction(noble_job.id, action.id)"></v-btn>
  </v-card-text>
</template>

