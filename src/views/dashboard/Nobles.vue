<script setup>
  import axios from 'axios'
  
  const nobles = ref([]);
  onBeforeMount(async () => {
    axios.get(`${import.meta.env.VITE_PROXY}/players.json`) 
      .then(response => {
        nobles.value = response.data.filter((player) => player.player_type?.id == 2); // 2 - Знать;
      })
  })
</script>


<template>
  <VCard max-width="600">
    <VCardItem>
      <VCardTitle>Знать</VCardTitle>
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
            <th class="text-left">
              Влияние
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
            <td>
              <v-btn
                class="text-none"
                color="medium-emphasis"
                variant="text"
                rounded
                prepend-icon="ri-arrow-down-double-fill"
                min-width="50"
                style="justify-content: start;"
              >
                {{ player.influence }}
                <v-menu activator="parent">
                  <VList>
                    <VListItem 
                      v-for="(item, i) in player.influence_items"
                      :key="i"
                    >
                      <VListItemTitle>{{item.comment}} | {{item.value}}</VListItemTitle>
                    </VListItem>
                  </VList>
                </v-menu>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>
