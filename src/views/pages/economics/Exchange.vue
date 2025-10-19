<script setup>
import axios from 'axios'
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useCaravanStore } from '@/stores/caravan'

const caravanStore = useCaravanStore()

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
const showConfirmDialog = ref(false);       // Модальное окно подтверждения после расчета
const caravanPending = ref(false);          // Флаг, что караван ожидает регистрации

const fetchCountries = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/countries/foreign_countries.json`);
    countries.value = response.data;
    
    // Сохраняем страны в store для калькулятора
    caravanStore.setCountries(response.data);
    
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
    
    // Сохраняем ресурсы в store для калькулятора
    // Передаем весь объект с off_market и to_market отдельно
    caravanStore.setResources({
      off_market: response.data.prices.off_market || [],
      to_market: response.data.prices.to_market || []
    });
    
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
    name: item.name,
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


async function calculateCaravanRequest(isContraband = false) {
  try {
    showEmbargoDialog.value = false
    
    // Вместо запроса на сервер, используем локальный расчет через store
    const result = caravanStore.calculateCaravan(
      selectedCountry.value,
      resourcesPlSells.value,
      resourcesPlBuys.value
    )
    
    prices.value = result
    resToPlayer.value = result.res_to_player

    return { data: result }
  } catch (e) {
    console.error('Ошибка расчета:', e)
    throw e
  }
}

//ПРОВЕРИТЬ
async function submit() {
  if (embargo.value) {
    showEmbargoDialog.value = true
    return
  }
  
  await calculateCaravanRequest()
  
  // Открываем модальное окно подтверждения
  showConfirmDialog.value = true
  caravanPending.value = true
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

// Обработчик предупреждения при закрытии вкладки
const handleBeforeUnload = (e) => {
  if (caravanPending.value) {
    e.preventDefault();
    e.returnValue = 'Караван не отправлен. Вы уверены, что хотите закрыть вкладку?';
    return e.returnValue;
  }
};

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
  
  // Добавляем обработчик предупреждения при закрытии
  window.addEventListener('beforeunload', handleBeforeUnload);
})

onBeforeUnmount(() => {
  clearInterval(pollInterval.value);
  window.removeEventListener('beforeunload', handleBeforeUnload);
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
    await calculateCaravanRequest(true);
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
  
  // Сбрасываем флаг ожидания каравана
  showConfirmDialog.value = false;
  caravanPending.value = false;
}

const registerCaravan  = async () =>{
  try {
    // Проверяем, что есть результаты расчета
    if (!resToPlayer.value || resToPlayer.value.length === 0) {
      console.log('Сначала нажмите кнопку "Обработать" для расчета обмена!');
      return;
    }
    
    // Обогащаем incoming данными из filteredResToMark (ресурсы БЕЗ золота)
    const enrichedIncoming = resourcesPlSells.value
      .filter(item => item.count && item.count > 0 && item.identificator !== 'gold')
      .map(item => {
        const fullResource = filteredResToMark.value.find(
          res => res.identificator === item.identificator
        );
        
        return {
          identificator: item.identificator,
          name: fullResource?.name || item.identificator,
          count: item.count
        };
      });
    
    // Обогащаем outcoming данными (ресурсы БЕЗ золота)
    const enrichedOutcoming = resToPlayer.value
      .filter(item => item.name !== 'Золото' && !item.name?.toLowerCase()?.includes('золото'))
      .map(item => {
        const fullResource = filteredResOffMark.value.find(
          res => res.name === item.name
        );
        
        const toMarketResource = filteredResToMark.value.find(
          res => res.name === item.name
        );
        
        return {
          identificator: fullResource?.identificator || toMarketResource?.identificator || '',
          name: item.name,
          count: item.count
        };
      });
    
    // Получаем данные по золоту
    const goldPaid = resourcesPlSells.value.find(r => r.identificator === 'gold')?.count || 0;
    const purchaseCost = caravanStore.totalPurchaseCost || 0;
    const saleIncome = caravanStore.totalSaleIncome || 0;
    
    const request = {
      country_id: selectedCountry.value, 
      incoming: enrichedIncoming, 
      outcoming: enrichedOutcoming,
      purchase_cost: purchaseCost,  // Стоимость покупки
      sale_income: saleIncome,       // Выручка от продажи
      gold_paid: goldPaid            // Сколько игрок вложил
    }
    
    console.log('Отправка караван-запроса:', request);
    
    const response = await axios.post(`${import.meta.env.VITE_PROXY}/caravans/register_caravan`, request)
    
    console.log('Караван зарегистрирован:', response.data);
    
    // Закрываем модальное окно и сбрасываем флаг
    showConfirmDialog.value = false;
    caravanPending.value = false;
    
    // Очищаем форму после успешной регистрации
    resetForm();
    
  } catch (error) {
    console.error('Error registering caravan:', error);
    console.error('Error details:', error.response?.data);
  }
}

// Функция для пересчета (закрыть модальное окно без регистрации)
const recalculate = () => {
  showConfirmDialog.value = false;
  caravanPending.value = false;
  // Оставляем результаты расчета, просто закрываем окно
}

// Получаем сколько игрок вложил золота
const goldPaidByPlayer = computed(() => {
  return resourcesPlSells.value.find(r => r.identificator === 'gold')?.count || 0;
});

// Вычисляем нехватку золота (учитывая выручку от продажи)
const goldShortage = computed(() => {
  const purchaseCost = caravanStore.totalPurchaseCost || 0;
  const saleIncome = caravanStore.totalSaleIncome || 0;
  const goldPaid = goldPaidByPlayer.value;
  
  if (purchaseCost === 0) return 0;
  
  // Вычитаем выручку от продажи из стоимости покупки
  const netCost = purchaseCost - saleIncome;
  
  // Если выручка покрывает покупку, нехватки нет
  if (netCost <= 0) return 0;
  
  // Иначе проверяем сколько игрок вложил
  const shortage = netCost - goldPaid;
  return shortage > 0 ? shortage : 0;
});

// Проверяем, достаточно ли денег
const hasEnoughGold = computed(() => {
  return goldShortage.value === 0;
});

// Вычисляем что выдать игроку (с учетом сдачи)
const itemsToGivePlayer = computed(() => {
  if (!resToPlayer.value || resToPlayer.value.length === 0) return [];
  
  // Ресурсы без золота
  const resources = resToPlayer.value.filter(item => 
    item.name !== 'Золото' && !item.name?.toLowerCase()?.includes('золото')
  );
  
  const purchaseCost = caravanStore.totalPurchaseCost || 0;
  const saleIncome = caravanStore.totalSaleIncome || 0;
  const goldPaid = goldPaidByPlayer.value;
  
  // Вычисляем итоговое золото для выдачи
  // Формула: Вложенное + Выручка - Стоимость покупки
  let goldToGive = goldPaid + saleIncome - purchaseCost;
  let goldLabel = 'Золото';
  
  if (purchaseCost > 0 && saleIncome > 0) {
    // Есть и покупка, и продажа
    goldLabel = 'Золото (сдача + выручка)';
  } else if (purchaseCost > 0) {
    // Только покупка
    goldLabel = 'Золото (сдача)';
  } else if (saleIncome > 0) {
    // Только продажа
    goldLabel = 'Золото (выручка)';
  }
  
  // Добавляем золото если оно больше 0
  if (goldToGive > 0) {
    return [
      ...resources,
      {
        identificator: 'gold',
        name: goldLabel,
        count: goldToGive
      }
    ];
  }
  
  return resources;
});

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
    :src="`/images/countries/${country.name}.png`"
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
                  :src="`/images/resources/${item.identificator}.png`"
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
                  :src="`/images/resources/${item.identificator}.png`"
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
          Посчитать
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
      <VCard class="results-card">
        <v-card-title>Выдать игроку</v-card-title>
        <v-card-text>
          <!-- Ресурсы для выдачи с картинками -->
          <div style="display: flex; flex-wrap: wrap; gap: 16px;">
            <div
              v-for="(item, index) in itemsToGivePlayer"
              :key="index"
              style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid #4caf50; border-radius: 8px; min-width: 200px; background-color: #e8f5e9;"
            >
              <v-img
                v-if="!item.name?.toLowerCase()?.includes('золото')"
                :src="`/images/resources/${item.identificator || 'unknown'}.png`"
                width="48"
                height="48"
                class="resource-icon"
              />
              <v-img
                v-else
                src="/images/resources/gold.png"
                width="48"
                height="48"
                class="resource-icon"
              />
              <div>
                <div class="text-subtitle-1 font-weight-bold" style="color: #2e7d32;">{{ item.name }}</div>
                <div class="text-body-2" style="color: #1b5e20;">
                  Количество: {{ item.count }}
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="itemsToGivePlayer.length === 0" class="text-body-2 text-grey mt-2">
            Нет ресурсов для выдачи
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
        <v-btn color="grey-darken-1" text @click="calculateCaravanRequest(true) ">
          Есть карточка контрабанды!
        </v-btn>
          <v-btn color="grey-darken-1" text @click="showEmbargoDialog = false">
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Модальное окно подтверждения каравана -->
  <v-dialog v-model="showConfirmDialog" max-width="800" persistent>
    <v-card>
      <v-card-title class="text-h5 bg-primary">Подтверждение каравана</v-card-title>
      
      <v-card-text class="pt-4">
        <!-- Игрок отправляет -->
        <div class="mb-6">
          <h3 class="mb-3">Игрок отправляет с караваном:</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 16px;">
            <div
              v-for="(item, index) in resourcesPlSells.filter(r => r.count && r.count > 0 && r.identificator !== 'gold')"
              :key="index"
              style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; min-width: 200px;"
            >
              <v-img
                :src="`/images/resources/${item.identificator}.png`"
                width="48"
                height="48"
                class="resource-icon"
              />
              <div>
                <div class="text-subtitle-1 font-weight-bold">{{ item.name }}</div>
                <div class="text-body-2">Количество: {{ item.count }}</div>
              </div>
            </div>
          </div>
          <div v-if="resourcesPlSells.filter(r => r.count && r.count > 0 && r.identificator !== 'gold').length === 0" class="text-body-2 text-grey">
            Нет ресурсов для отправки
          </div>
          
          <!-- Информация о золоте -->
          <div v-if="caravanStore.totalPurchaseCost > 0 || goldPaidByPlayer > 0" class="mt-4">
            <v-divider class="mb-3"></v-divider>
            <h4 class="mb-2">💰 Информация о золоте:</h4>
            <div class="pa-3" style="background-color: #f5f5f5; border-radius: 8px;">

              <div v-if="goldPaidByPlayer > 0" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Игрок вложил золота:</span>
                <strong :style="{ color: hasEnoughGold ? '#2e7d32' : '#d32f2f' }">{{ goldPaidByPlayer }}</strong>
              </div>
              <div v-if="caravanStore.totalSaleIncome > 0" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Выручка от продажи:</span>
                <strong style="color: #2e7d32;"> {{ caravanStore.totalSaleIncome }}</strong>
              </div>
              
              <div v-if="caravanStore.totalPurchaseCost > 0" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Стоимость покупки:</span>
                <strong style="color: #ff6f00;">- {{ caravanStore.totalPurchaseCost }}</strong>
              </div>
              <div v-if="caravanStore.totalSaleIncome > 0 && caravanStore.totalPurchaseCost > 0" style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-left: 16px;">
                <span style="color: #1976d2;">= К оплате:</span>
                <strong style="color: #1976d2;">{{ Math.max(0, caravanStore.totalPurchaseCost - caravanStore.totalSaleIncome) }}</strong>
              </div>

              <v-divider v-if="caravanStore.totalPurchaseCost > 0" class="my-2"></v-divider>
              
              <div v-if="goldShortage > 0" style="display: flex; justify-content: space-between;">
                <span style="color: #d32f2f; font-weight: bold;">❌ Нехватка:</span>
                <strong style="color: #d32f2f;">{{ goldShortage }}</strong>
              </div>
              <div v-else-if="caravanStore.totalPurchaseCost > 0" style="display: flex; justify-content: space-between;">
                <span style="color: #2e7d32; font-weight: bold;">✅ Всё в порядке</span>
                <strong style="color: #2e7d32;">✓</strong>
              </div>
            </div>
          </div>
        </div>

        <v-divider class="my-4"></v-divider>

        <!-- Игрок получает -->
        <div>
          <h3 class="mb-3">Игрок получает:</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 16px;">
            <div
              v-for="(item, index) in itemsToGivePlayer"
              :key="index"
              style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; min-width: 200px;"
            >
              <v-img
                v-if="!item.name?.toLowerCase()?.includes('золото')"
                :src="`/images/resources/${item.identificator || 'unknown'}.png`"
                width="48"
                height="48"
                class="resource-icon"
              />
              <v-img
                v-else
                src="/images/resources/gold.png"
                width="48"
                height="48"
                class="resource-icon"
              />
              <div>
                <div class="text-subtitle-1 font-weight-bold">{{ item.name }}</div>
                <div 
                  class="text-body-2" 
                  style="color: #4caf50;"
                >
                  Количество: {{ item.count }}
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="itemsToGivePlayer.length === 0" class="text-body-2 text-grey mt-2">
            Нет ресурсов для выдачи
          </div>
          
          <!-- Предупреждение о недостатке денег -->
          <v-alert
            v-if="!hasEnoughGold"
            type="error"
            class="mt-4"
            variant="tonal"
          >
            <strong>Недостаточно денег!</strong> Караван с отрицательным золотом не может быть зарегистрирован.
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn
          color="primary"
          variant="outlined"
          @click="recalculate"
          size="large"
        >
          Пересчитать
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="success"
          variant="elevated"
          @click="registerCaravan"
          size="large"
          :disabled="!hasEnoughGold"
        >
          Зарегистрировать караван
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