<script setup>
  import axios from 'axios'
  import { computed, onBeforeMount, ref } from 'vue'

  /**
   * «Отправить посольство» Посольского дьяка: посольство уходит в ДВЕ державы
   * (карточка действия: «улучшение отношений с 2-мя выбранными иностранными
   * державами на 1 пункт»). Раньше выбор был один — вторую страну мастер задать
   * не мог. Параметры уходят двумя скалярными ключами: `country_id` и
   * `country_id_2` (Rails `permit(params: {})` пропускает только скаляры, массив
   * стран молча терялся бы).
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
  const country_id = ref(null);
  const country_id_2 = ref(null);

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`)
      .then(response => {
        countries.value = response.data;
        if (countries.value.length > 0) {
          country_id.value = countries.value[0].id;
        }
        if (countries.value.length > 1) {
          country_id_2.value = countries.value[1].id;
        }
      })
  })

  // Вторая держава не может совпасть с первой: пара «в одну и ту же страну»
  // улучшала бы отношения дважды.
  const secondCountries = computed(() =>
    countries.value.filter(country => country.id !== country_id.value)
  )

  function onFirstChange() {
    if (country_id_2.value === country_id.value) {
      country_id_2.value = secondCountries.value[0]?.id ?? null
    }
  }

  async function runAction(noble_job_id, action_id, success){
    const params = success
      ? { country_id: country_id.value, country_id_2: country_id_2.value }
      : {};

    if (success && (!params.country_id || !params.country_id_2)) {
      alert('Для успеха выберите две разные страны')
      return
    }

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
        label="Первая держава (для успеха)"
        :items="countries"
        v-model="country_id"
        item-title="name"
        item-value="id"
        @update:model-value="onFirstChange"
      ></v-select>
    </v-list-item>
    <v-list-item>
      <v-select
        label="Вторая держава (для успеха)"
        :items="secondCountries"
        v-model="country_id_2"
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
