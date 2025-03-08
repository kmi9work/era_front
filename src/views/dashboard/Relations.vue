<script setup>
  import axios from 'axios'

  const countries = ref([]);
  
  onBeforeMount(async () => {
    axios.get(`${import.meta.env.VITE_PROXY}/countries.json?foreign=1`) 
      .then(response => {
        countries.value = response.data;
      })
  })
</script>


<template>
  <VCard max-width="600">
    <VCardItem>
      <VCardTitle>Отношения</VCardTitle>
    </VCardItem>

    <VCardText>
      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">
              Страна
            </th>
            <th class="text-left">
              Отношения
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(country, ri) in countries"
            :key="country.id"
          >
            <td>
              <v-btn
                class="text-none"
                color="medium-emphasis"
                variant="text"
                rounded
                prepend-icon="ri-arrow-down-double-fill"
                min-width="300"
                style="justify-content: start;"
              >
                {{ country.name }}
                <v-menu activator="parent">
                  <VList>
                    <VListItem 
                      v-for="(item, i) in country.relation_items"
                      :key="i"
                    >
                      <VListItemTitle>{{item.comment}} | {{item.value}}</VListItemTitle>
                    </VListItem>
                  </VList>
                </v-menu>
              </v-btn>
              
            </td>
            <td>{{ country.relations }}</td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>
