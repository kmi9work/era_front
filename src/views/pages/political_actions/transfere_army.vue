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

  const countries = ref([]);
  const country_id = ref(0);
  const armies = ref([]);
  const army_id = ref(0);
  const isDialogOpen = ref(false);
  
  // Функция загрузки армий (будет вызываться при каждом открытии)
  const loadArmies = async () => {
    console.log('[transfere_army] Загрузка армий...');
    const grandPrincePlayers = props.noble_job.players || [];
    if (grandPrincePlayers.length > 0) {
      const grandPrinceId = grandPrincePlayers[0].id;
      console.log('[transfere_army] ID Великого князя:', grandPrinceId);
      
      // Загружаем все армии и фильтруем по владельцу
      await axios.get(`${import.meta.env.VITE_PROXY}/armies.json`) 
        .then(response => {
          console.log('[transfere_army] Всего армий загружено:', response.data.length);
          
          // Фильтруем армии, принадлежащие Великому князю и еще не переданные
          armies.value = response.data.filter(army => {
            // Проверяем владельца
            const isOwnedByPrince = army.owner_type === 'Player' && army.owner_id === grandPrinceId;
            
            // Проверяем, не передана ли уже армия
            const isNotLeased = !army.params?.additional?.active;
            
            console.log(`[transfere_army] Армия ${army.name}: owned=${isOwnedByPrince}, notLeased=${isNotLeased}, params.additional=`, army.params?.additional);
            
            return isOwnedByPrince && isNotLeased;
          });
          
          console.log('[transfere_army] Армий после фильтрации:', armies.value.length);
          
          if (armies.value.length > 0) {
            army_id.value = armies.value[0].id;
          } else {
            console.warn('[transfere_army] Нет доступных армий для передачи');
          }
        })
    } else {
      console.warn('Великий князь не найден');
    }
  };
  
  onBeforeMount(async () => {
    // Загружаем страны один раз
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`) 
      .then(response => {
        countries.value = response.data;
        if (countries.value.length > 0) {
          country_id.value = countries.value[0].id;
        }
      })
  })

  async function runAction(noble_job_id, action_id){
    // Проверка перед отправкой
    if (armies.value.length === 0) {
      alert('Нет доступных армий для передачи');
      return;
    }
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
          political_action_type_id: action_id,
          job_id: noble_job_id,
          params: {country_id: country_id.value, army_id: army_id.value}
        })
      
      // Проверяем ответ сервера
      if (response.data.error) {
        alert('Ошибка: ' + response.data.error);
      } else if (response.data.message) {
        alert(response.data.message);
      }
      
      emit('close-dialog')
    } catch (error) {
      console.error('Ошибка при передаче армии:', error);
      alert('Произошла ошибка при передаче армии');
    }
  }

  // Загружаем армии при монтировании компонента
  onMounted(async () => {
    await loadArmies();
  });
  
  // Перезагружаем армии при каждом открытии диалога
  watch(() => props.dialogOpen, async (isOpen) => {
    if (isOpen) {
      console.log('Диалог открыт - обновляем список армий');
      await loadArmies();
    }
  });
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item
      subtitle="Эффект"
    >Отношения с выбранным соседом не падают ниже "Нейтральных". Если отношения были ниже «Нейтральных» - они повышаются до «Нейтральных». Великий князь не может создавать или улучшать свою армию, пока она в распоряжении соседа.</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Параметры</v-list-subheader>

    <v-list-item>
      <v-select
        label="Выберите армию Великого князя"
        :items="armies"
        v-model="army_id"
        item-title="name"
        item-value="id"
        :disabled="armies.length === 0"
        :hint="armies.length === 0 ? 'Нет доступных армий для передачи (все армии уже переданы или отсутствуют)' : `Доступно армий для передачи: ${armies.length}`"
        persistent-hint
      ></v-select>
    </v-list-item>

    <v-list-item>
      <v-select
        label="Передать стране"
        :items="countries"
        v-model="country_id"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Выполнить" variant="tonal" color="primary" @click="runAction(noble_job.id, action.id)"></v-btn>
  </v-card-text>
</template>

