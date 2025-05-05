<script setup>
  import axios from 'axios'
  import Army from '@/views/pages/politics/Army.vue'
  import ArmyForm from '@/views/pages/politics/ArmyForm.vue'
  import { reactive, computed, onBeforeMount, ref } from 'vue'

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
  const armies = ref([])
  const owners = ref([])
  const selected_owners = ref([])
  const settlements = ref([])
  const troop_types = ref([])
  const countries = ref([])
  const nobles = ref([])
  const upgrade_paths = ref({})
  const editingArmy = ref(null)

  const filteredArmies = computed(() => {
    if (selected_owners.value.length === 0) {
      return armies.value
    } else {
      return armies.value.filter(army => 
        selected_owners.value.includes(`${army.owner?.owner_type}-${army.owner?.id}`)
      )
    }
  })

  const armiesByNav = (type) => {
    return filteredArmies.value.filter(army => army.owner_type == type)
  }

  function onlyUnique(value, index, array) {
    return array.findIndex(item => item.id === value.id && item.owner_type === value.owner_type) === index
  }

  async function updateArmies() {
    await axios.get(`${import.meta.env.VITE_PROXY}/armies.json`) 
      .then(response => {
        armies.value = response.data
        owners.value = armies.value.map((a) => a.owner).filter(onlyUnique)
      })
  }

  async function loadAllOwners() {
    try {
      // Загружаем страны
      const countriesResponse = await axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`)
      countries.value = countriesResponse.data
      
      // Загружаем игроков и фильтруем знатных
      const playersResponse = await axios.get(`${import.meta.env.VITE_PROXY}/players.json`)
      nobles.value = playersResponse.data.filter(player => player.player_type?.id == 2) // 2 - Знать
    } catch (error) {
      console.error('Ошибка при загрузке владельцев:', error)
    }
  }

  async function loadUpgradePaths() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/troop_types/upgrade_paths.json`);
      upgrade_paths.value = response.data;
    } catch (error) {
      console.error('Ошибка при загрузке путей улучшений:', error);
      // Устанавливаем значения по умолчанию на случай ошибки
      upgrade_paths.value = {
        '1': 2, // Пехота -> Тяжелая пехота
        '2': 3, // Тяжелая пехота -> Кавалерия
        '3': 4  // Кавалерия -> Пушка
      };
    }
  }

  onBeforeMount(async () => {
    await loadUpgradePaths();
    await Promise.all([
      updateArmies(),
      loadAllOwners(),
      axios.get(`${import.meta.env.VITE_PROXY}/settlements.json?all=1`)
        .then(response => {
          settlements.value = response.data
        }),
      axios.get(`${import.meta.env.VITE_PROXY}/troop_types.json`)
        .then(response => {
          troop_types.value = response.data
        })
    ])
  })
</script>

<template>
  <div>
    <v-autocomplete
      v-model="selected_owners"
      :items="owners"
      label="Фильтр по игроку/стране"
      item-title="name"
      :item-value="item => `${item.owner_type}-${item.id}`"
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
                    <ArmyForm 
                      title="Создать армию"
                      :settlements="settlements"
                      :nobles="nobles"
                      :countries="countries"
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
                            :troop_types="troop_types"
                            :upgrade_paths="upgrade_paths"
                            :foreign="false"
                            :nobles="nobles"
                            :countries="countries"
                            @update-armies="updateArmies"
                            @edit-army="army => editingArmy = army"
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
                    <ArmyForm 
                      title="Создать армию"
                      :settlements="settlements"
                      :nobles="nobles"
                      :countries="countries"
                      @army-created="updateArmies"
                    />
                    <ArmyForm 
                      v-if="editingArmy"
                      title="Редактировать армию"
                      :settlements="settlements"
                      :nobles="nobles"
                      :countries="countries"
                      :army="editingArmy"
                      @army-updated="updateArmies"
                      @close="editingArmy = null"
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
                            :settlements="settlements"
                            :armies="armies"
                            :troop_types="troop_types"
                            :upgrade_paths="upgrade_paths"
                            :foreign="true"
                            :nobles="nobles"
                            :countries="countries"
                            @update-armies="updateArmies"
                            @edit-army="army => editingArmy = army"
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