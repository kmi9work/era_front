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

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`)
      .then(response => {
        countries.value = response.data;
        if (countries.value.length > 0) {
          country_id.value = countries.value[0].id;
        }
      })
  })

  async function runAction(noble_job_id, action_id, success){
    const params = success ? { country_id: country_id.value } : {};

    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        success: success,
        job_id: noble_job_id,
        params: params
      })
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>
    <v-list-item>{{action.description}}</v-list-item>

    <v-list-item subtitle="Успех">{{action.success}}</v-list-item>
    <v-list-item subtitle="Неудача">{{action.failure}}</v-list-item>
    <v-list-item subtitle="Стоимость">{{action.cost}}</v-list-item>
    <v-list-item subtitle="Вероятность">{{action.probability}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Параметры</v-list-subheader>
    <v-list-item>
      <v-select
        label="Выберите страну (для успеха)"
        :items="countries"
        v-model="country_id"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Успех" variant="text" @click="runAction(noble_job.id, action.id, true)"></v-btn>
    <v-btn text="Неудача" variant="text" @click="runAction(noble_job.id, action.id, false)"></v-btn>
  </v-card-text>
</template>
