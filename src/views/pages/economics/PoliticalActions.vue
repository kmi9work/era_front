<script setup>
  import axios from 'axios'
  import PoliticalAction from '@/views/pages/economics/PoliticalAction.vue'

  const actions = ref([]);

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/political_action_types.json`) 
      .then(response => {
        actions.value = response.data.filter((action) => (action.job?.id == 10)); // 10 - Глава купеческой гильдии
      })
  })
</script>

<template>
  <v-card flat>
    <v-card-text>
      <v-list>
        <PoliticalAction 
          :actions="actions"
        />
      </v-list>
    </v-card-text>
  </v-card>
</template>