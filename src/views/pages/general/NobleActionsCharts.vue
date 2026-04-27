<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const loading = ref(false)
const errorMessage = ref('')
const players = ref([])
const politicalActions = ref([])
const selectedNobleId = ref('all')

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

const noblePlayers = computed(() => players.value.filter(player => player.player_type?.id === 2))

const nobleIdSet = computed(() => new Set(noblePlayers.value.map(player => player.id)))

const noblesOptions = computed(() => {
  const allOption = {
    label: 'Все игроки знати',
    value: 'all',
    subtitle: `Всего: ${noblePlayers.value.length}`,
  }

  const playerOptions = noblePlayers.value.map(player => ({
    label: player.jobs?.[0]?.name || 'Без должности',
    value: player.id,
    subtitle: player.name,
  }))

  return [allOption, ...playerOptions]
})

const filteredActions = computed(() => {
  if (!politicalActions.value.length) {
    return []
  }

  const targetId = selectedNobleId.value === 'all' || selectedNobleId.value === null
    ? 'all'
    : Number(selectedNobleId.value)

  return politicalActions.value.filter(action => {
    const actionPlayerId = action.player_id || action.player?.id

    if (!actionPlayerId) {
      return false
    }

    if (targetId === 'all') {
      return nobleIdSet.value.has(actionPlayerId)
    }

    return Number(actionPlayerId) === targetId
  })
})

function parseActionDate(action, offsetsByYear) {
  if (action.created_at) {
    const realDate = new Date(action.created_at)

    if (!Number.isNaN(realDate.getTime())) {
      return {
        date: realDate,
        year: realDate.getUTCFullYear(),
        hasPreciseDate: true,
      }
    }
  }

  const fallbackYear = action.year || new Date().getUTCFullYear()
  const offset = offsetsByYear.get(fallbackYear) || 0
  const pseudoDate = new Date(Date.UTC(fallbackYear, 0, 1, offset * 3))

  offsetsByYear.set(fallbackYear, offset + 1)

  return {
    date: pseudoDate,
    year: fallbackYear,
    hasPreciseDate: false,
  }
}

function extractGoldCost(action) {
  const costFromParams = action.params?.gold_cost ?? action.params?.gold ?? action.params?.cost

  if (typeof costFromParams === 'number' && !Number.isNaN(costFromParams)) {
    return costFromParams
  }

  if (typeof costFromParams === 'string') {
    const numeric = Number(costFromParams.replace(/\s+/g, ''))

    if (!Number.isNaN(numeric)) {
      return numeric
    }
  }

  const costText = action.cost || action.political_action_type?.cost || action.action_name?.cost

  if (typeof costText === 'string') {
    const digits = costText.match(/\d+/g)

    if (digits?.length) {
      return Number(digits.join(''))
    }
  }

  return 0
}

const enrichedActions = computed(() => {
  const offsetsByYear = new Map()

  return filteredActions.value
    .map((action, index) => {
      const { date, year, hasPreciseDate } = parseActionDate(action, offsetsByYear)
      const actionName = action.action_name || action.political_action_type?.name || 'Политическое действие'
      const playerId = action.player_id || action.player?.id
      const playerName = action.player?.name || action.player_name || 'Неизвестный игрок'
      const jobName = action.job_name || action.job?.name || action.player?.jobs?.[0]?.name || 'Без должности'
      const goldCost = extractGoldCost(action)
      const gameYear = action.year || year
      const timeLabel = hasPreciseDate ? timeFormatter.format(date) : '—'

      return {
        id: action.id || index,
        date: date.getTime(),
        timeLabel,
        hasPreciseDate,
        year,
        gameYear,
        actionName,
        playerId,
        playerName,
        jobName,
        goldCost,
      }
    })
    .sort((a, b) => a.date - b.date)
})

const actionNames = computed(() => {
  const names = new Set(enrichedActions.value.map(action => action.actionName))

  return Array.from(names).sort((a, b) => a.localeCompare(b, 'ru'))
})

const timelineColumns = computed(() => {
  const columns = new Map()

  enrichedActions.value.forEach(action => {
    if (!columns.has(action.date)) {
      columns.set(action.date, {
        timestamp: action.date,
        timeLabel: action.timeLabel,
        gameYear: action.gameYear,
      })
    }
  })

  return Array.from(columns.values()).sort((a, b) => a.timestamp - b.timestamp)
})

const actionMatrix = computed(() => {
  const matrix = new Map()

  enrichedActions.value.forEach(action => {
    if (!matrix.has(action.actionName)) {
      matrix.set(action.actionName, new Map())
    }

    const row = matrix.get(action.actionName)

    if (!row.has(action.date)) {
      row.set(action.date, [])
    }

    row.get(action.date).push(action)
  })

  return matrix
})

