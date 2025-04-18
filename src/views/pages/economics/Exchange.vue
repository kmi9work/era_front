<script setup>
import axios from 'axios'
import { ref, onMounted, computed, watch } from 'vue'

const countries = ref([])
const first_country = ref(null)
const prices = ref([])
const selectedCountry = ref(null) // Инициализируем как null
const resources = ref([])
const resourcesPlSells = ref([])
const resourcesPlBuys = ref([])
const gold = ref(null)
const resToPlayer = ref([])
const isLoading = ref(true) // Добавляем флаг загрузки
const showKeyboards = ref(true)
const showEmbargoDialog = ref(false) // диалог при продаже/покупке


// Следим за изменением selectedCountry
watch(selectedCountry, (newVal) => {
  if (newVal) {
    // Обновляем ресурсы при изменении страны
    filteredResOffMark.value
    filteredResToMark.value
  }
})

const embargo = computed(() => {
  if (!selectedCountry.value) return false;
  const country = countries.value.find(c => c.id === selectedCountry.value);
  return country?.params?.embargo || false;
});


const fetchCountries = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/foreign_countries.json`);
    countries.value = response.data;
  } catch (error) {
    console.error('Error fetching countries:', error);
  }
};

let intervalId;

onMounted(() => {
  fetchCountries(); // сразу один раз при старте

  // Потом каждые 30 секунд (можешь изменить время при желании)
  intervalId = setInterval(() => {
    fetchCountries();
  }, 5000); // 30000 мс = 30 секунд
});

onUnmounted(() => {
  // Очистим интервал при размонтировании компонента
  clearInterval(intervalId);
});



const showEmbargoStatusDialog = ref(false);
const embargoStatusMessage = ref('');
const isEmbargoActive = ref(false);

// Сохраняем предыдущее состояние эмбарго
const prevEmbargoState = ref(null);

// Функция для показа уведомления
const showEmbargoChangeNotification = (message, isEmbargo) => {
  embargoStatusMessage.value = message;
  isEmbargoActive.value = isEmbargo;
  showEmbargoStatusDialog.value = true;
  
  // Автоскрытие через 5 секунд
  setTimeout(() => {
    showEmbargoStatusDialog.value = false;
  }, 5000);
};

// Watcher для отслеживания изменений эмбарго
watch(embargo, (newVal, oldVal) => {
  // Пропускаем первую инициализацию
  if (oldVal === undefined) return;
  
  // Пропускаем, если страна не выбрана
  if (!selectedCountry.value) return;
  
  const country = countries.value.find(c => c.id === selectedCountry.value);
  if (!country) return;
  
  // Показываем уведомление только при изменении состояния
  if (newVal !== prevEmbargoState.value) {
    const countryName = country.name;
    
    if (newVal) {
      showEmbargoChangeNotification(`${countryName} ввела эмбарго! Торговля заблокирована.`, true);
    } else {
      showEmbargoChangeNotification(`${countryName} сняла эмбарго! Торговля восстановлена.`, false);
    }
    
    prevEmbargoState.value = newVal;
  }
}, { immediate: true });


// Периодический опрос каждые 30 секунд
const pollInterval = ref(null);

onMounted(() => {
  pollInterval.value = setInterval(fetchCountries, 30000); // 30 секунд
});

onBeforeUnmount(() => {
  clearInterval(pollInterval.value);
});

// Загружаем данные при монтировании
onMounted(async () => {
  try {
    const [countriesRes, resourcesRes] = await Promise.all([
      axios.get(`${import.meta.env.VITE_PROXY}/countries/foreign_countries.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/resources/show_prices.json`)
    ])

    countries.value = countriesRes.data
    resources.value = resourcesRes.data.prices

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
})



const filteredResOffMark = computed(() => {
  if (!resources.value["off_market"] || !selectedCountry.value) return []

  let filtered = resources.value["off_market"].filter((res) => res.country.id == selectedCountry.value)

  resourcesPlBuys.value = filtered.map(
    (item) => ({
      "name_and_b_pr": item.name_and_b_pr,
      "identificator": item.identificator,
      "count": null
    })
  )

  return filtered
})

const filteredResToMark = computed(() => {
  if (!resources.value["to_market"] || !selectedCountry.value) return []

  let filtered = resources.value["to_market"].filter((res) => res.country.id == selectedCountry.value)

  resourcesPlSells.value = filtered.map(
    (item) => ({
      "name_and_s_pr": item.name_and_s_pr,
      "identificator": item.identificator,
      "count": null
    })
  )

  return filtered
})

async function submit() {
  // Проверяем эмбарго перед отправкой
  if (embargo.value) {
    showEmbargoDialog.value = true
    return
  }

  await sendCaravanRequest()
}

async function sendCaravanRequest(isContraband = false) {
  try {
    const resToBack = {
      country_id: selectedCountry.value,
      res_pl_sells: resourcesPlSells.value,
      res_pl_buys: resourcesPlBuys.value,
      gold: gold.value,
      is_contraband: isContraband
    };

    console.log('Отправляемые данные:', resToBack); // Отладочный вывод

    const response = await axios.post(
      `${import.meta.env.VITE_PROXY}/resources/send_caravan`,
      resToBack
    );

    prices.value = response.data;
    resToPlayer.value = prices.value.res_to_player;

    return response; // Важно возвращать результат
  } catch (e) {
    console.error('Ошибка отправки:', e);
    throw e; // Пробрасываем ошибку дальше
  }
}

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


function resetForm() {
  // Очищаем введённые значения покупки
  resourcesPlBuys.value = filteredResOffMark.value.map(item => ({
    "name_and_b_pr": item.name_and_b_pr,
    "identificator": item.identificator,
    "count": null
  }));

  // Очищаем введённые значения продажи
  resourcesPlSells.value = filteredResToMark.value.map(item => ({
    "name_and_s_pr": item.name_and_s_pr,
    "identificator": item.identificator,
    "count": null
  }));

  // Обнуляем золото
  gold.value = null;

  // Очищаем результаты
  resToPlayer.value = [];
  prices.value = [];
}

function incrementValue(array, index, amount) {
  // Для ref объектов используем array.value
  const targetArray = array.value || array;

  if (!targetArray[index].count) {
    targetArray[index].count = 0;
  }
  targetArray[index].count += amount;
}

const backspaceDigitBuys = (index) => {
  const current = resourcesPlBuys.value[index].count
  if (current === 0 || current === null) return

  const strValue = current.toString()
  if (strValue.length === 1) {
    resourcesPlBuys.value[index].count = null
  } else {
    resourcesPlBuys.value[index].count = parseInt(strValue.slice(0, -1))
  }
}

const backspaceDigitSells = (index) => {
  const current = resourcesPlSells.value[index].count
  if (current === 0 || current === null) return

  const strValue = current.toString()
  if (strValue.length === 1) {
    resourcesPlSells.value[index].count = null
  } else {
    resourcesPlSells.value[index].count = parseInt(strValue.slice(0, -1))
  }
}




const appendDigitPlSells = (index, digit) => {
  const current = resourcesPlSells.value[index].count || '0'
  resourcesPlSells.value[index].count = parseInt(current.toString() + digit.toString())
}

const appendDigitPlBuys = (index, digit) => {
  const current = resourcesPlBuys.value[index].count || '0'
  resourcesPlBuys.value[index].count = parseInt(current.toString() + digit.toString())
}

const clearDigitPlSells = (index) => {
  resourcesPlSells.value[index].count = null
}

const clearDigitPlBuys = (index) => {
  resourcesPlBuys.value[index].count = null
}

// Добавляем вычисляемое свойство для определения эмбарго
const hasEmbargo = (country) => {
  return country.params?.embargo === true
}


// Метод для определения цвета кнопки страны
const getButtonColor = (country) => {
  if (selectedCountry.value === country.id) return 'primary'
  if (hasEmbargo(country)) return 'error'
  return undefined
}

</script>

<template>
  <div v-if="!isLoading" class="main-container">

    <!-- Кнопки стран с флагами -->
   <div class="country-buttons-container">
      <div class="country-buttons">
        <v-btn
          v-for="country in countries"
          :key="country.id"
          @click="selectedCountry = country.id"
          :color="getButtonColor(country)"
          :class="{ 'pulse-red': hasEmbargo(country) }"
          variant="text"
          class="country-btn"
        >
          <v-img
            :src="`/src/assets/images/countries/${country.name}.png`"
            width="72"
            height="54"
            class="mr-2 flag-icon"
          />
          {{ country.name }}
          <span v-if="hasEmbargo(country)" class="embargo-badge">Эмбарго!</span>
        </v-btn>
      </div>
    </div>

    <!-- Кнопка сброса -->
    <v-btn
      @click="resetForm"
      color="error"
      class="reset-btn"
      block
    >
      <v-icon icon="mdi-refresh" class="mr-1" />
      Сбросить форму
    </v-btn>
<VCol>
  <div style="display: flex; gap: 24px;">
    <!-- Форма "Игрок продает" -->
  <VCard style="flex: 1;">
    <v-card-title class="text-center">
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span>Игрок продает</span>
        <v-checkbox
          v-model="showKeyboards"
          label="Показать клавиатуры"
          hide-details
          density="compact"
          class="keyboard-toggle"
        ></v-checkbox>
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
            <!-- Верхняя строка: иконка + поле ввода -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="display: flex; align-items: center;">
                <v-img
                  :src="`/src/assets/images/resources/${item.identificator}.png`"
                  width="40"
                  height="40"
                  class="resource-icon"
                />
              </div>
              <v-text-field
                v-model.number="resourcesPlSells[index].count"
                :label="item.name_and_s_pr"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
                style="flex: 1;"
              />
            </div>

            <!-- Клавиатура (условный рендеринг) -->
            <div v-if="showKeyboards" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              <!-- Первый ряд -->
              <v-btn @click="appendDigitPlSells(index, 7)" tabindex="-1" block size="small" class="keypad-btn">7</v-btn>
              <v-btn @click="appendDigitPlSells(index, 8)" tabindex="-1" block size="small" class="keypad-btn">8</v-btn>
              <v-btn @click="appendDigitPlSells(index, 9)" tabindex="-1" block size="small" class="keypad-btn">9</v-btn>

              <!-- Второй ряд -->
              <v-btn @click="appendDigitPlSells(index, 4)" tabindex="-1" block size="small" class="keypad-btn">4</v-btn>
              <v-btn @click="appendDigitPlSells(index, 5)" tabindex="-1" block size="small" class="keypad-btn">5</v-btn>
              <v-btn @click="appendDigitPlSells(index, 6)" tabindex="-1" block size="small" class="keypad-btn">6</v-btn>

              <!-- Третий ряд -->
              <v-btn @click="appendDigitPlSells(index, 1)" tabindex="-1" block size="small" class="keypad-btn">1</v-btn>
              <v-btn @click="appendDigitPlSells(index, 2)" tabindex="-1" block size="small" class="keypad-btn">2</v-btn>
              <v-btn @click="appendDigitPlSells(index, 3)" tabindex="-1" block size="small" class="keypad-btn">3</v-btn>

              <!-- Нижний ряд -->
              <v-btn @click="appendDigitPlSells(index, 0)" tabindex="-1" block size="small" class="keypad-btn" style="grid-column: span 1;">0</v-btn>
              <v-btn @click="backspaceDigitSells(index)" tabindex="-1" block size="small" class="keypad-btn backspace-btn">
                <v-icon>mdi-backspace</v-icon>
              </v-btn>
              <v-btn @click="clearDigitPlSells(index)" tabindex="-1" block size="small" color="error" class="keypad-btn">C</v-btn>
            </div>
          </div>
        </div>
      </v-form>
    </v-card-text>
  </VCard>





    <!-- Форма "Игрок покупает" -->
  <VCard style="flex: 1;">
  <v-card-title class="text-center">
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <span>Игрок покупает</span>
      <v-checkbox
        v-model="showKeyboards"
        label="Показать клавиатуры"
        hide-details
        density="compact"
        class="keyboard-toggle"
      ></v-checkbox>
    </div>
  </v-card-title>

  <v-card-text>
    <v-form @submit.prevent>
      <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: left;">
        <div
          v-for="(item, index) in filteredResOffMark"
          :key="index"
          style="display: flex; flex-direction: column; width: 240px; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 8px;"
        >
          <!-- Верхняя строка: иконка + поле ввода -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center;">
              <v-img
                :src="`/src/assets/images/resources/${item.identificator}.png`"
                width="40"
                height="40"
                class="resource-icon"
              />
            </div>
            <v-text-field
              v-model.number="resourcesPlBuys[index].count"
              :label="item.name_and_b_pr"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              style="flex: 1;"
            />
          </div>

          <!-- Клавиатура (условный рендеринг) -->
          <div v-if="showKeyboards" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            <!-- Первый ряд -->
            <v-btn @click="appendDigitPlBuys(index, 7)" tabindex="-1" block size="small" class="keypad-btn">7</v-btn>
            <v-btn @click="appendDigitPlBuys(index, 8)" tabindex="-1" block size="small" class="keypad-btn">8</v-btn>
            <v-btn @click="appendDigitPlBuys(index, 9)" tabindex="-1" block size="small" class="keypad-btn">9</v-btn>

            <!-- Второй ряд -->
            <v-btn @click="appendDigitPlBuys(index, 4)" tabindex="-1" block size="small" class="keypad-btn">4</v-btn>
            <v-btn @click="appendDigitPlBuys(index, 5)" tabindex="-1" block size="small" class="keypad-btn">5</v-btn>
            <v-btn @click="appendDigitPlBuys(index, 6)" tabindex="-1" block size="small" class="keypad-btn">6</v-btn>

            <!-- Третий ряд -->
            <v-btn @click="appendDigitPlBuys(index, 1)" tabindex="-1" block size="small" class="keypad-btn">1</v-btn>
            <v-btn @click="appendDigitPlBuys(index, 2)" tabindex="-1" block size="small" class="keypad-btn">2</v-btn>
            <v-btn @click="appendDigitPlBuys(index, 3)" tabindex="-1" block size="small" class="keypad-btn">3</v-btn>

            <!-- Нижний ряд -->
            <v-btn @click="appendDigitPlBuys(index, 0)" tabindex="-1" block size="small" class="keypad-btn" style="grid-column: span 1;">0</v-btn>
            <v-btn @click="backspaceDigitBuys(index)" tabindex="-1" block size="small" class="keypad-btn backspace-btn">
              <v-icon>mdi-backspace</v-icon>
            </v-btn>
            <v-btn @click="clearDigitPlBuys(index)" tabindex="-1" block size="small" color="error" class="keypad-btn">C</v-btn>
          </div>
        </div>
      </div>
    </v-form>
  </v-card-text>
</VCard>
  </div>
</VCol>

<VCol>
      <!-- Поле для золота -->
      <v-card class="gold-card">
  <v-card-item>
    <div class="gold-controls">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
<!--         <v-img
                :src="`/src/assets/images/resources/gold.png`"
                width="40"
                height="40"
                class="resource-icon"
              /> -->

        <v-text-field
          v-model.number="gold"
          label="Золото"
          type="number"
          variant="outlined"
          density="compact"
          class="gold-input"
        ></v-text-field>
        <v-checkbox
          v-model="showKeyboards"
          label="Клавиатура"
          hide-details
          density="compact"
          class="keyboard-toggle"
        ></v-checkbox>
      </div>

      <!-- Клавиатура для золота -->
      <div v-if="showKeyboards" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px;">
        <!-- Первый ряд -->
        <v-btn @click="gold = (gold || 0) * 10 + 7" tabindex="-1" block size="small" class="keypad-btn">7</v-btn>
        <v-btn @click="gold = (gold || 0) * 10 + 8" tabindex="-1" block size="small" class="keypad-btn">8</v-btn>
        <v-btn @click="gold = (gold || 0) * 10 + 9" tabindex="-1" block size="small" class="keypad-btn">9</v-btn>

        <!-- Второй ряд -->
        <v-btn @click="gold = (gold || 0) * 10 + 4" tabindex="-1" block size="small" class="keypad-btn">4</v-btn>
        <v-btn @click="gold = (gold || 0) * 10 + 5" tabindex="-1" block size="small" class="keypad-btn">5</v-btn>
        <v-btn @click="gold = (gold || 0) * 10 + 6" tabindex="-1" block size="small" class="keypad-btn">6</v-btn>

        <!-- Третий ряд -->
        <v-btn @click="gold = (gold || 0) * 10 + 1" tabindex="-1" block size="small" class="keypad-btn">1</v-btn>
        <v-btn @click="gold = (gold || 0) * 10 + 2" tabindex="-1" block size="small" class="keypad-btn">2</v-btn>
        <v-btn @click="gold = (gold || 0) * 10 + 3" tabindex="-1" block size="small" class="keypad-btn">3</v-btn>

        <!-- Нижний ряд -->
        <v-btn @click="gold = (gold || 0) * 10" tabindex="-1" block size="small" class="keypad-btn" style="grid-column: span 1;">0</v-btn>
        <v-btn @click="gold = Math.floor((gold || 0) / 10)" tabindex="-1" block size="small" class="keypad-btn backspace-btn">
          <v-icon>mdi-backspace</v-icon>
        </v-btn>
        <v-btn @click="gold = null" tabindex="-1" block size="small" color="error" class="keypad-btn">C</v-btn>
      </div>
    </div>
  </v-card-item>
</v-card>



</VCol>
      <!-- Кнопка отправки -->
      <v-btn class="submit-btn" @click="submit" block>Обработать</v-btn>

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
  <v-dialog v-model="showEmbargoDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5">Эмбарго!</v-card-title>
      <v-card-text>Страна ввела эмбарго, для совершения операции нужна Контрабанда</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey darken-1" text @click="showEmbargoDialog = false">Отмена</v-btn>
        <v-btn color="red darken-1" text @click="confirmContraband">Есть контрабанда</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


   <v-dialog v-model="showEmbargoStatusDialog" max-width="500">
    <v-card :color="isEmbargoActive ? 'error' : 'success'">
      <v-card-title>
        {{ isEmbargoActive ? 'Эмбарго введено' : 'Эмбарго снято' }}
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

.increment-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.gold-card {
  margin: 16px 0;
}

.gold-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gold-input {
  max-width: 2000 px;
}

.gold-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gold-button-group {
  display: flex;
  gap: 4px;
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
.red-btn {
  background-color: #ff5252 !important;
  color: white !important;
}

.green-btn {
  background-color: #00c853 !important;
  color: white !important;
}

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

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>