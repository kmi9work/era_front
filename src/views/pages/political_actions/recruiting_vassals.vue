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

  const voevoda = ref(null);
  const voevodaArmies = ref([]);
  const settlements = ref([]);
  const isLoading = ref(false);
  
  // Данные для создания новой армии
  const newArmyName = ref('');
  const selectedSettlementId = ref(null);
  
  // Данные для добавления отряда к существующей армии
  const selectedArmyId = ref(null);

  const hasArmies = computed(() => voevodaArmies.value.length > 0);

  watch(() => props.dialogOpen, async (newVal) => {
    if (newVal) {
      await loadData();
    }
  });

  onBeforeMount(async () => {
    await loadData();
  });

  async function loadData() {
    isLoading.value = true;
    try {
      // Загружаем воеводу (Job::VOEVODA = 5)
      // Используем тот же метод, что и на бекенде: Job.find_by_id(Job::VOEVODA).players.first
      const jobsResponse = await axios.get(`${import.meta.env.VITE_PROXY}/jobs.json`);
      const voevodaJob = jobsResponse.data.find(job => job.id === 5);
      
      if (!voevodaJob || !voevodaJob.players || voevodaJob.players.length === 0) {
        alert('Воевода не найден в системе или должность не занята');
        isLoading.value = false;
        return;
      }
      
      voevoda.value = voevodaJob.players[0]; // Берем первого игрока

      // Загружаем армии
      const armiesResponse = await axios.get(`${import.meta.env.VITE_PROXY}/armies.json`);
      voevodaArmies.value = armiesResponse.data.filter(
        army => army.owner_type === 'Player' && army.owner_id === voevoda.value.id
      );

      if (voevodaArmies.value.length > 0) {
        selectedArmyId.value = voevodaArmies.value[0].id;
      }

      // Загружаем селения
      const settlementsResponse = await axios.get(`${import.meta.env.VITE_PROXY}/settlements.json?all=1`);
      settlements.value = settlementsResponse.data;
      
      if (settlements.value.length > 0) {
        selectedSettlementId.value = settlements.value[0].id;
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      alert('Ошибка при загрузке данных');
    } finally {
      isLoading.value = false;
    }
  }

  async function runAction(){
    if (!voevoda.value) {
      alert('Воевода не найден');
      return;
    }

    isLoading.value = true;
    try {
      let armyId;

      if (!hasArmies.value) {
        // Создаем новую армию
        if (!newArmyName.value.trim()) {
          alert('Введите название армии');
          isLoading.value = false;
          return;
        }

        if (!selectedSettlementId.value) {
          alert('Выберите селение');
          isLoading.value = false;
          return;
        }

        const createArmyResponse = await axios.post(`${import.meta.env.VITE_PROXY}/armies.json`, {
          army: {
            name: newArmyName.value,
            settlement_id: selectedSettlementId.value,
            owner_id: voevoda.value.id,
            owner_type: 'Player',
            hidden: false
          }
        });

        armyId = createArmyResponse.data.id;
      } else {
        // Используем существующую армию
        armyId = selectedArmyId.value;
      }

      // Добавляем отряд пехоты (troop_type_id = 1)
      await axios.post(`${import.meta.env.VITE_PROXY}/armies/${armyId}/troops.json`, {
        troop_type_id: 1
      });

      // Выполняем политическое действие (снижение общественного порядка)
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: props.action.id,
        job_id: props.noble_job.id,
        params: {}
      });

      alert("Успешно! Общественный порядок во всех регионах Руси снижен на 1. Отряд пехоты добавлен к армии воеводы.");
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
      Воеводе будет дан отряд пехотинцев (создается новая армия или добавляется в существующую).
    </v-list-item>

    <v-list-item subtitle="Стоимость">
      {{ action.cost }}
    </v-list-item>

    <v-divider></v-divider>

    <v-list-subheader v-if="voevoda">
      Воевода: {{ voevoda.name }}
    </v-list-subheader>

    <v-progress-linear v-if="isLoading" indeterminate color="primary"></v-progress-linear>

    <template v-if="!isLoading && voevoda">
      <!-- Если у воеводы нет армий - создаем новую -->
      <template v-if="!hasArmies">
        <v-list-item>
          <v-alert type="info" variant="tonal" density="compact">
            У воеводы нет армий. Будет создана новая армия.
          </v-alert>
        </v-list-item>

        <v-list-item>
          <v-text-field
            v-model="newArmyName"
            label="Название армии"
            placeholder="Введите название новой армии"
            variant="outlined"
            density="compact"
            required
          ></v-text-field>
        </v-list-item>

        <v-list-item>
          <v-select
            v-model="selectedSettlementId"
            :items="settlements"
            item-title="name"
            item-value="id"
            label="Выберите селение"
            variant="outlined"
            density="compact"
            required
          ></v-select>
        </v-list-item>
      </template>

      <!-- Если у воеводы есть армии - выбираем к какой добавить -->
      <template v-else>
        <v-list-item>
          <v-alert type="success" variant="tonal" density="compact">
            У воеводы есть {{ voevodaArmies.length }} {{ voevodaArmies.length === 1 ? 'армия' : 'армий' }}.
            Отряд будет добавлен к выбранной армии.
          </v-alert>
        </v-list-item>

        <v-list-item>
          <v-select
            v-model="selectedArmyId"
            :items="voevodaArmies"
            item-title="name"
            item-value="id"
            label="Выберите армию"
            variant="outlined"
            density="compact"
            required
          >
            <template v-slot:item="{ props, item }">
    <v-list-item
                v-bind="props"
                :subtitle="`Отрядов: ${item.raw.troops?.length || 0}/3 | ${item.raw.settlement?.name || 'Без селения'}`"
              />
            </template>
          </v-select>
        </v-list-item>
      </template>
    </template>
  </v-list>

  <v-card-text>
    <v-btn 
      text="Выполнить" 
      variant="tonal" 
      color="primary" 
      @click="runAction"
      :disabled="isLoading || !voevoda"
      :loading="isLoading"
    ></v-btn>
  </v-card-text>
</template>