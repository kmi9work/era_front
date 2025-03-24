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
    let filtered = plantLevelsInfo.value.filter((res) => res.id == selectedPlantLevel.value);

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
    axios.post(`${import.meta.env.VITE_PROXY}/plant_levels/${selectedPlantLevel.value}/feed_to_plant`, request)
    .then(response => {
      prodResult_from.value = response.data;
      to.value = prodResult_from.value["to"]
      change.value = prodResult_from.value["change"]
    })
  }

  const back_bound_to = ref([])
  const prodResult_to = ref([])

  const plantLevel_to = computed(() => {
    let filtered = plantLevelsInfo.value.filter((res) => res.id == selectedPlantLevel.value);

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
     axios.post(`${import.meta.env.VITE_PROXY}/plant_levels/${selectedPlantLevel.value}/feed_to_plant`, request)
     .then(response => {
      prodResult_to.value = response.data;
      from.value = prodResult_to.value["from"]
      change.value = prodResult_to.value["change"]
    })
  }

</script>


<template>

  <div>
    <VSelect
      v-model="selectedPlantLevel"
      label="Select"
      item-title="plant_type_name"
      item-value="id"
      :items="plantLevelsInfo"
    ></VSelect>

    <VCard title="">
      <VCardText>
        <VRow>
          <VCol>
            <VCard title="Произвести из ресурсов">
              <v-form @submit_from.prevent class= "px-3">
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
            <VCard title="Посмотреть, сколько ресурсов нужно для производства выбранного количества">
              <v-form @submit_to.prevent class= "px-3">
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
        <VCard title="То, что нельзя переработать из-за превышенного лимита"
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