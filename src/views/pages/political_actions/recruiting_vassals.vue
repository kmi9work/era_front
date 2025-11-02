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

  async function runAction(noble_job_id, action_id){
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        job_id: noble_job_id,
        params: {}
      })
    alert("Общественный порядок во всех регионах Руси снижается на 1");
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item
      subtitle="Эффект"
    >Общественный порядок во всех регионах Руси снижается на 1. Нужно дать армию из одного отряда пехотинцев воеводе или добавить в имеющуюся.</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Выполнить" variant="tonal" color="primary" @click="runAction(noble_job.id, action.id)"></v-btn>
  </v-card-text>
</template>