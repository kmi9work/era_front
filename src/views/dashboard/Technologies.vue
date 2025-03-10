<script setup>
  import axios from 'axios'

  const props = defineProps({
    technologies: {
      type: Array,
      required: true,
    },
  })

  const emit = defineEmits(['reload-dashboard']);
  
  async function editItem(item_id, value){
    let new_value = prompt("Новое значение", value);
    axios.patch(`${import.meta.env.VITE_PROXY}/technology_items/${item_id}.json`, {value: new_value}) 
      .then(response => {
        emit('reload-dashboard');
      })
  }
</script>


<template>
  <VCard max-width="600">
    <VCardItem>
      <VCardTitle>Технологии</VCardTitle>
    </VCardItem>

    <VCardText>
      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">
              Название
            </th>
            <th class="text-left">
              Открыта?
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(tech, ri) in technologies"
            :key="tech.id"
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
                {{ tech.name }}
                <v-menu activator="parent">
                  <VList>
                    <VListItem 
                      v-for="(item, i) in tech.technology_items"
                      :key="i"
                    >
                      <VListItemTitle v-if="item.id != 0">
                        <a href="#" @click="editItem(item.id, item.value)">{{item.comment}} | {{item.value}}</a>
                      </VListItemTitle>
                      <VListItemTitle v-else>
                        {{item.comment}}
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </v-menu>
              </v-btn>
              
            </td>
            <td>{{ tech.is_open }}</td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>
