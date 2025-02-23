<script setup>
  import Plant from '@/views/pages/economics/Plant.vue'
</script>

<script>
  import axios from 'axios'
  
  export default {
    setup(props){
    },
    data: () => {
      return {
        plants: [],
      }
    },
    created() {
      axios.get(`${import.meta.env.VITE_PROXY}/plants.json`) 
        .then(response => {
          this.plants = response.data;
        })
        .catch(e => {
          this.error.push(e)
        });
    },
  }
</script>

<template>
  <div>
    <VRow>
      <VCol
        v-for="(plant, i) in plants"
        :key="i"
      >
        <Plant :plant='plant'/>
      </VCol>
    </VRow>
  </div>
</template>

