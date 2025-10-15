<script setup>
  import axios from 'axios'
  import { ref, computed, watch, onBeforeMount } from 'vue'
  import { useProductionStore } from '@/stores/production'

  const productionStore = useProductionStore()

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/plant_levels/prod_info_full.json`)
    .then(response => {
      // Сохраняем данные в store
      productionStore.setPlantLevels(response.data)
      selectedPlantLevel.value = productionStore.plantLevelsInfo[0]?.id
    })
  })

  const to = ref([])
  const from = ref([])
  const change = ref([])
  const back_bound_from = ref([])
  const prodResult_from = ref([])
  const selectedPlantLevel = ref(0)

  const plantLevel_from = computed(() => {
    let filtered = productionStore.plantLevelsInfo.filter((res) => res.id == selectedPlantId.value)
    console.log(filtered)

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
    const plantLevel = productionStore.getPlantLevelById(selectedPlantId.value)
    if (!plantLevel) {
      console.error('PlantLevel not found')
      return
    }
    
    console.log('PlantLevel:', plantLevel)
    console.log('Tech Schools открыта:', plantLevel.tech_schools_open ? 'ДА (коэф. 1.5)' : 'НЕТ (коэф. 1.0)')
    console.log('Request:', back_bound_from.value)
    
    // Используем store для расчета
    const result = productionStore.feedToPlant(selectedPlantId.value, back_bound_from.value, 'from')
    
    console.log('Result:', result)
    
    prodResult_from.value = result
    to.value = result.to
    change.value = result.change
    from.value = null
  }

  const back_bound_to = ref([])
  const prodResult_to = ref([])

  const plantLevel_to = computed(() => {
    let filtered = productionStore.plantLevelsInfo.filter((res) => res.id == selectedPlantId.value)
    console.log(filtered)
    if (filtered.length){
      back_bound_to.value = Array(filtered[0]["formula_to"].length).fill(0).map(
        function(_, i) {
          return {"identificator": filtered[0]["formula_to"][i].identificator, "count": null}
        })
      return filtered[0]["formula_to"]
    }else{
      return []
    }

  })


  function submit_to(){
    const plantLevel = productionStore.getPlantLevelById(selectedPlantId.value)
    if (!plantLevel) {
      console.error('PlantLevel not found')
      return
    }
    
    console.log('PlantLevel:', plantLevel)
    console.log('Tech Schools открыта:', plantLevel.tech_schools_open ? 'ДА (коэф. 1.5)' : 'НЕТ (коэф. 1.0)')
    console.log('Request:', back_bound_to.value)
    
    // Используем store для расчета
    const result = productionStore.feedToPlant(selectedPlantId.value, back_bound_to.value, 'to')
    
    console.log('Result:', result)
    
    prodResult_to.value = result
    from.value = result.from
    change.value = result.change
    to.value = null
  }

  // ID выбранного растения
  const selectedPlantId = computed(() => {
    if (selectedPlantLevelIndex.value === null) return null
    return filteredPlantsByType.value[selectedPlantLevelIndex.value]?.id || null
  })

  const selectedPlantTypeIndex = ref(null)
  const selectedPlantLevelIndex = ref(null)

  // Используем computed из store
  const uniquePlantTypes = computed(() => productionStore.uniquePlantTypes)

  // Растения отфильтрованные по выбранному типу
  const filteredPlantsByType = computed(() => {
    if (selectedPlantTypeIndex.value === null) return []
    const selectedType = uniquePlantTypes.value[selectedPlantTypeIndex.value]
    return productionStore.getPlantsByType(selectedType)
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
            <VCard title="Произвести из ресурсов (ФРОНТ)">
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
            <VCard title="Сколько надо ресурсов? (ФРОНТ)">
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