const totalActions = computed(() => enrichedActions.value.length)

const totalCosts = computed(() => enrichedActions.value.reduce((sum, action) => sum + (action.goldCost || 0), 0))

async function loadData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [playersResponse, actionsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_PROXY}/players.json`),
      axios.get(`${import.meta.env.VITE_PROXY}/political_actions.json`),
    ])

    players.value = playersResponse.data || []
    politicalActions.value = actionsResponse.data || []
  } catch (error) {
    console.error('Ошибка при загрузке данных по действиям знати:', error)
    errorMessage.value = 'Не удалось загрузить данные. Попробуйте обновить страницу.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Действия знати по времени</VCardTitle>
      <VCardSubtitle>Матрица «действие × момент» с указанием исполнителей</VCardSubtitle>

      <template #append>
        <VSelect
          v-model="selectedNobleId"
          :items="noblesOptions"
          label="Игрок знати"
          item-title="label"
          item-value="value"
          density="compact"
          :disabled="loading || !noblePlayers.length"
          style="min-width: 240px"
        >
          <template #item="{ item, props }">
            <VListItem
              v-bind="props"
              :title="item.raw.label"
              :subtitle="item.raw.subtitle"
            />
          </template>

          <template #selection="{ item }">
            <span>{{ item.raw?.label || item.raw }}</span>
          </template>
        </VSelect>
      </template>
    </VCardItem>

    <VCardText v-if="loading" class="text-center py-8">
      <VProgressCircular indeterminate color="primary" />
      <div class="mt-2">Загрузка данных...</div>
    </VCardText>

    <VCardText v-else-if="errorMessage" class="py-6">
      <VAlert
        type="error"
        title="Ошибка загрузки"
        :text="errorMessage"
        border="start"
        variant="tonal"
      />
    </VCardText>

    <VCardText
      v-else-if="!enrichedActions.length"
      class="text-center py-8"
    >
      <VIcon icon="ri-table-line" size="48" class="text-disabled mb-2" />
      <div class="text-body-1 text-disabled">Для выбранного фильтра нет политических действий</div>
    </VCardText>

    <template v-else>
      <VCardText class="pb-0">
        <VRow>
          <VCol cols="12" md="6">
            <VSheet class="summary-chip" color="primary" variant="tonal">
              <VIcon icon="ri-user-voice-line" size="24" class="me-3 text-primary" />
              <div>
                <div class="text-caption text-medium-emphasis">Количество действий</div>
                <div class="text-h6 mb-0">{{ totalActions }}</div>
              </div>
            </VSheet>
          </VCol>

          <VCol cols="12" md="6">
            <VSheet class="summary-chip" color="warning" variant="tonal">
              <VIcon icon="ri-copper-coin-fill" size="24" class="me-3 text-warning" />
              <div>
                <div class="text-caption text-medium-emphasis">Суммарные траты</div>
                <div class="text-h6 mb-0">{{ totalCosts.toLocaleString('ru-RU') }} золота</div>
              </div>
            </VSheet>
          </VCol>
        </VRow>
      </VCardText>

      <VCardText class="pt-4">
        <div class="table-wrapper">
          <VTable class="noble-actions-table">
            <thead>
              <tr>
                <th class="action-column">Действие</th>
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
                v-for="actionName in actionNames"
                :key="actionName"
              >
                <td class="action-column">
                  <div class="action-name">{{ actionName }}</div>
                </td>
                <td
                  v-for="column in timelineColumns"
                  :key="`${actionName}-${column.timestamp}`"
                  class="data-cell"
                >
                  <template v-if="actionMatrix.get(actionName)?.get(column.timestamp)">
                    <div class="cell-items">
                      <VChip
                        v-for="item in actionMatrix.get(actionName).get(column.timestamp)"
                        :key="item.id"
                        size="small"
                        color="primary"
                        variant="flat"
                        class="player-chip"
                        :title="`${item.playerName} · ${item.jobName}`"
                      >
                        {{ item.playerName }}
                      </VChip>
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
  </VCard>
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

.noble-actions-table {
  min-width: 720px;
}

.noble-actions-table th,
.noble-actions-table td {
  white-space: nowrap;
  text-align: center;
  padding: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.noble-actions-table thead th {
  position: sticky;
  top: 0;
  background: rgb(var(--v-theme-surface));
  z-index: 1;
}

.action-column {
  text-align: left;
  min-width: 220px;
  background: rgb(var(--v-theme-surface-variant), 0.4);
  font-weight: 600;
}

.action-name {
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

.player-chip {
  max-width: 140px;
}
</style>

