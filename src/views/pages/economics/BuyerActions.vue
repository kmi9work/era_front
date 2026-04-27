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
    <v-list>
      <v-list-item
        v-for="(plant, i) in plants"
        :key="i"
        color="primary"
        rounded="xl"
        v-on:click=""
      >
        <v-list-item-title :id="plant.id" v-text="plant.plant_type.name"></v-list-item-title>
      </v-list-item>
    </v-list>
  </div>
</template>