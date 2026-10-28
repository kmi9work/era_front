<script setup>
/**
 * Табло «Результаты всех команд» для окон «Служебное → Вывод На Экран».
 *
 * Один компонент на оба окна (`mode`):
 *   * `overall` — общий зачёт по всем командам: экономика (стоимость построенных
 *     в государстве предприятий) и политика (очки влияния в государстве); место
 *     считается по каждому показателю отдельно — сводного места нет;
 *   * `personal` — личный зачёт как на экранах результатов: знать по влиянию и
 *     гильдии по капиталу на игрока, места — по всем командам сразу.
 *
 * Данные — `GET /many_teams/all_teams_results` (только чтение), обновление раз в
 * 15 с. Год показывается из ответа: экран считает текущий год живым расчётом, а
 * переключателя лет у окон плагина нет — ядро показывает его только своим экранам
 * результатов (`ScreenManagement.vue`, `isResultsScreen`).
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useTimerStore } from '@/stores/timer'
import TimerScreen from '@/views/pages/aux/TimerScreen.vue'
import { engineApi, errorMessage } from '../api'

const props = defineProps({
  mode: {
    type: String,
    default: 'overall',
    validator: value => ['overall', 'personal'].includes(value),
  },
  timerStore: {
    type: Object,
    default: null,
  },
})

const REFRESH_MS = 15000

// Таймер живёт в глобальном store; ядро может передать свой экземпляр пропсом.
const storeTimer = useTimerStore()
const timerStore = computed(() => props.timerStore || storeTimer)

const data = ref(null)
const loading = ref(false)
const error = ref(null)
let refreshHandle = null

const isOverall = computed(() => props.mode === 'overall')

const title = computed(() => (isOverall.value ? 'Общий зачёт' : 'Личный зачёт'))

const numberFormat = new Intl.NumberFormat('ru-RU')
const formatNumber = value => numberFormat.format(Number(value || 0))

const flagUrl = flagName => (flagName ? `/images/countries/${flagName}.png` : null)

const countries = computed(() => data.value?.countries || [])
const nobles = computed(() => data.value?.nobles || [])
const merchants = computed(() => data.value?.merchants || [])
const year = computed(() => data.value?.year ?? null)
const unassigned = computed(() => data.value?.plants_without_place || { count: 0, value: 0 })

/** «1 место» — подпись места внутри ячейки показателя. */
const placeLabel = place => (place ? `${place} место` : '—')

async function load() {
  loading.value = !data.value
  error.value = null

  try {
    const { data: payload } = await engineApi.getAllTeamsResults()
    data.value = payload
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  refreshHandle = setInterval(load, REFRESH_MS)
})

onUnmounted(() => {
  if (refreshHandle) clearInterval(refreshHandle)
})
</script>

