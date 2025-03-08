<script setup>
  import axios from 'axios'
  const props = defineProps({
    noble: {
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

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=0`) 
      .then(response => {
        regions.value = response.data;
      })
  })


  async function runAction(noble_id, action_id, success){
    let params = {};
    let region = {}
    if (!success){
      region = regions.value[Math.floor(Math.random() * regions.value.length)]
      params = {region_id: region.id}
    }

    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        success: success,
        player_id: noble_id,
        params: params
      })
    if (!success) alert(`Общественный порядок упал в регионе ${region.name}`);
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>
    <v-list-item>{{action.description}}</v-list-item>

    <v-list-item
      subtitle="Успех"
    >{{action.success}}</v-list-item>

    <v-list-item
      subtitle="Неудача"
    >{{action.failure}}</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>

    <v-list-item
      subtitle="Вероятность"
    >{{action.probability}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Параметры</v-list-subheader>
    
    <v-list-item>В случае неудачи регион будет выбран случайно программой</v-list-item>

  </v-list>
  <v-card-text>
    <v-btn text="Успех" variant="text" @click="runAction(noble.id, action.id, true)"></v-btn>
    <v-btn text="Неудача" variant="text" @click="runAction(noble.id, action.id, false)"></v-btn>
  </v-card-text>
</template>