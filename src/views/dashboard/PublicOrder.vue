<script setup>
  import axios from 'axios'

  const regions = ref([]);
  const open_poi = ref([]);
  const props = ref(false);
  
  onBeforeMount(async () => {
    axios.get(`${import.meta.env.VITE_PROXY}/regions.json?foreign=0`) 
      .then(response => {
        regions.value = response.data;
        open_poi.value = Array(regions.value.length).fill(false);
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
            v-for="(region, ri) in regions"
            :key="region.id"
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
                {{ region.title }}
                <v-menu activator="parent">
                  <VList>
                    <VListItem 
                      v-for="(poi, i) in region.public_order_items"
                      :key="i"
                    >
                      <VListItemTitle>{{poi.comment}} | {{poi.value}}</VListItemTitle>
                    </VListItem>
                  </VList>
                </v-menu>
              </v-btn>
              
            </td>
            <td>{{ region.show_overall_po }}</td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>
