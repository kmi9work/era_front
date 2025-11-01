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

  const countries = ref([]);
  const country1 = ref(0);
  const country2 = ref(0);
  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`) 
      .then(response => {
        countries.value = response.data;
        country1.value = countries.value[0].id;
        country2.value = countries.value[0].id;
      })
  })

  async function runAction(noble_job_id, action_id){
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        job_id: noble_job_id,
        params: {country_ids: [country1.value, country2.value]}
      })
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item
      subtitle="Эффект"
    >Отношения с выбранными странами улучшаются на 1 пункт.</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Параметры</v-list-subheader>

    <v-list-item>
      <v-select
        label="Страна 1"
        :items="countries"
        v-model="country1"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>

    <v-list-item>
      <v-select
        label="Страна 2"
        :items="countries"
        v-model="country2"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Выполнить" variant="tonal" color="primary" @click="runAction(noble_job.id, action.id)"></v-btn>
  </v-card-text>
</template>