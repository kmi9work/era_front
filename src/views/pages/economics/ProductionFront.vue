<script setup>
  import { ref, watch, onBeforeMount } from 'vue'
  import { useProductionStore } from '@/stores/production'

  const productionStore = useProductionStore()

  onBeforeMount(async () => {
    await productionStore.fetchPlantLevels()
  })

  const to = ref([])
  const from = ref([])
  const change = ref([])

  // Watcher для инициализации inputResources в store
  watch([() => productionStore.selectedPlantId, () => productionStore.calculationMode], () => {
    productionStore.initializeInputResources()
  })

  const plantLevel_from = computed(() => {
    let filtered = productionStore.plantLevelsInfo.filter((res) => res.id == productionStore.selectedPlantId)
    
    if (filtered.length) {
      back_bound_from.value = Array(filtered[0]["formula_from"].length).fill(0).map(
        function(_, i) {
          return {"identificator": filtered[0]["formula_from"][i].identificator, "count": null}
        })
      return filtered[0]["formula_from"]
    } else {
      return []
    }
  })

  const plantLevel_to = computed(() => {
    let filtered = productionStore.plantLevelsInfo.filter((res) => res.id == productionStore.selectedPlantId)
    
    if (filtered.length) {
      back_bound_to.value = Array(filtered[0]["formula_to"].length).fill(0).map(
        function(_, i) {
          return {"identificator": filtered[0]["formula_to"][i].identificator, "count": null}
        })
      return filtered[0]["formula_to"]
    } else {
      return []
    }
  })

  function submit_from() {
    try {
      // Устанавливаем режим и ресурсы в store
      productionStore.calculationMode = 'from'
      productionStore.inputResources = back_bound_from.value.map(r => ({
        identificator: r.identificator,
        count: parseInt(r.count || 0),
        name: r.name
      }))
      
      // Выполняем расчет через store
      const result = productionStore.calculateProduction()
      
      to.value = result.to
      change.value = result.change
      from.value = null
      
      console.log('Result:', result)
    } catch (error) {
      console.error('Error:', error.message)
    }
  }

  function submit_to() {
    try {
      // Устанавливаем режим и ресурсы в store
      productionStore.calculationMode = 'to'
      productionStore.inputResources = back_bound_to.value.map(r => ({
        identificator: r.identificator,
        count: parseInt(r.count || 0),
        name: r.name
      }))
      
      // Выполняем расчет через store
      const result = productionStore.calculateProduction()
      
      from.value = result.from
      change.value = result.change
      to.value = null
      
      console.log('Result:', result)
    } catch (error) {
      console.error('Error:', error.message)
    }
  }


</script>


<template>

  <div>
    <v-item-group v-model="productionStore.selectedPlantTypeIndex" selected-class="bg-primary">
      <v-container>
        <v-row>
          <v-col
            v-for="(plantType, index) in productionStore.uniquePlantTypes"
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

    <v-item-group v-model="productionStore.selectedPlantLevelIndex" selected-class="bg-primary">
      <v-container>
        <v-row>
          <v-col
            v-for="(plant, index) in productionStore.filteredPlantsByType"
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
