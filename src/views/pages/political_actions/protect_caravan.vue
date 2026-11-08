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

  const guilds = ref([]);
  const armies = ref([]);
  const guild_id = ref(0);
  const army_id = ref(0);
  const armyHint = ref('');

  /**
   * Диалог «Защита каравана»: мастер выбирает гильдию, чей караван защищают, и
   * АРМИЮ Воеводы, которой он за это распорядиться не сможет (ограничение на
   * движение живёт в клиенте мастеров как предупреждение).
   *
   * Список армий — только армии Воеводы текущего государства (карточка:
   * «Воевода передает свою армию»). Если у Воеводы армий нет, показываем все
   * армии игры, чтобы мастер видел, почему выбирать нечего; сервер всё равно
   * откажет в чужой армии.
   */
  onBeforeMount(async () => {
    await Promise.all([
      axios.get(`${import.meta.env.VITE_PROXY}/guilds.json`).then(response => {
        guilds.value = response.data || [];
        if (guilds.value.length > 0) {
          guild_id.value = guilds.value[0].id;
        }
      }),
      axios.get(`${import.meta.env.VITE_PROXY}/armies.json`).then(response => {
        const all = (response.data || []).filter(army => !army.deleted_at);
        const voevodaArmies = all.filter(army =>
          (army.owner?.jobs || []).some(job => job.name === 'Воевода'))
        armies.value = voevodaArmies.length > 0 ? voevodaArmies : all;
        armyHint.value = voevodaArmies.length > 0
          ? ''
          : 'У Воеводы нет своих армий — в списке все армии игры.';
        if (armies.value.length > 0) {
          army_id.value = armies.value[0].id;
        }
      })
    ])
  })

  async function runAction(noble_job_id, action_id){
    // army_id отправляем только при выборе: «0» сервер понял бы как id армии
    // и ответил отказом, которого диалог не покажет.
    const params = {guild_id: guild_id.value}
    if (army_id.value) {
      params.army_id = army_id.value
    }
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        job_id: noble_job_id,
        params: params
      })
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item
      subtitle="Эффект"
    >Караваны выбранной гильдии защищены от ограбления. Выбранная армия Воеводы не может перемещаться в этом году.</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Параметры</v-list-subheader>

    <v-list-item>
      <v-select
        label="Выберите гильдию"
        :items="guilds"
        v-model="guild_id"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>

    <v-list-item>
      <v-select
        label="Армия, которая защищает караван"
        :items="armies"
        v-model="army_id"
        item-title="name"
        item-value="id"
        :messages="armyHint"
      ></v-select>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Выполнить" variant="tonal" color="primary" @click="runAction(noble_job.id, action.id)"></v-btn>
  </v-card-text>
</template>
