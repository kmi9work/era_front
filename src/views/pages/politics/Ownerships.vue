<script setup>
  import axios from 'axios'
  import Ownership from '@/views/pages/politics/Ownership.vue'
  import { reactive, computed } from 'vue'
  import { ref } from 'vue'

  const navigationTab = ref('settlements')


  const tabItems = [
    {
      name: 'Города Руси',
      key: 'settlements'
    },
    {
      name: 'Земли',
      key: 'regions'
    }
  ]

  const countries = ref([]);
  const settlements = ref([]);
  const regions = ref([]);

  const selected_nobles = ref([]);
  const nobles = ref([]);

  const tab = ref('option-1');

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

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/settlements.json`) 
      .then(response => {
        settlements.value = response.data;
      })
    await axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=1`) 
      .then(response => {
        regions.value = response.data;
      })
    await axios.get(`${import.meta.env.VITE_PROXY}/players.json`) 
      .then(response => {
        nobles.value = response.data.filter((player) => player.player_type?.id == 2); // 2 - Знать
      })
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`) 
      .then(response => {
        countries.value = response.data;
      })
  })

  
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
      <VWindow v-model="navigationTab">
        <VWindowItem
          v-for="(item) in tabItems"
          :key="item.key"
          :value="item.key"
        >
          <VCardText>
            <VRow>
              <template v-if="item.key == 'settlements'">
                <VCol
                  v-for="(settlement, i) in filteredSettles"
                  :key="settlement.name"
                >
                  <Ownership :id='settlement.id' type="settlement"/>
                </VCol>
              </template>




              <template v-else-if="item.key == 'regions'">
                <div class="d-flex flex-row">
                    <v-tabs
                      v-model="tab"
                      color="primary"
                      direction="vertical"
                    >
                      <v-tab 
                        v-for="(country, c_i) in countries"
                        :text="country.title" 
                        :value="country.id"
                      ></v-tab>
                    </v-tabs>

                    <v-tabs-window v-model="tab">
                      <v-tabs-window-item 
                        v-for="(country, c_i) in countries"
                        :value="country.id"
                      >
                        <v-card flat>
                          <v-card-text>
                            <VRow>
                              <VCol
                                v-for="(region, i) in regionsByCountry(country.id)"
                                :key="region.title"
                              >
                                <Ownership :id='region.id' type="region"/>
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
