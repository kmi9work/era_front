<script setup>
  import axios from 'axios'

  const props = defineProps({
    regions: {
      type: Array,
      required: true,
    },
  })

  const emit = defineEmits(['reload-dashboard']);

  async function addItem(player_id){
    let new_value = prompt("Новое значение");
    let comment = prompt("Комментарий");
    axios.patch(`${import.meta.env.VITE_PROXY}/regions/${player_id}/add_po_item.json`, {value: new_value, comment: comment}) 
      .then(response => {
        emit('reload-dashboard');
      })
  }

  async function removeItem(item_id){
    let fl = confirm("Точно удалить?");
    if (fl){
      axios.delete(`${import.meta.env.VITE_PROXY}/public_order_items/${item_id}.json`) 
        .then(response => {
          emit('reload-dashboard');
        })
    }
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
                      <VListItemTitle>
                        {{poi.comment}} | {{poi.value}} <span v-if="poi.year">Год: {{poi.year}}</span>
                        <IconBtn
                          icon="ri-delete-bin-line"
                          class="me-1"
                          @click="removeItem(poi.id)"
                        />
                      </VListItemTitle>
                    </VListItem>
                    <VListItem key="_0">
                      <VListItemTitle>
                        <v-btn variant="text" @click="addItem(region.id)">
                          Добавить ручную правку
                        </v-btn>
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
