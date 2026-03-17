<script setup>
import { computed } from 'vue'

const props = defineProps({
  enrichedAudits: {
    type: Array,
    default: () => []
  },
  guildNames: {
    type: Array,
    default: () => []
  },
  timelineColumns: {
    type: Array,
    default: () => []
  },
  enterpriseMatrix: {
    type: Map,
    default: null
  }
})

// URL для загрузки изображений ресурсов
const getResourceImageUrl = (identificator) => {
  if (!identificator) {
    identificator = 'unknown'
  }
  return `/images/resources/${identificator}.png`
}

function formatCostForTooltip(cost) {
  if (!cost || typeof cost !== 'object') {
    return []
  }

  const items = []
  
  // Золото
  if (cost.gold) {
    items.push({ type: 'gold', value: cost.gold, identificator: 'gold' })
  }
  
  // Ресурсы
  Object.entries(cost).forEach(([key, value]) => {
    if (key !== 'gold' && value > 0) {
      items.push({ type: 'resource', value, identificator: key })
    }
  })

  return items
}

const totalEnterprises = computed(() => props.enrichedAudits.length)

const totalCosts = computed(() => {
  const total = { gold: 0, resources: {} }

  props.enrichedAudits.forEach(audit => {
    total.gold += audit.totalCost.gold
    Object.entries(audit.totalCost.resources).forEach(([key, value]) => {
      total.resources[key] = (total.resources[key] || 0) + value
    })
  })

  return total
})
</script>

