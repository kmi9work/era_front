<script setup>
  import axios from 'axios'
  import Army from '@/views/pages/politics/Army.vue'
  import ArmyCreate from '@/views/pages/politics/ArmyCreate.vue'
  import { reactive, computed } from 'vue'
  import { ref } from 'vue'

  const tabItems = [
    {
      name: 'Русь',
      key: 'Player'
    },
    {
      name: 'Зарубеж',
      key: 'Country'
    }
  ]

  const navigationTab = ref('Player')

  const armies = ref([]);
  const owners = ref([]);
  const selected_owners = ref([]);
  const settlements = ref([]);

  const filteredArmies = computed(() => {
    if (selected_owners.value.length === 0){
      return armies.value;
    } else{
      return armies.value.filter(army => selected_owners.value.includes(`${army.owner?.owner_type}-${army.owner?.id}`));
    }
  })

  const armiesByNav = (type) => {
    return filteredArmies.value.filter(army => army.owner_type == type);
  }

  function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
  }

  async function updateArmies(){
    await axios.get(`${import.meta.env.VITE_PROXY}/armies.json`) 
      .then(response => {
        armies.value = response.data;
        owners.value = armies.value.map((a) => a.owner).filter(onlyUnique);
      })
  }

  onBeforeMount(async () => {
    updateArmies();

    await axios.get(`${import.meta.env.VITE_PROXY}/settlements.json?all=1`) 
      .then(response => {
        settlements.value = response.data;
      })
  })

  
</script>

<template>
  <div>
    <v-autocomplete
      v-model="selected_owners"
      :items="owners"
      label="Фильтр по игроку"
      item-title="name"
      :item-value="item=>`${item.owner_type}-${item.id}`"
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
              <template v-if="item.key == 'Player'">
                <div class="d-flex flex-row">
                  <div style="padding: 20px">
                    <ArmyCreate 
                      title="Создать армию"
                      @army-created="updateArmies"
                    />
                  </div>
                  <v-card flat>
                    <v-card-text>
                      <VRow>
                        <VCol
                          v-for="(army, i) in armiesByNav('Player')"
                          :key="army.id"
                        >
                          <Army 
                            :army="army"
                            :settlements="settlements"
                            :armies="armies"
                            @update-armies="updateArmies"
                          />
                        </VCol>
                      </VRow>
                    </v-card-text>
                  </v-card>
                </div>
              </template>

              <template v-else-if="item.key == 'Country'">
                <div class="d-flex flex-row">
                  <div style="padding: 20px">
                    <ArmyCreate 
                      title="Создать армию"
                      @army-created="updateArmies"
                    />
                  </div>
                  <v-card flat>
                    <v-card-text>
                      <VRow>
                        <VCol
                          v-for="(army, i) in armiesByNav('Country')"
                          :key="army.id"
                        >
                          <Army 
                            :army="army"
                          />
                        </VCol>
                      </VRow>
                    </v-card-text>
                  </v-card>
                </div>
              </template>
            </VRow>
          </VCardText>
        </VWindowItem>
      </VWindow>
    </VCard>
  </div>
</template>
