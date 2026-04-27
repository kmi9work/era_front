<script setup>
  import Guild from '@/views/pages/economics/Guild.vue'
</script>

<script>
  import axios from 'axios'
  
  export default {
    setup(props){
    },
    data: () => {
      return {
        guilds: [],
      }
    },
    created() {
      axios.get(`${import.meta.env.VITE_PROXY}/guilds.json`) 
        .then(response => {
          this.guilds = response.data;
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
        v-for="(guild, i) in guilds"
        :key="i"
      >
        <Guild :guild='guild'/>
      </VCol>
    </VRow>
  </div>
</template>
