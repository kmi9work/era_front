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
  const technologies = ref([]);
  const chosen_tech = ref(0);

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/ideologist_technologies.json`) 
      .then(response => {
        technologies.value = response.data;
        chosen_tech.value = technologies.value[0];
      })
  })

  async function runAction(noble_id, action_id, success){
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        success: success,
        player_id: noble_id,
        params: {technology_id: chosen_tech.value}
      })
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

    <v-list-item>
      <template v-slot:prepend>
        <v-list-item-action start>
          <v-select
            label="Игрок"
            :items="technologies"
            v-model="chosen_tech"
            item-title="name"
            item-value="id"
          ></v-select>
        </v-list-item-action>
      </template>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Успех" variant="text" @click="runAction(noble.id, action.id, true)"></v-btn>
    <v-btn text="Неудача" variant="text" @click="runAction(noble.id, action.id, false)"></v-btn>
  </v-card-text>
</template>