<script setup>
import axios from 'axios'
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'

//Основной функционал
const isLoading = ref(true) // Добавляем флаг 
const isFirstRunRel = ref(true); 
const isFirstRunEmbargo = ref(true);
const pollInterval = ref(null); // Периодический опрос каждые 30 секунд для Эмбарго и Цен

// Продажа и вывод
const countries = ref([])
const first_country = ref(null)
const prices = ref([])
const selectedCountry = ref(null)            // Выбранная страна
const resources = ref([])
const resourcesPlSells = ref([])
const resourcesPlBuys = ref([])
const resToPlayer = ref([])
const resToBack = ref ([])

// Отношения (для цен) и эмбарго
const countriesRelations = ref([])          // Массив хэшей [{имя, отношение, эмбарго}]
const showRelationsDialog = ref(false)      // Сообщение об изменении отношений какой-то страны с Русью.
const newRelations = ref(false)             // Состояние, что цены пока не соответствуют новым
const showEmbargoStatusDialog = ref(false);
const showEmbargoDialog = ref(false)        //  при продаже/покупке
const embargoStatusMessage = ref('');
const isEmbargoActive = ref(false);

const fetchCountries = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/foreign_countries.json`);
    countries.value = response.data;
    countriesRelations.value = countries.value.map(item => {
      return {
        name: item.name,
        relations: item.relations,
        embargo: item.params["embargo"]
      };
    });

  } catch (error) {
    console.error('Error fetching countries:', error);
    // Рекомендуется обработка ошибок (например, сброс значений)
    countries.value = [];
    countriesRelations.value = [];
  }
};

watch(
  () => countriesRelations.value.map(country => country.relations),
  (newVal, oldVal) => {
    if (isFirstRunRel.value) {
      isFirstRunRel.value = false;
      return; // Пропускаем первый вызов
    }
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      // alert("Отношения изменились!");
      newRelations.value = true;
      showRelationsDialog.value = true
    }
  },
  { deep: true }
);

watch(
  () => countriesRelations.value.map(country => country.embargo),
  (newVal, oldVal) => {
    if (isFirstRunEmbargo.value) {
      isFirstRunEmbargo.value = false;
      return;
    }

    // Находим страну, у которой изменилось эмбарго
    const changedCountry = countriesRelations.value.find((country, index) => {
      return country.embargo !== oldVal[index];
    });

    if (changedCountry) {
      isEmbargoActive.value = (changedCountry.embargo > 0); // 1 = введено, 0 = снято
      embargoStatusMessage.value = (changedCountry.embargo > 0)
        ? `${changedCountry.name} ввела эмбарго против Руси!`
        : `${changedCountry.name} сняла эмбарго!`;
      showEmbargoStatusDialog.value = true;
    }
  },
  { deep: true }
);

const fetchResources = async () =>{
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/resources/show_prices.json`)
    resources.value = response.data.prices;
    newRelations.value = false;

  } catch (error) {
    console.error('Error fetching resources:', error);
  }
};

const filteredResOffMark = computed(() => {
  if (!resources.value["off_market"] || !selectedCountry.value) return []

  let filtered = resources.value["off_market"].filter((res) => res.country.id == selectedCountry.value)

  resourcesPlBuys.value = filtered.map(
    (item) => ({
      "identificator": item.identificator,
      "count": null
    })
  )

  return filtered
})

const getShortName = (name) => {
  const shortNames = {
    'Большая Орда': 'Орда',
    'Ливонский орден': 'Ливония',
    'Королевство Швеция': 'Швеция',
    'Великое княжество Литовское': 'Литва',
    'Казанское ханство': 'Казань',
    'Крымское ханство': 'Крым',
  };
  return shortNames[name] || name.substring(0, 3);
};

const filteredResToMark = computed(() => {
  if (!resources.value["to_market"]) return []

  // Фильтруем по стране, если страна выбрана
  let filtered = selectedCountry.value 
    ? resources.value["to_market"].filter(res => res.country.id == selectedCountry.value)
    : resources.value["to_market"]

  // Создаем копию для resourcesPlSells
  resourcesPlSells.value = filtered.map(item => ({
    identificator: item.identificator,
    count: null
  }))

  // Добавляем золото в оба массива
  const goldItem = {
    identificator: "gold",
    count: null
  }

  // Добавляем в resourcesPlSells
  resourcesPlSells.value.push({...goldItem})

  // Возвращаем filtered с добавленным золотом
  return [...filtered, {...goldItem}]
})


