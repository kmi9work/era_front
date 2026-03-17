<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { hexToRgb } from '@layouts/utils'

const props = defineProps({
  robbedCaravansStats: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const vuetifyTheme = useTheme()
const showCaravanDetails = ref(null)

// Toggle details for a specific year/guild group
const toggleDetails = (key) => {
  showCaravanDetails.value = showCaravanDetails.value === key ? null : key
}

const hasData = computed(() => {
  return props.robbedCaravansStats && 
         props.robbedCaravansStats.total_robbed_caravans > 0
})

const averageLostPerCaravan = computed(() => {
  if (!props.robbedCaravansStats || props.robbedCaravansStats.total_robbed_caravans === 0) return 0
  return Math.round(props.robbedCaravansStats.total_lost_gold / props.robbedCaravansStats.total_robbed_caravans)
})

// Format date
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div>
    <VCardItem>
      <VCardTitle>
        <VIcon icon="ri-skull-line" class="me-2" />
        Ограбленные караваны
      </VCardTitle>
      <VCardSubtitle>Потери от ограблений караванов</VCardSubtitle>
    </VCardItem>

    <VCardText v-if="loading" class="text-center py-8">
      <VProgressCircular indeterminate color="primary" />
      <div class="mt-2">Загрузка данных...</div>
    </VCardText>

    <template v-else-if="hasData">
      <!-- Сводные карточки -->
      <VCardText class="pb-0">
        <VRow>
          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="error" variant="tonal">
              <VIcon icon="ri-alarm-warning-line" size="24" class="me-3 text-error" />
              <div>
                <div class="text-caption text-medium-emphasis">Всего ограблено</div>
                <div class="text-h6 mb-0">{{ robbedCaravansStats.total_robbed_caravans }} 🚢</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="warning" variant="tonal">
              <VIcon icon="ri-coins-line" size="24" class="me-3 text-warning" />
              <div>
                <div class="text-caption text-medium-emphasis">Общие потери</div>
                <div class="text-h6 mb-0">{{ robbedCaravansStats.total_lost_gold.toLocaleString('ru-RU') }} 💰</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="info" variant="tonal">
              <VIcon icon="ri-calculator-line" size="24" class="me-3 text-info" />
              <div>
                <div class="text-caption text-medium-emphasis">Средние потери на караван</div>
                <div class="text-h6 mb-0">
                  {{ averageLostPerCaravan.toLocaleString('ru-RU') }} 💰
                </div>
              </div>
            </VSheet>
          </VCol>
        </VRow>
      </VCardText>

      <!-- Таблица по годам и гильдиям -->
      <VCardText class="pt-4">
        <VCardTitle class="mb-4">Статистика по годам и гильдиям</VCardTitle>
        <div v-if="robbedCaravansStats.by_year_and_guild && robbedCaravansStats.by_year_and_guild.length > 0">
          <VTable>
            <thead>
              <tr>
                <th class="text-start">Год</th>
                <th class="text-start">Гильдия</th>
                <th class="text-start">Страна</th>
                <th class="text-center">Караванов ограблено</th>
                <th class="text-center">Потеряно золота</th>
                <th class="text-center">Детали</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="stat in robbedCaravansStats.by_year_and_guild" :key="`${stat.year}_${stat.guild_name}`">
                <tr>
                  <td class="text-start font-weight-medium">{{ stat.year }}</td>
                  <td class="text-start">{{ stat.guild_name }}</td>
                  <td class="text-start">{{ stat.country_name }}</td>
                  <td class="text-center">{{ stat.caravans_count }}</td>
                  <td class="text-center text-error">{{ stat.total_lost_gold.toLocaleString('ru-RU') }} 💰</td>
                  <td class="text-center">
                    <VBtn
                      size="small"
                      variant="text"
                      @click="toggleDetails(`${stat.year}_${stat.guild_name}`)"
                    >
                      {{ showCaravanDetails === `${stat.year}_${stat.guild_name}` ? 'Скрыть' : 'Показать' }}
                      <VIcon :icon="showCaravanDetails === `${stat.year}_${stat.guild_name}` ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'" size="small" />
                    </VBtn>
                  </td>
                </tr>
                <!-- Детали караванов -->
                <tr v-if="showCaravanDetails === `${stat.year}_${stat.guild_name}`" class="bg-grey-lighten-4">
                  <td :colspan="6" class="pa-0">
                    <VCard flat class="ma-2">
                      <VCardText>
                        <VList density="compact">
                          <VListItem
                            v-for="(caravan, index) in stat.caravans"
                            :key="caravan.id"
                            :title="`Караван #${caravan.id}`"
                            :subtitle="`Дата: ${formatDate(caravan.created_at)} | Экспорт: ${caravan.gold_export} | Импорт: ${caravan.gold_import} | Всего: ${caravan.total_lost}`"
                          >
                            <template v-slot:prepend>
                              <VIcon icon="ri-ship-line" size="small" color="error" />
                            </template>
                          </VListItem>
                        </VList>
                      </VCardText>
                    </VCard>
                  </td>
                </tr>
              </template>
            </tbody>
          </VTable>
        </div>
      </VCardText>

      <!-- Полный список всех ограбленных караванов -->
      <VCardText class="pt-4">
        <VCardTitle class="mb-4">Все ограбленные караваны</VCardTitle>
        <div v-if="robbedCaravansStats.caravans && robbedCaravansStats.caravans.length > 0">
          <VTable>
            <thead>
              <tr>
                <th class="text-start">ID</th>
                <th class="text-start">Год</th>
                <th class="text-start">Гильдия</th>
                <th class="text-start">Страна</th>
                <th class="text-center">Экспорт (золото)</th>
                <th class="text-center">Импорт (золото)</th>
                <th class="text-center">Всего потеряно</th>
                <th class="text-start">Дата создания</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="caravan in robbedCaravansStats.caravans" :key="caravan.id">
                <td class="text-start font-weight-medium">#{{ caravan.id }}</td>
                <td class="text-start">{{ caravan.year }}</td>
                <td class="text-start">{{ caravan.guild_name }}</td>
                <td class="text-start">{{ caravan.country_name }}</td>
                <td class="text-center text-error">{{ caravan.gold_export.toLocaleString('ru-RU') }} 💰</td>
                <td class="text-center text-success">{{ caravan.gold_import.toLocaleString('ru-RU') }} 💰</td>
                <td class="text-center text-error font-weight-bold">{{ caravan.total_lost.toLocaleString('ru-RU') }} 💰</td>
                <td class="text-start">{{ formatDate(caravan.created_at) }}</td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCardText>
    </template>

    <VCardText v-else-if="!loading" class="text-center py-8">
      <VIcon icon="ri-shield-check-line" size="48" class="text-success mb-2" />
      <div class="text-body-1 text-success">Нет ограбленных караванов</div>
      <div class="text-caption text-disabled mt-2">Все караваны успешно дошли до места назначения</div>
    </VCardText>
  </div>
</template>

<style scoped>
.summary-chip {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
}
</style>
