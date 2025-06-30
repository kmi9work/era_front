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
    const fl = confirm('Добавить бонус Окольничему?')
    const params = fl ? '?okolnichy_bonus=1' : ''
    axios.patch(`${import.meta.env.VITE_PROXY}/technology_items/${item_id}.json${params}`, {value: value}) 
      .then(response => {
        emit('reload-dashboard');
      })
  }
</script>


<template>
  <VCard max-width="600">
    <VCardItem>
      <VCardTitle>РРРРРРРРРРРРРРРРР</VCardTitle>
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
                        <v-btn variant="text" @click="editItem(item.id, 0)" v-if="item.value == 1">
                          Закрыть
                        </v-btn>
                        <v-btn variant="text" @click="editItem(item.id, 1)" v-else>
                          Открыть
                        </v-btn>
                      </VListItemTitle>
                      <VListItemTitle v-else>
                        {{item.comment}}
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </v-menu>
              </v-btn>
              
            </td>
            <td>{{ tech.is_open == 1 ? 'Да' : 'Нет' }}</td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>
