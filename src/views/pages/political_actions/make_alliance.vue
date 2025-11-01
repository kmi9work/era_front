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
  const partner_country_id = ref(0);
  const alliance_types = ref([
    {name: 'Военный союз', value: 'military'},
    {name: 'Торговый союз', value: 'trade'},
    {name: 'Династический брак', value: 'dynastic'}
  ]);
  const alliance_type = ref('military');
  
  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json`) 
      .then(response => {
        countries.value = response.data;
        if (countries.value.length > 0) {
          country_id.value = countries.value[0].id;
          partner_country_id.value = countries.value[0].id;
        }
      })
  })

  async function runAction(noble_job_id, action_id){
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        job_id: noble_job_id,
        params: {
          country_id: country_id.value, 
          partner_country_id: partner_country_id.value,
          alliance_type: alliance_type.value
        }
      })
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item
      subtitle="Эффект"
    >Заключается союз между двумя странами выбранного типа.</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Параметры</v-list-subheader>

    <v-list-item>
      <v-select
        label="Страна 1"
        :items="countries"
        v-model="country_id"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>

    <v-list-item>
      <v-select
        label="Страна 2"
        :items="countries"
        v-model="partner_country_id"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>

    <v-list-item>
      <v-select
        label="Тип союза"
        :items="alliance_types"
        v-model="alliance_type"
        item-title="name"
        item-value="value"
      ></v-select>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Выполнить" variant="tonal" color="primary" @click="runAction(noble_job.id, action.id)"></v-btn>
  </v-card-text>
</template>

