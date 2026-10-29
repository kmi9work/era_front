<script setup>
  import axios from 'axios'
  import { onBeforeMount, ref } from 'vue'

  /**
   * «Взять мзду» Посольского дьяка. При неудаче отношения падают со СЛУЧАЙНЫМ
   * государством — выбирает сервер (`PoliticalAction#take_bribe`) и пишет выбор в
   * `params.country_id` политдействия: Москва и Новгород из случайного выбора
   * исключены, а страна самого дьяка в выборе не участвует. Клиент только
   * показывает государство из ответа сервера, чтобы текст совпадал с фактом.
   */
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

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json`)
      .then(response => {
        countries.value = Array.isArray(response.data) ? response.data : [];
      })
  })

  function countryName(id) {
    return countries.value.find(country => Number(country.id) === Number(id))?.name || ''
  }

  async function runAction(noble_job_id, action_id, success){
    const response = await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        success: success,
        job_id: noble_job_id,
        params: {}
      })

    if (!success) {
      const chosen = response?.data?.params?.country_id
      const name = chosen ? countryName(chosen) : ''
      alert(name
        ? `Отношения испортились с государством ${name}`
        : 'Отношения испортились со случайным государством');
    }
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
      В случае неудачи государство выбирает программа — случайно, кроме Москвы и Новгорода
    </v-list-item>

  </v-list>
  <v-card-text>
    <v-btn text="Успех" variant="text" @click="runAction(noble_job.id, action.id, true)"></v-btn>
    <v-btn text="Неудача" variant="text" @click="runAction(noble_job.id, action.id, false)"></v-btn>
  </v-card-text>
</template>
