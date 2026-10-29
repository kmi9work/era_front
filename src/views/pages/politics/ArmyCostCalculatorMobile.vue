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
const isLoading = ref(true)
// Состав армии: три обычных отряда и пушка сверх них (как в бэкенде).
const CANNON_TYPE_ID = 4
const MAX_REGULAR_TROOPS = 3
const selected_troop_types = ref([null, null, null, null])

// Загрузка данных
async function loadData() {
  try {
    await axios.get(`${import.meta.env.VITE_PROXY}/troop_types.json`)
      .then(response => {
        troop_types.value = response.data
      })
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error)
  } finally {
    isLoading.value = false
  }
}

const isCannonType = (troopType) =>
  troopType?.id === CANNON_TYPE_ID || /пушк/i.test(troopType?.name || '')

// Стоимость — цена постройки отряда с нуля (buy_cost типа). Улучшений больше нет,
// поэтому цепочка «пехота → тяжёлая → кавалерия → пушка» не суммируется.
const totalCost = computed(() => {
  const cost = {}

  selected_troop_types.value.forEach((troopTypeId) => {
    if (!troopTypeId) return

    const troop = troop_types.value.find(t => t.id === troopTypeId)
    if (!troop) return

    troop.params.buy_cost?.forEach(res => {
      if (!res.count) return
      cost[res.identificator] = (cost[res.identificator] || 0) + res.count
    })
  })

  return Object.fromEntries(
    Object.entries(cost).filter(([_, count]) => count > 0)
  )
})

// Пушка — только одна и только в четвёртом слоте; обычные отряды — не больше трёх.
const slotItems = (slotIndex) =>
  troop_types.value.filter(troop =>
    slotIndex >= MAX_REGULAR_TROOPS ? isCannonType(troop) : !isCannonType(troop)
  )

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
            <div v-for="index in MAX_REGULAR_TROOPS + 1" :key="index" class="mb-3">
              <v-select
                v-model="selected_troop_types[index - 1]"
                :items="slotItems(index - 1)"
                item-title="name"
                item-value="id"
                :label="index === MAX_REGULAR_TROOPS + 1 ? 'Пушка (одна на армию)' : `Отряд ${index}`"
                clearable
                variant="outlined"
              />
            </div>
            <div class="text-caption text-medium-emphasis">
              В армии до трёх отрядов и одна пушка сверх них.
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

