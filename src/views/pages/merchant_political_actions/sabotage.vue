<script setup>
  import axios from 'axios'
  const props = defineProps({
    action: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['close-dialog']);
  
  const guilds = ref([]);
  const selectedGuildId = ref(null);

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/guilds.json`) 
      .then(response => {
        guilds.value = response.data;
        if (guilds.value.length > 0) {
          selectedGuildId.value = guilds.value[0].id;
        }
      })
  })

  async function runAction(action_id, success){
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        success: success,
        player_id: 1, //Костыль - единственный купец
        guild_id: selectedGuildId.value,
      })
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

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
    
    <v-list-item>
      <v-select
        v-model="selectedGuildId"
        :items="guilds.map(g => ({ title: g.name, value: g.id }))"
        label="Выберите гильдию"
        variant="outlined"
        density="compact"
      ></v-select>
    </v-list-item>

    <v-divider></v-divider>
  </v-list>
  <v-card-text>
    <v-btn text="Успех" variant="text" @click="runAction(action.id, true)"></v-btn>
    <v-btn text="Неудача" variant="text" @click="runAction(action.id, false)"></v-btn>
  </v-card-text>
</template>
