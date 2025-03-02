<script setup>
  import axios from 'axios'

  const regions = ref([]);
  
  onBeforeMount(async () => {
    axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=0`) 
      .then(response => {
        regions.value = response.data;
      })
  })
</script>


<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Общественный порядок</VCardTitle>
    </VCardItem>

    <VCardText>
      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">
              Регион
            </th>
            <th class="text-left">
              Общественный порядок
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="region in regions"
            :key="region.id"
          >
            <td>{{ region.title }}</td>
            <td>{{ region.params['public_order'] }}</td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>
