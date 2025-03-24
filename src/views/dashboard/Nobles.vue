<script setup>
  import axios from 'axios'

  const props = defineProps({
    nobles: {
      type: Array,
      required: true,
    },
  })
  
  const emit = defineEmits(['reload-dashboard']);

  async function addItem(player_id){
    let new_value = prompt("Новое значение");
    axios.patch(`${import.meta.env.VITE_PROXY}/players/${player_id}/add_influence.json`, {value: new_value}) 
      .then(response => {
        emit('reload-dashboard');
      })
  }

  async function removeItem(item_id){
    let fl = confirm("Точно удалить?");
    if (fl){
      axios.delete(`${import.meta.env.VITE_PROXY}/influence_items/${item_id}.json`) 
        .then(response => {
          emit('reload-dashboard');
        })
    }
  }

  async function takeIncome(params, player_id){
    params['income_taken'] = !params['income_taken']
    axios.patch(`${import.meta.env.VITE_PROXY}/players/${player_id}.json`, {params: params}) 
      .then(response => {
        emit('reload-dashboard');
      })
  }

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
              Должности
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
            <td>{{ player.jobs.map((j) => j.name).join(", ") }}</td>
            <td>
              <VBtn 
                :color="player.params['income_taken'] ? 'success' : 'error'"
                @click="takeIncome(player.params, player.id)"
              >
                {{ player.income }}
              </VBtn>
            </td>
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
                      <VListItemTitle>
                        {{item.comment}} | {{item.value}} <span v-if="item.year">Год: {{item.year}}</span>
                        <IconBtn
                          icon="ri-delete-bin-line"
                          class="me-1"
                          @click="removeItem(item.id)"
                        />
                      </VListItemTitle>
                    </VListItem>
                    <VListItem key="_0">
                      <VListItemTitle>
                        <v-btn variant="text" @click="addItem(player.id)">
                          Добавить ручную правку
                        </v-btn>
                      </VListItemTitle>
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
