<script setup>
import axios from 'axios'

const props = defineProps({
  regions: {
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
  console.log('Building types:', props.buildingTypes)
  console.log('First building type:', props.buildingTypes[0])
})

// Получаем все постройки в регионе, отсортированные по типу
const getRegionBuildings = (regionId) => {
  return props.buildings
    .filter(building => building.region_id === regionId)
    .sort((a, b) => {
      const typeA = a.building_level?.building_type?.name || ''
      const typeB = b.building_level?.building_type?.name || ''
      return typeA.localeCompare(typeB)
    })
}


// Получаем иконку типа постройки из реальных данных построек
const getBuildingTypeIcon = (regionId, buildingTypeId) => {
  const regionBuildings = props.buildings.filter(building => 
    building.region_id === regionId && 
    building.building_level?.building_type?.id === buildingTypeId
  )
  return regionBuildings[0]?.building_level?.building_type?.icon || null
}

// Получаем название типа постройки из реальных данных построек
const getBuildingTypeName = (regionId, buildingTypeId) => {
  const regionBuildings = props.buildings.filter(building => 
    building.region_id === regionId && 
    building.building_level?.building_type?.id === buildingTypeId
  )
  return regionBuildings[0]?.building_level?.building_type?.name || 'Unknown'
}

// Получаем армии в регионе
const getRegionArmies = (regionId) => {
  return props.armies.filter(army => 
    army.settlement?.region_id === regionId
  )
}

// Получаем отображение армий в регионе (через запятую)
const getRegionArmiesDisplay = (regionId) => {
  const armies = getRegionArmies(regionId)
  return armies.map(army => `${army.name} (${army.power || 0})`).join(', ')
}

// Получаем количество армий в регионе
const getArmyCount = (regionId) => {
  return getRegionArmies(regionId).length
}

// Получаем количество городов в бунте (не принадлежащих никому)
const getRebelCities = (regionId) => {
  // Города в бунте - это поселения без владельца (player_id = null)
  // Нужно получить данные поселений, а не построек
  return 0 // Пока возвращаем 0, так как у нас нет данных о поселениях без владельца
}

// Получаем названия городов в бунте
const getRebelCityNames = (regionId) => {
  // Пока возвращаем пустую строку, так как у нас нет данных о поселениях без владельца
  return ''
}
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Регионы</VCardTitle>
    </VCardItem>

    <VCardText>
      <VTable density="compact">
        <thead>
          <tr>
            <th class="text-left">Название</th>
            <th class="text-left">Постройки</th>
            <th class="text-left">Армии</th>
            <th class="text-left">Бунт</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="region in regions"
            :key="region.id"
          >
            <td>{{ region.name }}</td>
            <td>
              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="(building, index) in getRegionBuildings(region.id)"
                  :key="`${building.id}-${index}`"
                  size="small"
                  color="primary"
                >
                  <VIcon
                    v-if="building.building_level.building_type.icon"
                    :icon="building.building_level.building_type.icon"
                    size="16"
                    class="me-1"
                  />
                  <span v-else class="me-1">{{ building.building_level.building_type.name }}</span>
                  <span class="text-caption">{{ building.building_level.level }}</span>
                </VChip>
              </div>
            </td>
            <td>
              <div>
                <div v-if="getRegionArmies(region.id).length > 0">
                  {{ getRegionArmiesDisplay(region.id) }}
                </div>
                <div v-else class="text-grey">
                  Нет армий
                </div>
              </div>
            </td>
            <td>
              <div>
                <div>{{ getRebelCities(region.id) }}</div>
                <div v-if="getRebelCityNames(region.id)" class="text-caption">
                  {{ getRebelCityNames(region.id) }}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCardText>
  </VCard>
</template>