<template>
  <div>
    <VCardItem>
      <VCardTitle>Постройка предприятий по времени</VCardTitle>
      <VCardSubtitle>Матрица «гильдия × момент» с указанием типа предприятия, уровня и затрат</VCardSubtitle>
    </VCardItem>

    <template v-if="enrichedAudits.length">
      <VCardText class="pb-0">
        <VRow>
          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="primary" variant="tonal">
              <VIcon icon="ri-building-3-line" size="24" class="me-3 text-primary" />
              <div>
                <div class="text-caption text-medium-emphasis">Количество событий</div>
                <div class="text-h6 mb-0">{{ totalEnterprises }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="warning" variant="tonal">
              <VIcon icon="ri-copper-coin-fill" size="24" class="me-3 text-warning" />
              <div>
                <div class="text-caption text-medium-emphasis">Суммарное золото</div>
                <div class="text-h6 mb-0">{{ totalCosts.gold.toLocaleString('ru-RU') }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="4">
            <VSheet class="summary-chip" color="success" variant="tonal">
              <VIcon icon="ri-box-3-line" size="24" class="me-3 text-success" />
              <div>
                <div class="text-caption text-medium-emphasis">Типов ресурсов</div>
                <div class="text-h6 mb-0">{{ Object.keys(totalCosts.resources).length }}</div>
              </div>
            </VSheet>
          </VCol>
        </VRow>
      </VCardText>

      <VCardText class="pt-4">
        <div class="table-wrapper">
          <VTable class="enterprise-table">
            <thead>
              <tr>
                <th class="guild-column">Гильдия</th>
                <th
                  v-for="column in timelineColumns"
                  :key="column.timestamp"
                >
                  <div class="column-header">
                    <span>{{ column.timeLabel }}</span>
                    <small class="text-medium-emphasis">
                      Год {{ column.gameYear }}
                    </small>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="guildName in guildNames"
                :key="guildName"
              >
                <td class="guild-column">
                  <div class="guild-name">{{ guildName }}</div>
                </td>
                <td
                  v-for="column in timelineColumns"
                  :key="`${guildName}-${column.timestamp}`"
                  class="data-cell"
                >
                  <template v-if="enterpriseMatrix.get(guildName)?.get(column.timestamp)">
                    <div class="cell-items">
                      <VMenu
                        v-for="item in enterpriseMatrix.get(guildName).get(column.timestamp)"
                        :key="item.id"
                        location="top"
                        :close-on-content-click="false"
                        offset="8"
                        open-on-hover
                      >
                        <template #activator="{ props: menuProps }">
                          <VChip
                            v-bind="menuProps"
                            size="small"
                            :color="item.action === 'create' ? 'success' : item.action === 'update' ? 'primary' : 'error'"
                            variant="flat"
                            class="enterprise-chip"
                          >
                            <div class="enterprise-chip-content">
                              <div class="enterprise-chip-line">{{ item.plantTypeName }}</div>
                              <div class="enterprise-chip-line text-caption">Ур.{{ item.newLevel || item.plantLevel }}</div>
                            </div>
                          </VChip>
                        </template>

                        <VCard class="enterprise-tooltip">
                          <VCardText class="pa-3">
                            <div class="tooltip-content">
                              <div class="tooltip-header mb-2">
                                <div class="text-h6">{{ item.plantTypeName }}</div>
                                <div class="text-caption text-medium-emphasis">
                                  Уровень: {{ item.newLevel || item.plantLevel }}
                                  <span v-if="item.action === 'update' && item.oldLevel">
                                    ({{ item.oldLevel }} → {{ item.newLevel }})
                                  </span>
                                </div>
                                <div class="text-caption text-medium-emphasis mt-1">
                                  <VChip
                                    size="x-small"
                                    :color="item.action === 'create' ? 'success' : item.action === 'update' ? 'primary' : 'error'"
                                    variant="flat"
                                  >
                                    {{ item.action === 'create' ? 'Создание' : item.action === 'update' ? 'Улучшение' : 'Удаление' }}
                                  </VChip>
                                </div>
                              </div>
                              
                              <VDivider class="my-2" />
                              
                              <div class="tooltip-cost">
                                <div class="text-caption text-medium-emphasis mb-1">Стоимость:</div>
                                <div class="d-flex flex-wrap gap-2">
                                  <div
                                    v-for="costItem in formatCostForTooltip(item.displayCost)"
                                    :key="costItem.identificator"
                                    class="cost-item"
                                  >
                                    <VImg
                                      :src="getResourceImageUrl(costItem.identificator)"
                                      width="20"
                                      height="20"
                                      class="cost-icon"
                                    />
                                    <span class="cost-value">{{ costItem.value }}</span>
                                  </div>
                                  <span v-if="formatCostForTooltip(item.displayCost).length === 0" class="text-caption text-disabled">—</span>
                                </div>
                              </div>
                            </div>
                          </VCardText>
                        </VCard>
                      </VMenu>
                    </div>
                  </template>
                  <span
                    v-else
                    class="text-disabled text-caption"
                  >
                    —
                  </span>
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCardText>
    </template>

    <VCardText
      v-else
      class="text-center py-8"
    >
      <VIcon icon="ri-building-3-line" size="48" class="text-disabled mb-2" />
      <div class="text-body-1 text-disabled">Нет данных о предприятиях гильдий</div>
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

.table-wrapper {
  overflow-x: auto;
}

.enterprise-table {
  min-width: 720px;
}

.enterprise-table th,
.enterprise-table td {
  white-space: nowrap;
  text-align: center;
  padding: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.enterprise-table thead th {
  position: sticky;
  top: 0;
  background: rgb(var(--v-theme-surface));
  z-index: 1;
}

.guild-column {
  text-align: left;
  min-width: 180px;
  background: rgb(var(--v-theme-surface-variant), 0.4);
  font-weight: 600;
}

.guild-name {
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}

.column-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-cell {
  min-width: 160px;
  vertical-align: top;
}

.cell-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.enterprise-chip {
  max-width: 160px;
  min-height: 48px;
  height: auto;
  white-space: normal;
  word-break: break-word;
  padding: 6px 12px;
}

.enterprise-chip-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.enterprise-chip-line {
  line-height: 1.2;
  text-align: center;
  width: 100%;
}

.enterprise-tooltip {
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tooltip-content {
  min-width: 200px;
}

.tooltip-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-cost {
  margin-top: 8px;
}

.cost-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 4px;
  border: 1px solid rgba(var(--v-border-color), 0.2);
}

.cost-icon {
  border-radius: 2px;
  flex-shrink: 0;
}

.cost-value {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
}
</style>
