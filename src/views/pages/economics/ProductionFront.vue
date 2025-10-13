<script setup>
  import axios from 'axios'
  import { ref } from 'vue'

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/plant_levels/prod_info_full.json`)
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

  // Вспомогательные функции для работы с массивами ресурсов (перенесено с сервера)
  
  // Проверяет, не превышает ли количество хоть одного ресурса во втором массиве количество такого же ресурса в первом.
  function isResArrayLess(resArray1, resArray2) {
    for (const res1 of resArray1) {
      const var2 = resArray2.find(res2 => res1.identificator === res2.identificator)
      if (!var2) return false
      if (res1.count > var2.count) return false
    }
    return true
  }

  // Умножает массив ресурсов на число
  function resArrayMult(resArray, n, plantLevel) {
    return resArray.map(res => ({
      ...res,
      count: res.count * n,
      name: res.name || lookUpRes(res.identificator, plantLevel)
    }))
  }

  // Складывает два массива ресурсов (модифицирует array1 in-place, как на сервере)
  function resArraySum(array1, array2, sign = 1) {
    const arr2Copy = JSON.parse(JSON.stringify(array2))
    
    // Проходим по array1 и добавляем/вычитаем совпадающие элементы из arr2Copy
    for (const res1 of array1) {
      for (let i = arr2Copy.length - 1; i >= 0; i--) {
        if (res1.identificator === arr2Copy[i].identificator) {
          res1.count += arr2Copy[i].count * sign
          arr2Copy.splice(i, 1)
        }
      }
    }
    
    // Добавляем оставшиеся элементы из arr2Copy в array1
    for (const res of arr2Copy) {
      array1.push({...res, count: res.count * sign})
    }
    
    return array1
  }

  // Поиск имени ресурса (аналог look_up_res)
  function lookUpRes(identificator, plantLevel) {
    // Ищем в formula_from
    const fromRes = plantLevel.formula_from?.find(r => r.identificator === identificator)
    if (fromRes) return fromRes.name
    
    // Ищем в formula_to
    const toRes = plantLevel.formula_to?.find(r => r.identificator === identificator)
    if (toRes) return toRes.name
    
    return identificator
  }

  // Основная функция подсчета для одной формулы
  function countRequest(formula, request, way, plantLevel) {
    let n = 0
    let bucket = JSON.parse(JSON.stringify(formula[way])) // deep copy
    const formulaPart = formula[way]

    while (
      isResArrayLess(bucket, request) && 
      isResArrayLess(resArrayMult(formula.to, n + 1, plantLevel), formula.max_product)
    ) {
      bucket = resArraySum(bucket, JSON.parse(JSON.stringify(formulaPart)))
      n += 1
    }

    const to = resArrayMult(formula.to, n, plantLevel)
    const from = resArrayMult(formula.from, n, plantLevel)

    return { from, to }
  }

  // Главная функция feed_to_plant (перенесено с сервера)
  function feedToPlant(plantLevel, request, way = 'from') {
    // Проверяем, открыта ли технология "Школы" для коэффициента
    const coof = plantLevel.tech_schools_open ? 1.5 : 1

    // Преобразуем request
    const requestCopy = request.map(req => ({
      identificator: req.identificator.toString(),
      count: way === 'to' ? Math.ceil(parseInt(req.count || 0) / coof) : parseInt(req.count || 0),
      name: lookUpRes(req.identificator, plantLevel)
    }))

    let resultingFrom = []
    let resultingTo = []

    // Проходим по всем формулам
    plantLevel.formulas.forEach(formula => {
      const { from, to } = countRequest(formula, requestCopy, way, plantLevel)
      
      // Вычитаем использованные ресурсы из request
      if (way === 'from') {
        resArraySum(requestCopy, from, -1)
      } else {
        resArraySum(requestCopy, to, -1)
      }

      resArraySum(resultingFrom, from)
      resArraySum(resultingTo, to)
    })

    // Применяем коэффициент к результату
    resultingTo.forEach(res => {
      res.count = res.count * coof
    })

    return {
      from: resultingFrom,
      to: resultingTo,
      change: requestCopy
    }
  }

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
    const plantLevel = plantLevelsInfo.value.find(p => p.id === selectedPlantId.value)
    if (!plantLevel) {
      console.error('PlantLevel not found')
      return
    }
    
    console.log('PlantLevel:', plantLevel)
    console.log('Tech Schools открыта:', plantLevel.tech_schools_open ? 'ДА (коэф. 1.5)' : 'НЕТ (коэф. 1.0)')
    console.log('Request:', back_bound_from.value)
    
    const result = feedToPlant(plantLevel, back_bound_from.value, 'from')
    
    console.log('Result:', result)
    
    prodResult_from.value = result
    to.value = result.to
    change.value = result.change
    from.value = null
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
    const plantLevel = plantLevelsInfo.value.find(p => p.id === selectedPlantId.value)
    if (!plantLevel) {
      console.error('PlantLevel not found')
      return
    }
    
    console.log('PlantLevel:', plantLevel)
    console.log('Tech Schools открыта:', plantLevel.tech_schools_open ? 'ДА (коэф. 1.5)' : 'НЕТ (коэф. 1.0)')
    console.log('Request:', back_bound_to.value)
    
    const result = feedToPlant(plantLevel, back_bound_to.value, 'to')
    
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
