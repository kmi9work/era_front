<script setup>
  import axios from 'axios'
  import { ref } from 'vue'

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/plant_levels/prod_info.json`)
    .then(response => {
      plantLevelsInfo.value = response.data;
      selectedPlantLevel.value = plantLevelsInfo.value[0]?.id;
    })
  })

  const to = ref([])
  const from = ref([])
  const change = ref([])
  const plantLevelsInfo = ref([])
  const back_bound_from = ref([])
  const prodResult_from = ref([])
  const selectedPlantLevel = ref(0)

  const plantLevel_from = computed(() => {
    let filtered = plantLevelsInfo.value.filter((res) => res.id == selectedPlantId.value);
    console.log(filtered);

    if (filtered.length){
      back_bound_from.value = Array(filtered[0]["formula_from"].length).fill(0).map(
        function(_, i) {
          return {"identificator": filtered[0]["formula_from"][i].identificator, "count": null}
        })
      return filtered[0]["formula_from"]
    }else{
      return []
    }

  })

  function submit_from(){
    let request = {"request": back_bound_from.value, "way": "from"}
    axios.post(`${import.meta.env.VITE_PROXY}/plant_levels/${selectedPlantId.value}/feed_to_plant`, request)
    .then(response => {
      prodResult_from.value = response.data;
      to.value = prodResult_from.value["to"]
      change.value = prodResult_from.value["change"]
      from.value = null;
    })
  }

  const back_bound_to = ref([])
  const prodResult_to = ref([])

  const plantLevel_to = computed(() => {
    let filtered = plantLevelsInfo.value.filter((res) => res.id == selectedPlantId.value);
    console.log(filtered);
    if (filtered.length){
      back_bound_to.value = Array(filtered[0]["formula_to"].length).fill(0).map(
        function(_, i) {
          return {"identificator": filtered[0]["formula_to"][i].identificator, "count": null}
        })
      return filtered[0]["formula_to"]
    }else{
      return [];
    }

  })


  function submit_to(){
     let request = {"request": back_bound_to.value, "way": "to"}
     axios.post(`${import.meta.env.VITE_PROXY}/plant_levels/${selectedPlantId.value}/feed_to_plant`, request)
     .then(response => {
      prodResult_to.value = response.data;
      from.value = prodResult_to.value["from"]
      change.value = prodResult_to.value["change"]
      to.value = null;
    })
  }

  // ID выбранного растения
  const selectedPlantId = computed(() => {
    if (selectedPlantLevelIndex.value === null) return null
    return filteredPlantsByType.value[selectedPlantLevelIndex.value]?.id || null
  })

  const selectedPlantTypeIndex = ref(null)
  const selectedPlantLevelIndex = ref(null)

  const uniquePlantTypes = computed(() => {
    return [...new Set(plantLevelsInfo.value.map(plant => plant.name))]
  })

  // Растения отфильтрованные по выбранному типу
  const filteredPlantsByType = computed(() => {
    if (selectedPlantTypeIndex.value === null) return []
    const selectedType = uniquePlantTypes.value[selectedPlantTypeIndex.value]
    return plantLevelsInfo.value.filter(plant => plant.name === selectedType)
  })

  // Можно добавить watcher для selectedPlantId если нужно
  watch(selectedPlantId, (newId) => {
    console.log('Выбранный ID растения:', newId)
    // Здесь можно выполнять дополнительные действия при изменении выбранного ID
  })


</script>


<template>

  <div>
    <v-item-group v-model="selectedPlantTypeIndex" selected-class="bg-primary">
      <v-container>
        <v-row>
          <v-col
            v-for="(plantType, index) in uniquePlantTypes"
            :key="'type-' + index"
          >
            <v-item v-slot="{ isSelected, selectedClass, toggle }">
              <v-card
                :class="['d-flex align-center', selectedClass]"
                height="80"
                dark
                @click="toggle"
              >
                <div class="text-h5 flex-grow-1 text-center">
                  {{ plantType }}
                </div>
              </v-card>
            </v-item>
          </v-col>
        </v-row>
      </v-container>
    </v-item-group>

    <v-item-group v-model="selectedPlantLevelIndex" selected-class="bg-primary">
      <v-container>
        <v-row>
          <v-col
            v-for="(plant, index) in filteredPlantsByType"
            :key="'level-' + plant.id"
          >
            <v-item v-slot="{ isSelected, selectedClass, toggle }">
              <v-card
                :class="['d-flex align-center', selectedClass]"
                height="50"
                dark
                @click="toggle"
              >
                <div class="text-h4 flex-grow-1 text-center">
                  {{ plant.level }}
                </div>
              </v-card>
            </v-item>
          </v-col>
        </v-row>
      </v-container>
    </v-item-group>

    <VCard title="">
      <VCardText>
        <VRow>
          <VCol>
            <VCard title="Произвести из ресурсов">
              <v-form @submit.prevent="submit_from" class= "px-3">
                <v-text-field
                 v-for="item, index in plantLevel_from"
                 v-model="back_bound_from[index].count"
                 :key="index"
                 :label="item.name"
                 placeholder="Введите количество"
                 variant="outlined"
                 style="margin-bottom: 10px;"
                 >
                </v-text-field>
              </v-form>
            </VCard>

          </VCol>
          <VCol>
            <VCard title="Сколько надо ресурсов?">
              <v-form @submit.prevent="submit_to" class= "px-3">
                <v-text-field
                  v-for="item, index in plantLevel_to"
                  v-model="back_bound_to[index].count"
                  :key="index"
                  :label="item.name"
                  placeholder="Введите количество"
                  variant="outlined"
                  style="margin-bottom: 10px;"
                  >
                </v-text-field>
              </v-form>
            </VCard>

          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VCard title="">
      <VCardText>
        <VRow>
          <VCol>
            <v-btn class="mt-2" @click="submit_from" block>Переработать</v-btn>
          </VCol>
          <VCol>
            <v-btn class="mt-2" @click="submit_to" block>Посмотреть, сколько надо ресурса</v-btn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
     <VCard title="">
      <VCardText>
        <VRow>
          <VCol>
            <VCard title="Выдать игроку"
              style="margin-bottom: 10px;">
              <v-card-text v-for="item, index in to">
                <div v-if="item.count !== 0" style="font-size: 30px;">
                  {{ item.name }}: {{ item.count }}
                </div>
              </v-card-text>
            </VCard>
          </VCol>
          <VCol>
          <VCard title="Столько ресурсов надо"
            style="margin-bottom: 10px;">
              <v-card-text v-for="item, index in from">
                <div v-if="item.count !== 0" style="font-size: 30px;">
                  {{ item.name }}: {{ item.count }}
                </div>
              </v-card-text>
          </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
    <VCard>
      <VCardText>
        <VCard title="Остаток"
            style="margin-bottom: 10px;">
              <v-card-text v-for="item, index in change">
                <div v-if="item.count !== 0" style="font-size: 30px;">
                  {{ item.name }}: {{ item.count }}
                </div>
              </v-card-text>
          </VCard>
      </VCardText>
    </VCard>


  </div>


</template>