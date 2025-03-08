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
  const nobles = ref([]);
  const chosen_noble = ref(0);

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/players.json`) 
      .then(response => {
        nobles.value = response.data.filter((player) => player.player_type?.id == 2); // 2 - Знать
        chosen_noble.value = nobles.value[0];
      })
  })

  async function runAction(noble_id, action_id, success){
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        success: success,
        player_id: noble_id,
        params: {player_id: chosen_noble.value}
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
            :items="nobles"
            v-model="chosen_noble"
            item-title="name"
            item-value="id"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.job.name"></v-list-item>
            </template>

          </v-select>
        </v-list-item-action>
      </template>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Успех" variant="text" @click="runAction(noble.id, action.id, true)"></v-btn>
    <v-btn text="Неудача" variant="text" @click="runAction(noble.id, action.id, false)"></v-btn>
  </v-card-text>
</template>