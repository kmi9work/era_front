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
  const country_id = ref(0);
  const armies = ref([]);
  const army_id = ref(0);
  
  onBeforeMount(async () => {
    // Загружаем страны
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`) 
      .then(response => {
        countries.value = response.data;
        if (countries.value.length > 0) {
          country_id.value = countries.value[0].id;
        }
      })
    
    // Загружаем армии
    await axios.get(`${import.meta.env.VITE_PROXY}/armies.json`) 
      .then(response => {
        armies.value = response.data;
        if (armies.value.length > 0) {
          army_id.value = armies.value[0].id;
        }
      })
  })

  async function runAction(noble_job_id, action_id){
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        job_id: noble_job_id,
        params: {country_id: country_id.value, army_id: army_id.value}
      })
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item
      subtitle="Эффект"
    >Отношения с выбранным соседом не падают ниже "Нейтральных". Если отношения были ниже «Нейтральных» - они повышаются до «Нейтральных». Великий князь не может создавать или улучшать свою армию, пока она в распоряжении соседа.</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Параметры</v-list-subheader>

    <v-list-item>
      <v-select
        label="Выберите армию"
        :items="armies"
        v-model="army_id"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>

    <v-list-item>
      <v-select
        label="Передать стране"
        :items="countries"
        v-model="country_id"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Выполнить" variant="tonal" color="primary" @click="runAction(noble_job.id, action.id)"></v-btn>
  </v-card-text>
</template>

