<template>
  <v-container class="fill-height">
    <v-responsive
      class="align-centerfill-height mx-auto"
      max-width="900"
    >
      <v-row>
        <v-col>
          <PoliticalActionTypes :political_actions="political_actions"/>
        </v-col>
        <v-col>
          <v-data-table
            :headers="headers"
            :items="political_actions"
          ></v-data-table>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<script>
  import axios from 'axios'

  export default {
    data: () => {
      return {
        political_actions: [1,2,3],
        political_actions_length: 1,
        headers: [
          { title: 'Год', key: 'year', align: 'end' },
          { title: 'Успех', key: 'success', align: 'end' },
          { title: 'Название действия', key: 'political_action_type.title', align: 'end' },
          { title: 'Игрок', key: 'player.name', align: 'end' },
        ],
      }
    },
    methods: {
    },
    created() {
      axios.get(`${import.meta.env.VITE_PROXY}/political_actions.json`) 
        .then(response => {
          this.political_actions = response.data;
          this.political_actions_length = response.data.length;
        })
        .catch(e => {
          this.error.push(e)
        })
    },
  }
</script>
