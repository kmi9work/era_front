<script setup>
  import axios from 'axios'
  import Ownership from '@/views/pages/politics/Ownership.vue'
  import { reactive, computed } from 'vue'
  import { ref} from '@vue/reactivity';


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

  const settlements = ref([]);
  const regions = ref([]);
  const selected_nobles = ref([]);
  const nobles = ref([]);

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

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/settlements.json`) 
      .then(response => {
        settlements.value = response.data;
      })
      .catch(e => {
      });
    await axios.get(`${import.meta.env.VITE_PROXY}/regions.json`) 
      .then(response => {
        regions.value = response.data;
      })
      .catch(e => {
      });
    await axios.get(`${import.meta.env.VITE_PROXY}/players.json`) 
      .then(response => {
        nobles.value = response.data.filter((player) => player.player_type?.id == 2);
      })
      .catch(e => {
      });
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
          :value="item.name"
        >
          {{ item.name }}
        </VTab>
      </VTabs>
      <VWindow v-model="navigationTab">
        <VWindowItem
          v-for="(item) in tabItems"
          :key="item.key"
          :value="item.name"
        >
          <VCardText>
            <VRow>
              <VCol
                v-for="(settlement, i) in filteredSettles"
                v-if="item.key == 'settlements'"
                :key="settlement.name"
              >
                <Ownership :id='settlement.id' type="settlement"/>
              </VCol>
              <VCol
                v-for="(region, i) in filteredRegions"
                v-else-if="item.key == 'regions'"
                :key="region.title"
              >
                <Ownership :id='region.id' type="region"/>
              </VCol>
            </VRow>
          </VCardText>
        </VWindowItem>
      </VWindow>
    </VCard>
  </div>
</template>
