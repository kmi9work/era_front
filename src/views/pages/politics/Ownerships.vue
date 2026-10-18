<script setup>
  import axios from 'axios'
  import { computed, onBeforeMount, ref, watch } from 'vue'
  import CaptureRegion from '@/views/pages/politics/CaptureRegion.vue'
  import Ownership from '@/views/pages/politics/Ownership.vue'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'

  /**
   * «Политика → Владения» в разрезе текущего государства (ТЗ № 2, § 4).
   *
   * Первая вкладка — регионы и поселения текущего государства, вторая («Зарубеж») —
   * регионы всех остальных государств. Название первой вкладки — имя текущего
   * государства (ключи вкладок не меняются, чтобы не ломать состояние). При смене
   * государства данные перечитываются без перезагрузки страницы (§ 1.1).
   */
  const { currentCountry, currentCountryId, reloadToken, loadCurrentCountry } = useCurrentCountry()

  const navigationTab = ref('settlements')

  // Ключи вкладок фиксированы, реактивно меняется только название первой.
  const tabItems = computed(() => [
    {
      name: currentCountry.value?.name || 'Русь',
      key: 'settlements'
    },
    {
      name: 'Зарубеж',
      key: 'regions'
    }
  ])

  const countries = ref([]);
  const foreign_countries = ref([]);
  const settlements = ref([]);
  const regions = ref([]);
  const rus_regions = ref([]);
  const building_types = ref([]);

  const selected_nobles = ref([]);
  const nobles = ref([]);

  const tab_regions = ref(0);
  const tab_settles = ref(0);
  const width_r = ref(300);
  const width_c = ref(300);

  const filteredSettles = computed(() => {
    if (selected_nobles.value.length === 0){
      return settlements.value;
    } else{
      return settlements.value.filter(settle => selected_nobles.value.includes(settle.player?.id));
    }
  })

  const filteredRegions = computed(() => {
    if (selected_nobles.value.length === 0){
      return regions.value;
    } else{
      return regions.value.filter(region => selected_nobles.value.includes(region.player?.id));
    }
  })

  const regionsByCountry = (country_id) => {
    return filteredRegions.value.filter(region => region.country?.id == country_id);
  }

  const settlesByRegion = (region_id) => {
    return filteredSettles.value.filter(settle => settle.region_id == region_id);
  }

  // Знать (player_type_id=2) только текущего государства — для фильтра по игроку
  // и диалога «Кому?» передачи поселения.
  async function loadNobles(){
    if (!currentCountryId.value){
      nobles.value = [];
      return;
    }
    await axios.get(`${import.meta.env.VITE_PROXY}/players.json?country_id=${currentCountryId.value}&player_type_id=2`)
      .then(response => {
        nobles.value = Array.isArray(response.data) ? response.data : [];
      })
  }

  // Перечитывание владений. Вызывается и при смене государства, и как обработчик
  // события capture-region после передачи региона/поселения.
  async function updateOwnerships(){
    if (!currentCountryId.value) return
    const country_id = currentCountryId.value
    // Поселения текущего государства (явный country_id).
    await axios.get(`${import.meta.env.VITE_PROXY}/settlements.json?country_id=${country_id}`)
      .then(response => {
        settlements.value = response.data;
      })
    // Регионы всех остальных государств — вкладка «Зарубеж».
    await axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=1`)
      .then(response => {
        regions.value = response.data;
      })
    // Регионы текущего государства — первая вкладка (явный country_id вместе с foreign=0).
    await axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=0&country_id=${country_id}`)
      .then(response => {
        rus_regions.value = response.data;
      })
    // Страны, кроме текущего, — список государств во вкладке «Зарубеж».
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`)
      .then(response => {
        foreign_countries.value = response.data;
      })
    // Полный список государств — цели передачи владения (CaptureRegion / Ownership).
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json`)
      .then(response => {
        countries.value = response.data;
      })
  }

  // Смена государства: сброс данных прошлого государства и повторная загрузка (§ 1.1).
  watch(reloadToken, () => {
    countries.value = []
    foreign_countries.value = []
    settlements.value = []
    regions.value = []
    rus_regions.value = []
    nobles.value = []
    selected_nobles.value = []
    tab_regions.value = 0
    tab_settles.value = 0
    loadNobles()
    updateOwnerships()
  })

  onBeforeMount(async () => {
    await loadCurrentCountry()
    loadNobles()
    await axios.get(`${import.meta.env.VITE_PROXY}/building_types.json`)
      .then(async (response) => {
        building_types.value = response.data;
      })
    updateOwnerships();
  })


  async function joinPeace(country_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/countries/${country_id}/join_peace.json`)
      .then(async (response) => {
        updateOwnerships();
        alert("Страна присоединена!")
      })
  };

  
</script>

<template>
  <div>
    <v-autocomplete
      v-model="selected_nobles"
      :items="nobles"
      label="Фильтр по игроку"
      item-title="name"
      item-value="id"
      multiple
      clearable
      persistent-hint
    ></v-autocomplete>
    <VCard>
      <VTabs v-model="navigationTab">
        <VTab
          v-for="item in tabItems"
          :key="item.key"
          :value="item.key"
        >
          {{ item.name }}
        </VTab>
      </VTabs>
      <VWindow v-model="navigationTab" :touch="false">
        <VWindowItem
          v-for="(item) in tabItems"
          :key="item.key"
          :value="item.key"
        >
          <VCardText class="overflow-x-auto">
            <VRow>
              <template v-if="item.key == 'settlements'">
                <div class="d-flex flex-row">
                  <v-tabs
                    v-model="tab_settles"
                    color="primary"
                    direction="vertical"
                    :style="`width: ${width_r}px;`"
                  >
                    <div style="text-align: center;">
                      <h2 @click="width_r == 50 ? width_r = 300 : width_r = 50"> Регионы </h2>
                    </div>
                    <v-tab 
                      v-for="(region, c_i) in rus_regions"
                      :text="region.name" 
                      :value="region.id"
                      :base-color="settlesByRegion(region.id).length > 0 ? '#000' : '#777'"
                    ></v-tab>
                  </v-tabs>

                  <v-tabs-window v-model="tab_settles">
                    <v-tabs-window-item 
                      v-for="(region, c_i) in rus_regions"
                      :value="region.id"
                    >
                      <div style="padding: 20px">
                        <CaptureRegion 
                          title="Передать регион"
                          :countries="countries"
                          :ownership="region"
                          @capture-region="updateOwnerships"
                        />
                      </div>
                      <v-card flat>
                        <v-card-text>
                          <VRow>
                            <VCol
                              v-for="(settle, i) in settlesByRegion(region.id)"
                              :key="settle.name"
                            >
                              <Ownership 
                                :id='settle.id' 
                                type="settlement" 
                                :countries="countries"
                                :nobles="nobles"
                                :building_types="building_types"
                                @capture-region="updateOwnerships"
                              />
                            </VCol>
                          </VRow>
                        </v-card-text>
                      </v-card>
                    </v-tabs-window-item>
                  </v-tabs-window>
                </div>
              </template>

              <template v-else-if="item.key == 'regions'">
                <div class="d-flex flex-row">
                  <v-tabs
                    v-model="tab_regions"
                    color="primary"
                    direction="vertical"
                    :style="`width: ${width_c}px;`"
                  >
                    <div style="text-align: center;">
                      <h2 @click="width_c == 50 ? width_c = 300 : width_c = 50"> Страны </h2>
                    </div>
                    <v-tab 
                      v-for="(country, c_i) in foreign_countries"
                      :text="country.name" 
                      :value="country.id"
                      :base-color="regionsByCountry(country.id).length > 0 ? '#000' : '#777'"
                    ></v-tab>
                  </v-tabs>

                  <v-tabs-window v-model="tab_regions">
                    <v-tabs-window-item 
                      v-for="(country, c_i) in foreign_countries"
                      :value="country.id"
                    >
                      <div style="padding: 20px">
                        <VBtn @click="joinPeace(country.id)">Присоединить страну миром</VBtn>
                      </div>
                      <v-card flat>
                        <v-card-text>
                          <VRow>
                            <VCol
                              v-for="(region, i) in regionsByCountry(country.id)"
                              :key="region.name"
                            >
                              <Ownership 
                                :id='region.id' 
                                type="region" 
                                :countries="countries"
                                :nobles="nobles"
                                :building_types="building_types"
                                @capture-region="updateOwnerships"
                              />
                            </VCol>
                          </VRow>
                        </v-card-text>
                      </v-card>
                    </v-tabs-window-item>
                  </v-tabs-window>
                </div>
              </template>
            </VRow>
          </VCardText>
        </VWindowItem>
      </VWindow>
    </VCard>
  </div>
</template>
