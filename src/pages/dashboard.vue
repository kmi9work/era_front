<script setup>
import axios from 'axios'
import { ref, onBeforeMount, onBeforeUnmount } from 'vue'

import Nobles from '@/views/dashboard/Nobles.vue'
import PublicOrder from '@/views/dashboard/PublicOrder.vue'
import Relations from '@/views/dashboard/Relations.vue'
import Technologies from '@/views/dashboard/Technologies.vue'

const nobles = ref([]);
const regions = ref([]);
const countries = ref([]);
const technologies = ref([]);
const pollInterval = ref(null);

async function loadDashboards(){
  axios.get(`${import.meta.env.VITE_PROXY}/players.json`) 
    .then(response => {
      nobles.value = response.data.filter((player) => player.player_type?.id == 2); // 2 - Знать;
    })
  axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=0`) 
    .then(response => {
      regions.value = response.data;
    })
  axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`) 
      .then(response => {
        countries.value = response.data;
      })
  axios.get(`${import.meta.env.VITE_PROXY}/technologies.json`) 
      .then(response => {
        technologies.value = response.data;
      })
}


onBeforeMount(async () => {
  loadDashboards();
  
  // Устанавливаем периодическое обновление каждые 10 секунд
  pollInterval.value = setInterval(() => {
    loadDashboards();
  }, 10000);
})

onBeforeUnmount(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value);
  }
})


</script>

<template>
  <VRow class="match-height">
    <VCol>
      <Nobles :nobles="nobles" @reload-dashboard="loadDashboards"/>
    </VCol>

    <VCol>
      <PublicOrder :regions="regions" @reload-dashboard="loadDashboards"/>
    </VCol>

    <VCol>
      <Relations :countries="countries" @reload-dashboard="loadDashboards"/>
    </VCol>

    <VCol>
      <Technologies :technologies="technologies" @reload-dashboard="loadDashboards"/>
    </VCol>
  </VRow>
</template>
