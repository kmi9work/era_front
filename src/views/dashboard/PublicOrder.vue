<script setup>
  import axios from 'axios'

  const props = defineProps({
    regions: {
      type: Array,
      required: true,
    },
  })

  const emit = defineEmits(['reload-dashboard']);

  async function editItem(item_id, value){
    let new_value = prompt("Новое значение", value);
    axios.patch(`${import.meta.env.VITE_PROXY}/public_order_items/${item_id}.json`, {value: new_value}) 
      .then(response => {
        emit('reload-dashboard');
      })
  }
</script>


<template>
  <VCard max-width="600">
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
              ОП
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
                {{ region.name }}
                <v-menu activator="parent">
                  <VList>
                    <VListItem 
                      v-for="(poi, i) in region.public_order_items"
                      :key="i"
                    >
                      <VListItemTitle v-if="poi.id != 0">
                        <a href="#" @click="editItem(poi.id, poi.value)">
                          {{poi.comment}} | {{poi.value}} <span v-if="poi.year">Год: {{poi.year}}</span>
                        </a>
                      </VListItemTitle>
                      <VListItemTitle v-else>
                        {{poi.comment}} | {{poi.value}}
                      </VListItemTitle>
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
