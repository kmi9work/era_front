<script setup>
/**
 * Окно «Гильдии» на экране «Служебное» (только many_teams).
 *
 * Верхняя четверть — обычный таймер расписания (тот же компонент, что на экране
 * «Таймер»), снизу три четверти — таблица ВСЕХ гильдий игры:
 *   * разрешено ли строительство/производство на территории текущего государства;
 *   * какие государства наложили на гильдию эмбарго;
 *   * какие ресурсы гильдия добывает/производит на территории текущего
 *     государства — только значки, без количества;
 *   * товарооборот гильдии по странам за всю игру — герб и число.
 * Остальные столбцы показывают текущее состояние.
 *
 * Данные — `GET /many_teams/guilds_overview?country_id=`; экран только читает,
 * поэтому обновляется по таймеру (15 с) и при смене государства.
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useCurrentCountry } from '@/composables/useCurrentCountry'
import TimerScreen from '@/views/pages/aux/TimerScreen.vue'
import ResourceIcons from '@/components/ResourceIcons.vue'
import { engineApi, errorMessage } from '../api'

const props = defineProps({
  timerStore: {
    type: Object,
    default: null,
  },
})

// Таймер живёт в глобальном store; ядро может передать свой экземпляр пропсом.
const storeTimer = useTimerStore()
const timerStore = computed(() => props.timerStore || storeTimer)

const REFRESH_MS = 15000

const { currentCountryId, currentCountry, reloadToken, loadCurrentCountry } = useCurrentCountry()

const data = ref(null)
const loading = ref(false)
const error = ref(null)
let refreshHandle = null

const guilds = computed(() => {
  // Порядок: сначала гильдии текущего государства, затем остальные; внутри
  // группы — по алфавиту (русская раскладка).
  const collator = new Intl.Collator('ru')

  return [...(data.value?.guilds || [])].sort((a, b) => {
    if (a.own !== b.own) return a.own ? -1 : 1

    return collator.compare(a.guild_name || '', b.guild_name || '')
  })
})
const territoryName = computed(
  () => data.value?.country?.name || currentCountry?.name || 'текущего государства',
)

const flagUrl = flagName => (flagName ? `/images/countries/${flagName}.png` : null)

// Товарооборот — сумма вывоза и ввоза, как в «Экономике → Дашборд»
const formatTurnover = value => Number(value || 0).toLocaleString('ru-RU')

async function load() {
  await loadCurrentCountry()

  if (!currentCountryId.value) {
    data.value = null
    return
  }

  loading.value = !data.value
  error.value = null
  try {
    const { data: payload } = await engineApi.getGuildsOverview(currentCountryId.value)
    data.value = payload
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

watch(currentCountryId, load, { immediate: true })
watch(reloadToken, load)

onMounted(() => {
  refreshHandle = setInterval(load, REFRESH_MS)
})

onUnmounted(() => {
  if (refreshHandle) clearInterval(refreshHandle)
})
</script>

<template>
  <div class="guilds-board">
    <!-- Таймер: сверху посередине, как на экране «Таймер» -->
    <div class="guilds-board__timer">
      <TimerScreen :timer-store="timerStore" />
    </div>

    <!-- Таблица всех гильдий игры: нижние три четверти экрана -->
    <div class="guilds-board__body">
      <div v-if="error" class="guilds-board__message guilds-board__message--error">
        {{ error }}
      </div>
      <div v-else-if="loading" class="guilds-board__message">
        Загрузка…
      </div>
      <div v-else-if="!guilds.length" class="guilds-board__message">
        Гильдий в игре нет
      </div>

      <div v-else class="guilds-board__scroll">
        <table class="guilds-table">
          <colgroup>
            <col class="col-guild">
            <col class="col-allowed">
            <col class="col-embargo">
            <col class="col-resources">
            <col class="col-turnover">
          </colgroup>
          <thead>
            <tr>
              <th class="text-left">Гильдия</th>
              <th class="text-center">Разрешено строительство/производство</th>
              <th class="text-center">Страны, введшие эмбарго</th>
              <th class="text-center">Производят в стране</th>
              <th class="text-center">Товарооборот по странам</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="guild in guilds" :key="guild.guild_id">
              <td>
                <div class="guild-name">{{ guild.guild_name }}</div>
                <div class="guild-country">
                  <img
                    v-if="flagUrl(guild.guild_country_flag)"
                    :src="flagUrl(guild.guild_country_flag)"
                    :alt="guild.guild_country_name || ''"
                    class="guild-country__flag"
                  >
                  {{ guild.guild_country_name || 'государство не задано' }}
                </div>
              </td>
              <td class="text-center">
                <span
                  class="allowed"
                  :class="guild.allowed ? 'allowed--yes' : 'allowed--no'"
                >
                  {{ guild.allowed ? 'Да' : 'Нет' }}
                </span>
              </td>
              <td>
                <div v-if="guild.embargoes.length" class="embargo-list">
                  <span
                    v-for="embargo in guild.embargoes"
                    :key="embargo.country_id"
                    class="embargo"
                  >
                    <img
                      v-if="flagUrl(embargo.flag_image_name)"
                      :src="flagUrl(embargo.flag_image_name)"
                      :alt="embargo.country_name || ''"
                      class="embargo__flag"
                    >
                    {{ embargo.short_name || embargo.country_name }}
                  </span>
                </div>
                <span v-else class="empty">—</span>
              </td>
              <td>
                <ResourceIcons
                  v-if="guild.resources.length"
                  :resources="guild.resources"
                  :size="50"
                  :show-count="false"
                />
                <span v-else class="empty">—</span>
              </td>
              <td>
                <div v-if="guild.turnover?.length" class="turnover-list">
                  <span
                    v-for="row in guild.turnover"
                    :key="row.country_id"
                    class="turnover"
                  >
                    <img
                      v-if="flagUrl(row.flag_image_name)"
                      :src="flagUrl(row.flag_image_name)"
                      :alt="row.country_name || ''"
                      class="turnover__flag"
                    >
                    <span class="turnover__value">{{ formatTurnover(row.turnover) }}</span>
                  </span>
                </div>
                <span v-else class="empty">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.guilds-board {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  color: #fff;
  font-family: var(--game-font, 'Beryozki', sans-serif);
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.65);
}

/* Верхняя четверть — таймер */
.guilds-board__timer {
  flex: 0 0 25%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 2px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

/* Таймер на экране «Таймер» рассчитан на весь экран — здесь ужимаем под 1/4 */
.guilds-board__timer :deep(.fullscreen-text-container) {
  height: 100%;
  width: 100%;
}

.guilds-board__timer :deep(.fullscreen-schedule-name) {
  font-size: clamp(1.4rem, 3.2vh, 3.2rem);
  margin-bottom: 0.6rem;
}

.guilds-board__timer :deep(.fullscreen-timer-value) {
  font-size: clamp(3rem, 11vh, 11rem);
}

/* Нижние три четверти — таблица */
.guilds-board__body {
  flex: 1 1 75%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 1rem 2rem 1.5rem;
}

.guilds-board__message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  opacity: 0.85;
}