async function sendCaravanRequest(isContraband = false) {
  try {
    const resToBack = {
      country_id: selectedCountry.value,
      res_pl_sells: resourcesPlSells.value,
      res_pl_buys: resourcesPlBuys.value
    };
    showEmbargoDialog.value = false
    const response = await axios.post(
      `${import.meta.env.VITE_PROXY}/resources/send_caravan`,
      resToBack
    );

    prices.value = response.data;
    resToPlayer.value = prices.value.res_to_player;

    return response; 
  } catch (e) {
    console.error('Ошибка отправки:', e);
    throw e; 
  }
}

//ПРОВЕРИТЬ
async function submit() {
  if (embargo.value) {
    showEmbargoDialog.value = true
    return
  }
  await sendCaravanRequest()
}

// ЭМБАРГО

// Сообщение о том, что какая-то страна ввела эмбарго. 
const embargo = computed(() => {
  if (selectedCountry.value == null) return false;
  const country = countries.value.find(c => c.id === selectedCountry.value);
  return Number(country?.params?.embargo) > 0;
});

// Проверялка на предмет эмбарго для кнопок
const hasEmbargo = (country) => {
  return (country?.params?.embargo > 0) 
}

// Метод для определения цвета кнопки страны
const getButtonColor = (country) => {
  if (selectedCountry.value === country.id && !hasEmbargo(country)) return 'success'
  if (selectedCountry.value === country.id && hasEmbargo(country)) return 'secondary'  
  if (hasEmbargo(country)) return 'error'
  return undefined
}

const nameChecker = (item) => {
  if (item){
    return `По ${item}` 
  }else{
    return "Золото"
  }
}

// Загружаем данные при монтировании
onMounted(async () => {
  try {

    await fetchCountries()
    await fetchResources()  

    // Устанавливаем первую страну только если есть данные
    if (countries.value.length > 0) {
      first_country.value = countries.value[0].id
      selectedCountry.value = first_country.value
    }
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }

  pollInterval.value = setInterval(fetchCountries, 30000); // 30 секунд
})

onBeforeUnmount(() => {
  clearInterval(pollInterval.value);
});

// Следим за изменением selectedCountry
watch(selectedCountry, (newVal) => {
  if (newVal) {
    // Обновляем ресурсы при изменении страны
    filteredResOffMark.value
    filteredResToMark.value
  }
})

async function confirmContraband() {
  showEmbargoDialog.value = false;
  try {
    await sendCaravanRequest(true);
    // Опционально: показать уведомление об успехе
  } catch (error) {
    console.error("Ошибка при отправке контрабанды:", error);
    // Показать ошибку пользователю
  }
}

//Кнопки и прочее
function resetForm() {
  // Очищаем введённые значения покупки
  resourcesPlBuys.value = filteredResOffMark.value.map(item => ({
    "identificator": item.identificator,
    "count": null
  }));

  // Очищаем введённые значения продажи
  resourcesPlSells.value = filteredResToMark.value.map(item => ({
    "identificator": item.identificator,
    "count": null
  }));

  // Очищаем результаты
  resToPlayer.value = [];
  prices.value = [];
}

</script>

<template>
  <div v-if="!isLoading" class="main-container">

    <!-- Кнопки стран с флагами -->

<v-btn
  v-for="country in countries"
  :key="country.id"
  @click="selectedCountry = country.id"
  class="compact-combined"
  :color="getButtonColor(country)"
  :class="{ 'embargo-border': hasEmbargo(country) }"
>
  <v-img
    :src="`/public/images/countries/${country.name}.png`"
    width="32"
    height="24"
  />
  <span class="short-name">{{ getShortName(country.name) }}</span>
  
  <span v-if="hasEmbargo(country)" class="embargo-label">Эмбарго</span>
</v-btn>
 
<div style="display: flex; flex-direction: column; gap: 24px;">
  <!-- Форма "Игрок продает" -->
  <VCard>
    <v-card-title class="text-center">
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span>Игрок отправляет с караваном</span>
      </div>
    </v-card-title>

    <v-card-text>
      <v-form @submit.prevent>
        <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: left;">
          <div
            v-for="(item, index) in filteredResToMark"
            :key="index"
            style="display: flex; flex-direction: column; width: 240px; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 8px;"
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="display: flex; align-items: center;">
                <v-img
                  :src="`/public/images/resources/${item.identificator}.png`"
                  width="40"
                  height="40"
                  class="resource-icon"
                />
              </div>
              <v-text-field
                v-model.number="resourcesPlSells[index].count"
                :label="nameChecker(item.sell_price)"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
                style="flex: 1;"
              />
            </div>

          </div>
        </div>
      </v-form>
    </v-card-text>
  </VCard>

  <VCard>
    <v-card-title >

      <span>Игрок заказал</span>
    </v-card-title>

    <v-card-text>
      <v-form @submit.prevent>
        <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: left;">
          <div
            v-for="(item, index) in filteredResOffMark"
            :key="index"
            style="display: flex; flex-direction: column; width: 240px; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 8px;"
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="display: flex; align-items: center;">
                <v-img
                  :src="`/public/images/resources/${item.identificator}.png`"
                  width="40"
                  height="40"
                  class="resource-icon"
                />
              </div>
              <v-text-field
                v-model.number="resourcesPlBuys[index].count"
                :label="nameChecker(item.buy_price)"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
                style="flex: 1;"
              />
            </div>
          </div>
        </div>
      </v-form>
    </v-card-text>
  </VCard>
