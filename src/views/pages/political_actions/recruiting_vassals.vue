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
    },
    dialogOpen: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['close-dialog']);

  const isLoading = ref(false);

  async function runAction(){
    isLoading.value = true;
    try {
      // Выполняем только политическое действие (снижение общественного порядка)
      await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: props.action.id,
        job_id: props.noble_job.id,
        params: {}
      });

      alert("Успешно! Общественный порядок во всех регионах Руси снижен на 1.");
      emit('close-dialog');
    } catch (error) {
      console.error('Ошибка при выполнении действия:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.errors?.[0] || error.message;
      alert(`Ошибка: ${errorMsg}`);
    } finally {
      isLoading.value = false;
    }
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item subtitle="Эффект">
      Общественный порядок во всех регионах Руси снижается на 1.
    </v-list-item>

    <v-list-item subtitle="Стоимость">
      {{ action.cost }}
    </v-list-item>

    <v-progress-linear v-if="isLoading" indeterminate color="primary"></v-progress-linear>
  </v-list>

  <v-card-text>
    <v-btn 
      text="Выполнить" 
      variant="tonal" 
      color="primary" 
      @click="runAction"
      :disabled="isLoading"
      :loading="isLoading"
    ></v-btn>
  </v-card-text>
</template>