.guilds-board__message--error {
  color: #ff8a80;
}

.guilds-board__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.guilds-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  .col-guild { width: 20%; }
  .col-allowed { width: 15%; }
  .col-embargo { width: 19%; }
  .col-resources { width: 20%; }
  .col-turnover { width: 26%; }
}

.guilds-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 1rem 1.1rem;
  font-size: clamp(0.9rem, 1.9vh, 1.5rem);
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #ffd700;
  background: rgba(18, 18, 18, 0.92);
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.guilds-table td {
  padding: 1rem 1.1rem;
  vertical-align: middle;
  font-size: clamp(1.2rem, 2.9vh, 2.4rem);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.guilds-table tbody tr:nth-child(odd) {
  background: rgba(255, 255, 255, 0.04);
}

.text-left { text-align: left; }
.text-center { text-align: center; }

.guild-name {
  font-size: 1.1em;
  font-weight: 700;
  line-height: 1.15;
}

.guild-country {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.65em;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guild-country__flag,
.embargo__flag {
  width: 1.6em;
  height: auto;
  max-height: 1.4em;
  object-fit: contain;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.allowed {
  display: inline-block;
  min-width: 5em;
  padding: 0.2em 0.6em;
  border-radius: 9999px;
  font-size: 0.9em;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.allowed--yes {
  color: #041b06;
  background: linear-gradient(135deg, #7bd88f, #43a047);
  text-shadow: none;
}

.allowed--no {
  color: #fff;
  background: linear-gradient(135deg, #e57373, #c62828);
  text-shadow: none;
}

.embargo-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.9rem;
}

.embargo {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  font-size: 0.85em;
}

/* Товарооборот по странам: герб + число */
.turnover-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 1.2rem;
}

.turnover {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
}

.turnover__flag {
  width: 1.7em;
  height: auto;
  max-height: 1.5em;
  object-fit: contain;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.turnover__value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #ffd700;
}

.empty {
  opacity: 0.5;
}

/* Иконки ресурсов наследуют размер шрифта ячейки */
:deep(.resource-icons) {
  gap: 0.4rem 0.8rem;
}

:deep(.resource-icons__fallback) {
  font-size: 0.6em;
  color: rgba(255, 255, 255, 0.85);
}
</style>
