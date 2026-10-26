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
  const errorText = ref('');

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/guilds.json`) 
      .then(response => {
        guilds.value = response.data;
        if (guilds.value.length > 0) {
          selectedGuildId.value = guilds.value[0].id;
        }
      })
  })

  // guild_id обязателен: карточка «Контрабанда» выдаётся гильдии
  // (Guild#grant_contraband_card) на текущий год — её выбирает мастер здесь
  async function runAction(action_id, success){
    errorText.value = '';
    try {
      await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        success: success,
        guild_id: selectedGuildId.value,
      })
      emit('close-dialog')
    } catch (e) {
      errorText.value = e?.response?.data?.error || e?.message || 'Не удалось выполнить действие'
    }
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
  <v-alert
    v-if="errorText"
    type="error"
    variant="tonal"
    class="mx-4 mb-2"
  >
    {{ errorText }}
  </v-alert>
  <v-card-text>
    <v-btn text="Успех" variant="text" @click="runAction(action.id, true)"></v-btn>
    <v-btn text="Неудача" variant="text" @click="runAction(action.id, false)"></v-btn>
  </v-card-text>
</template>