</div>

<div>
  <VCard>
    <VRow align="center" justify="space-between" class="ma-0" dense>
      <!-- Кнопка отправки -->
      <VCol cols="4" class="pa-0 px-1">
        <v-btn 
          @click="submit" 
          block
          color="primary"
          height="48"
        >
          Обработать
        </v-btn>
      </VCol>

      <!-- Кнопка обновления цен -->
      <VCol cols="4" class="pa-0 px-1">
        <v-btn 
          @click="fetchResources" 
          block
          color="primary"
          height="48"
          :disabled="!newRelations"
        >
          Обновить цены
        </v-btn>
      </VCol>

      <!-- Кнопка сброса -->
      <VCol cols="4" class="pa-0 px-1">
        <v-btn
          @click="resetForm"
          color="error"
          block
          height="48"
        >
          <v-icon icon="mdi-refresh" class="mr-1" />
          Очистить
        </v-btn>
      </VCol>
    </VRow>
  </VCard>
</div>

      <!-- Результаты -->
      <VCard title="Выдать игроку" class="results-card">
        <v-card-text>
          <div v-for="(item, index) in resToPlayer" :key="index">
            <p v-if="item.count > 0">
              <span style="color: green;">{{ item.name }}: {{ item.count }}</span>
            </p>
            <p v-else-if="item.count < 0">
              <span style="color: red;">{{ item.name }}: {{ item.count }}</span>
            </p>
          </div>
        </v-card-text>
      </VCard>
    </div>

  <div v-else class="loading-container">
    Загрузка...
  </div>

  <!-- Диалог эмбарго -->
  <v-dialog v-model="showEmbargoStatusDialog" max-width="500">
  <v-card :color="isEmbargoActive ? 'error' : 'success'">
    <v-card-title>
      {{ isEmbargoActive ? 'Эмбарго введено!' : 'Эмбарго снято!' }}
    </v-card-title>
    <v-card-text>
      {{ embargoStatusMessage }}
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="showEmbargoStatusDialog = false">Закрыть</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

  <v-dialog v-model="showRelationsDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5">Изменение отношений!</v-card-title>
      <v-card-text>
        Отношения между странами изменились. Закройте рынок, обработайте все пришедшие караваны, обновите ценники,
        затем обновите цены в программе (кнопка "Обновить цены")
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" text @click="showRelationsDialog = false">
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showEmbargoDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5">Эта страна ввела эмбарго против Руси!</v-card-title>
      <v-card-text>
        Для совершения операций с этой страной нужна Контрабанда!
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" text @click="sendCaravanRequest(true) ">
          Есть карточка контрабанды!
        </v-btn>
          <v-btn color="grey-darken-1" text @click="showEmbargoDialog = false">
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>



</template>

<style scoped>
.main-container {
  padding: 16px;
  max-width: 120000px;
  margin: 0 auto;
}

.country-buttons-container {
  margin-bottom: 16px;
  overflow-x: auto;
}

.country-buttons {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 8px 0;
  min-width: max-content;
}

.country-btn {
  min-width: 160px;
  display: flex;
  flex-direction: column;
  height: auto;
  padding: 8px;
}

.flag-icon {
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 4px;
}

.reset-btn {
  margin-bottom: 16px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-card {
  margin-bottom: 16px;
}

.resource-field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}


.submit-btn {
  margin: 16px 0;
}

.results-card {
  margin-bottom: 16px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
}

/* Цвета кнопок */



.resource-icon {
  border-radius: 4px;
  flex-shrink: 10;
}


.pulse-red {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 0, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
  }
}

.embargo-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: red;
  color: white;
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 4px;
  animation: blink 1.5s infinite;
}

.compact-combined {
  min-width: 80px !important;
  padding: 2px 4px !important;
  font-size: 0.7rem;
}
.short-name {
  margin-left: 4px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}



.country-buttons {
  position: relative;
}

.embargo-border {
  position: relative;
  border: 2px solid red !important;
  box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.5) !important;
}

.embargo-label {
  position: absolute;
  top: -10px;
  right: -5px;
  background: red;
  background-color: rgba(255, 0, 0, 0.0); /* 20% прозрачности */
  color: white;
  text-shadow: 0 0 3px red, 0 0 1px black;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 15px;
  z-index: 2;
}


</style>