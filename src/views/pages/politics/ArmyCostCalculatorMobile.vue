<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

const emit = defineEmits(['back'])

const getResourceImageUrl = (identificator) => {
  return `${import.meta.env.VITE_PROXY}/images/resources/${identificator}.png`
}

const resources = {
  'stone_brick': { 'img': getResourceImageUrl('stone_brick'), 'name': 'Каменный кирпич' },
  'weapon': { 'img': getResourceImageUrl('weapon'), 'name': 'Оружие' },
  'tools': { 'img': getResourceImageUrl('tools'), 'name': 'Инструменты' },
  'timber': { 'img': getResourceImageUrl('timber'), 'name': 'Брёвна' },
  'stone': { 'img': getResourceImageUrl('stone'), 'name': 'Камень' },
  'metal_ore': { 'img': getResourceImageUrl('metal_ore'), 'name': 'Железная руда' },
  'metal': { 'img': getResourceImageUrl('metal'), 'name': 'Металл' },
  'meat': { 'img': getResourceImageUrl('meat'), 'name': 'Мясо' },
  'luxury': { 'img': getResourceImageUrl('luxury'), 'name': 'Роскошь' },
  'horses': { 'img': getResourceImageUrl('horses'), 'name': 'Лошади' },
  'grain': { 'img': getResourceImageUrl('grain'), 'name': 'Зерно' },
  'gems': { 'img': getResourceImageUrl('gems'), 'name': 'Драгоценный металл' },
  'food': { 'img': getResourceImageUrl('food'), 'name': 'Провизия' },
  'flour': { 'img': getResourceImageUrl('flour'), 'name': 'Мука' },
  'boards': { 'img': getResourceImageUrl('boards'), 'name': 'Доски' },
  'armor': { 'img': getResourceImageUrl('armor'), 'name': 'Доспехи' },
  'money': { 'img': getResourceImageUrl('money'), 'name': 'Золото' },
}

const troop_types = ref([])
const upgrade_paths = ref({})
const isLoading = ref(true)
const selected_troop_types = ref([null, null, null]) // Максимум 3 отряда

// Загрузка данных
async function loadData() {
  try {
    await Promise.all([
      axios.get(`${import.meta.env.VITE_PROXY}/troop_types.json`)
        .then(response => {
          troop_types.value = response.data
        }),
      axios.get(`${import.meta.env.VITE_PROXY}/troop_types/upgrade_paths.json`)
        .then(response => {
          upgrade_paths.value = response.data
        })
        .catch(() => {
          upgrade_paths.value = { '1': 2, '2': 3, '3': 4 }
        })
    ])
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error)
  } finally {
    isLoading.value = false
  }
}

// Получаем имя следующего уровня улучшения
function getNextLevelName(currentId) {
  const nextId = upgrade_paths.value[currentId]
  if (!nextId) return null
  return troop_types.value.find(t => t.id === nextId)?.name
}

// Проверяем, можно ли улучшить отряд с fromType до toType
function canUpgradeTo(fromType, toType) {
  const fromTroop = troop_types.value.find(t => t.name === fromType)
  if (!fromTroop) return false
  
  let current = fromTroop
  while (current) {
    if (current.name === toType) return true
    const nextId = upgrade_paths.value[current.id]
    if (!nextId) break
    current = troop_types.value.find(t => t.id === nextId)
  }
  return false
}

// Вычисляем общую стоимость
const totalCost = computed(() => {
  const cost = {}
  
  selected_troop_types.value.forEach((troopType) => {
    if (!troopType) return
    
    const targetTroop = troop_types.value.find(t => t.name === troopType)
    if (!targetTroop) return
    
    // Создание нового отряда - проходим по цепочке от базового типа
    let currentId = 1
    let found = false
    
    while (currentId && !found) {
      const troop = troop_types.value.find(t => t.id === currentId)
      if (!troop) break
      
      troop.params.buy_cost?.forEach(res => {
        cost[res.identificator] = (cost[res.identificator] || 0) + res.count
      })
      
      if (troop.id === targetTroop.id) found = true
      currentId = upgrade_paths.value[currentId]
    }
  })

  return Object.fromEntries(
    Object.entries(cost).filter(([_, count]) => count > 0)
  )
})

// Доступные типы отрядов
const availableTroopTypes = computed(() => {
  return troop_types.value
})

onMounted(() => {
  loadData()
})

const handleBack = () => {
  emit('back')
}

defineExpose({
  handleBack
})
</script>

<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-btn icon @click="handleBack">
        <VIcon>mdi-arrow-left</VIcon>
      </v-btn>
      <v-toolbar-title>Калькулятор стоимости армии</v-toolbar-title>
    </v-app-bar>

    <v-main style="padding-bottom: 80px;">
      <div v-if="isLoading" class="text-center" style="padding: 32px;">
        <VProgressCircular indeterminate color="primary" size="64" />
      </div>

      <div v-else class="pa-3">
        <!-- Выбор отрядов -->
        <v-card class="mb-3">
          <v-card-title>Выберите отряды</v-card-title>
          <v-card-text>
            <div v-for="(slot, index) in 3" :key="index" class="mb-3">
              <v-select
                v-model="selected_troop_types[index]"
                :items="availableTroopTypes"
                item-title="name"
                item-value="name"
                :label="`Отряд ${index + 1}`"
                clearable
                variant="outlined"
              />
            </div>
          </v-card-text>
        </v-card>

        <!-- Общая стоимость -->
        <v-card v-if="Object.keys(totalCost).length > 0">
          <v-card-title>Общая стоимость</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="([res, count], index) in Object.entries(totalCost)"
                :key="index"
              >
                <template v-slot:prepend>
                  <v-avatar size="40" class="mr-3">
                    <v-img
                      :src="resources[res]?.img"
                      :title="resources[res]?.name"
                    />
                  </v-avatar>
                </template>
                
                <v-list-item-title>
                  {{ count }} {{ resources[res]?.name }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card v-else class="text-center pa-8">
          <VIcon size="64" color="grey">ri-calculator-line</VIcon>
          <div class="mt-4 text-grey">Выберите отряды для расчета стоимости</div>
        </v-card>
      </div>
      
      <!-- Фиксированная кнопка Назад -->
      <div class="back-button-fixed">
        <v-btn
          block
          color="primary"
          size="large"
          prepend-icon="mdi-arrow-left"
          @click="handleBack"
        >
          Назад
        </v-btn>
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.back-button-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
</style>