<template>
  <div class="teams-board">
    <!-- Таймер: сверху, как на экране «Таймер» (четверть высоты) -->
    <div class="teams-board__timer">
      <TimerScreen :timer-store="timerStore" />
    </div>

    <div class="teams-board__body">
      <div class="teams-board__head">
        <span class="teams-board__title">{{ title }}</span>
        <span v-if="year" class="teams-board__meta">Итоги года {{ year }} · живой расчёт</span>
      </div>

      <div v-if="error" class="teams-board__message teams-board__message--error">
        {{ error }}
      </div>
      <div v-else-if="loading && !data" class="teams-board__message">Загрузка…</div>
      <div v-else-if="isOverall && !countries.length" class="teams-board__message">
        В игре нет команд
      </div>

      <!-- Общий зачёт: два независимых показателя, место по каждому -->
      <div v-else-if="isOverall" class="teams-board__scroll">
        <table class="teams-table teams-table--overall">
          <colgroup>
            <col class="col-country">
            <col class="col-economy">
            <col class="col-politics">
          </colgroup>
          <thead>
            <tr>
              <th class="text-left">Государство</th>
              <th class="text-center">Экономика · стоимость предприятий</th>
              <th class="text-center">Политика · очки влияния</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in countries" :key="row.country_id">
              <td>
                <div class="country-name">
                  <img
                    v-if="flagUrl(row.flag_image_name)"
                    :src="flagUrl(row.flag_image_name)"
                    :alt="row.name"
                    class="country-flag"
                  >
                  {{ row.name }}
                </div>
                <div class="country-sub">
                  {{ row.players_count }} игрок(ов) · предприятий: {{ row.economy.plants_count }}
                </div>
              </td>
              <td class="text-center">
                <span class="place">{{ placeLabel(row.economy.place) }}</span>
                <span class="value">{{ formatNumber(row.economy.value) }}</span>
              </td>
              <td class="text-center">
                <span class="place">{{ placeLabel(row.politics.place) }}</span>
                <span class="value">{{ formatNumber(row.politics.value) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Личный зачёт: знать по влиянию и гильдии по капиталу на игрока -->
      <div v-else class="teams-board__personal">
        <section class="personal-block">
          <h2 class="personal-title">Знать · влияние</h2>
          <div class="personal-scroll">
            <table class="teams-table teams-table--personal">
              <thead>
                <tr>
                  <th class="text-center col-place">Место</th>
                  <th class="text-left">Имя</th>
                  <th class="text-left">Государство</th>
                  <th class="text-center col-value">Влияние</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="noble in nobles" :key="noble.player_id">
                  <td class="text-center">{{ noble.place }}</td>
                  <td class="text-left">{{ noble.name }}</td>
                  <td class="text-left">
                    <span class="country-inline">
                      <img
                        v-if="flagUrl(noble.flag_image_name)"
                        :src="flagUrl(noble.flag_image_name)"
                        :alt="noble.country_name"
                        class="country-flag--small"
                      >
                      {{ noble.short_name || noble.country_name || '—' }}
                    </span>
                  </td>
                  <td class="text-center value">{{ formatNumber(noble.influence) }}</td>
                </tr>
                <tr v-if="!nobles.length">
                  <td class="text-center empty" colspan="4">Нет данных о знати</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="personal-block">
          <h2 class="personal-title">Купцы · капитал на игрока</h2>
          <div class="personal-scroll">
            <table class="teams-table teams-table--personal">
              <thead>
                <tr>
                  <th class="text-center col-place">Место</th>
                  <th class="text-left">Гильдия</th>
                  <th class="text-left">Государство</th>
                  <th class="text-center col-value">На игрока</th>
                  <th class="text-center col-value">Капитал</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="guild in merchants" :key="guild.guild_id">
                  <td class="text-center">{{ guild.place }}</td>
                  <td class="text-left">{{ guild.name }}</td>
                  <td class="text-left">
                    <span class="country-inline">
                      <img
                        v-if="flagUrl(guild.flag_image_name)"
                        :src="flagUrl(guild.flag_image_name)"
                        :alt="guild.country_name"
                        class="country-flag--small"
                      >
                      {{ guild.short_name || guild.country_name || '—' }}
                    </span>
                  </td>
                  <td class="text-center value">{{ formatNumber(guild.cap_per_pl) }}</td>
                  <td class="text-center">{{ formatNumber(guild.capital) }}</td>
                </tr>
                <tr v-if="!merchants.length">
                  <td class="text-center empty" colspan="5">Нет данных о гильдиях</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- Предприятия без земли (артель, старые записи) ни в одно государство
           не попадают: показываем, чтобы сумма на табло не расходилась с базой. -->
      <div v-if="isOverall && unassigned.count" class="teams-board__footnote">
        Предприятия без земли в зачёт не входят: {{ unassigned.count }}
        ({{ formatNumber(unassigned.value) }})
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.teams-board {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  color: #fff;
  font-family: var(--game-font, 'Beryozki', sans-serif);
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.65);
}

/* Верхняя четверть — таймер */
.teams-board__timer {
  flex: 0 0 25%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 2px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.teams-board__timer :deep(.fullscreen-text-container) {
  height: 100%;
  width: 100%;
}

.teams-board__timer :deep(.fullscreen-schedule-name) {
  font-size: clamp(1.4rem, 3.2vh, 3.2rem);
  margin-bottom: 0.6rem;
}

.teams-board__timer :deep(.fullscreen-timer-value) {
  font-size: clamp(3rem, 11vh, 11rem);
}

/* Нижние три четверти — табло */
.teams-board__body {
  flex: 1 1 75%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0.75rem 1.5rem 1rem;
}

.teams-board__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.teams-board__title {
  font-size: clamp(1.2rem, 2.6vh, 2rem);
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #ffd700;
}

.teams-board__meta {
  font-size: clamp(0.8rem, 1.5vh, 1.1rem);
  opacity: 0.8;
}

.teams-board__message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  opacity: 0.85;
}

.teams-board__message--error {
  color: #ff8a80;
}

.teams-board__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.teams-board__footnote {
  margin-top: 0.4rem;
  font-size: clamp(0.7rem, 1.2vh, 0.95rem);
  opacity: 0.65;
}

.teams-table {
  width: 100%;
  border-collapse: collapse;

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 0.5rem 0.9rem;
    font-size: clamp(0.8rem, 1.5vh, 1.2rem);
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #ffd700;
    background: rgba(18, 18, 18, 0.92);
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  }

  td {
    padding: 0.45rem 0.9rem;
    vertical-align: middle;
    font-size: clamp(0.9rem, 2vh, 1.6rem);
    line-height: 1.15;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  tbody tr:nth-child(odd) {
    background: rgba(255, 255, 255, 0.04);
  }
}

.teams-table--overall {
  table-layout: fixed;

  .col-country { width: 46%; }
  .col-economy { width: 27%; }
  .col-politics { width: 27%; }
}

.teams-table--personal {
  table-layout: fixed;

  .col-place { width: 12%; }
  .col-value { width: 20%; }
}

.text-left { text-align: left; }
.text-center { text-align: center; }

.country-name {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.05em;
  font-weight: 700;
  line-height: 1.1;
}

.country-flag {
  width: 1.7em;
  height: auto;
  max-height: 1.4em;
  object-fit: contain;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.country-flag--small {
  width: 1.5em;
  height: auto;
  max-height: 1.2em;
  object-fit: contain;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.country-sub {
  margin-top: 0.15rem;
  font-size: 0.6em;
  opacity: 0.7;
}

.country-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
}

/* Ячейка показателя: подпись места над числом */
.place {
  display: block;
  font-size: clamp(0.7rem, 1.4vh, 1.1rem);
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.7;
}

.value {
  display: block;
  font-size: clamp(1.2rem, 3.4vh, 2.6rem);
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.teams-table--personal .value {
  font-size: clamp(1rem, 2.4vh, 1.8rem);
}

.teams-board__personal {
  flex: 1;
  display: flex;
  gap: 1.5rem;
  min-height: 0;
}

.personal-block {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.personal-title {
  margin: 0 0 0.4rem;
  font-size: clamp(0.95rem, 2vh, 1.4rem);
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #ffd700;
}

.personal-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.empty {
  padding: 1rem;
  font-size: clamp(0.9rem, 1.8vh, 1.3rem);
  opacity: 0.7;
}
</style>
