<script>
  import axios from 'axios'
  
  export default {
    setup(props){
    },
    data: () => {
      return {
        players: [],
      }
    },
    created() {
      axios.get(`${import.meta.env.VITE_PROXY}/players.json`) 
        .then(response => {
          this.players = response.data;
        })
        .catch(e => {
          this.error.push(e)
        });
    },
    computed: {
      nobles: function () {
        return this.players.filter(i => i.job)
      },
    },
  }
</script>


<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Доходы знати</VCardTitle>
    </VCardItem>

    <VCardText>
      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">
              Игрок
            </th>
            <th class="text-left">
              Должность
            </th>
            <th class="text-left">
              Доход
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="player in nobles"
            :key="player.id"
          >
            <td>{{ player.name }}</td>
            <td>{{ player.job.name }}</td>
            <td>{{ player.income }}</td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>
