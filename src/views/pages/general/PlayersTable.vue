<script setup>
import axios from 'axios'

const props = defineProps({
  players: {
    type: Array,
    required: true,
  },
  buildings: {
    type: Array,
    required: true,
  },
  buildingTypes: {
    type: Array,
    required: true,
  },
  armies: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['reload-data'])

// Отладочная информация
onMounted(() => {
  console.log('Players table - Building types:', props.buildingTypes)
  console.log('Players table - First building type:', props.buildingTypes[0])
})

// Получаем армии игрока
const getPlayerArmies = (playerId) => {
  return props.armies.filter(army => 
    army.owner_id === playerId && army.owner_type === 'Player'
  )
}

// Получаем отображение армий игрока (через запятую)
const getPlayerArmiesDisplay = (playerId) => {
  const armies = getPlayerArmies(playerId)
  return armies.map(army => {
    const location = army.settlement?.name || 'Неизвестно'
    return `${army.name} (${army.power || 0}, ${location})`
  }).join(', ')
}


// Получаем название типа постройки по ID из buildingTypes
const getBuildingTypeNameById = (buildingTypeId) => {
  if (!props.buildingTypes || props.buildingTypes.length === 0) {
    return `Тип ${buildingTypeId}`
  }
  const buildingType = props.buildingTypes.find(bt => bt.id === buildingTypeId)
  return buildingType?.name || `Тип ${buildingTypeId}`
}



// Получаем общий доход игрока (включая доход от должностей)
const getTotalPlayerIncome = (player) => {
  const jobIncome = player.income || 0
  return jobIncome
}

// Получаем должности игрока
const getPlayerJobs = (player) => {
  return player.jobs ? player.jobs.map(job => job.name).join(', ') : 'Нет должностей'
}
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Игроки</VCardTitle>
    </VCardItem>

    <VCardText>
      <VTable density="compact">
        <thead>
          <tr>
            <th class="text-left">Имя</th>
            <th class="text-left">Должность</th>
            <th class="text-left">Влияние</th>
            <th class="text-left">Армии</th>
            <th class="text-left">Владения</th>
            <th class="text-left">Постройки</th>
            <th class="text-left">Доход</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="player in players"
            :key="player.id"
          >
            <td>{{ player.name }}</td>
            <td>{{ getPlayerJobs(player) }}</td>
            <td>{{ player.influence || 0 }}</td>
            <td>
              <div>
                <div v-if="getPlayerArmies(player.id).length > 0">
                  {{ getPlayerArmiesDisplay(player.id) }}
                </div>
                <div v-else class="text-grey">
                  Нет армий
                </div>
              </div>
            </td>
            <td>
              <div>
                <div>{{ player.own_count }}</div>
              </div>
            </td>
            <td>
              <div class="d-flex flex-wrap gap-1">
                <template v-for="item in (player.my_buildings || [])" :key="item.index">
                  <VChip
                    v-if="item"
                    size="x-small"
                    color="primary"
                  >
                    <VIcon
                      v-if="item.icon"
                      :icon="item.icon"
                      size="14"
                      class="me-1"
                    />
                    <span v-else class="me-1">{{ getBuildingTypeNameById(item.building_type_id) }}</span>
                    {{ item.level }}
                  </VChip>
                </template>
              </div>
            </td>
            <td>
              <div>
                <div>{{ getTotalPlayerIncome(player) }}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCardText>
  </VCard>
</template>
