<script setup>
  import axios from 'axios'

  const props = defineProps({
    countries: {
      type: Array,
      required: true,
    },
  })

  const emit = defineEmits(['reload-dashboard']);
  
  async function addItem(country_id){
    let new_value = prompt("Новое значение");
    axios.patch(`${import.meta.env.VITE_PROXY}/countries/${country_id}/add_relation_item.json`, {value: new_value}) 
      .then(response => {
        emit('reload-dashboard');
      })
  }

  async function removeItem(item_id){
    let fl = confirm("Точно удалить?");
    if (fl){
      axios.delete(`${import.meta.env.VITE_PROXY}/relation_items/${item_id}.json`) 
        .then(response => {
          emit('reload-dashboard');
        })
    }
  }

  async function relationsChange(country_id, value){
    axios.patch(`${import.meta.env.VITE_PROXY}/countries/${country_id}/add_relation_item.json?value=${value}`) 
      .then(response => {
        emit('reload-dashboard');
      })
  }
</script>


<template>
  <VCard width="600">
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
                      <VListItemTitle>
                        {{item.comment}} ({{item.value}}) <span v-if="item.year">Год: {{item.year}}</span>
                        <IconBtn
                          icon="ri-delete-bin-line"
                          class="me-1"
                          @click="removeItem(item.id)"
                        />
                      </VListItemTitle>
                    </VListItem>
                    <VListItem key="_0">
                      <VListItemTitle>
                        <v-btn variant="text" @click="addItem(country.id)">
                          Добавить ручную правку
                        </v-btn>
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </v-menu>
              </v-btn>
              
            </td>
            <td>
              {{ country.relations }} 
              <IconBtn icon="ri-arrow-up-double-line" @click="relationsChange(country.id, 1)"></IconBtn>
              <IconBtn icon="ri-arrow-down-double-line" @click="relationsChange(country.id, -1)"></IconBtn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>
