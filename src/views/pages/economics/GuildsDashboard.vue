<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { useCurrentCountry } from '@/composables/useCurrentCountry'
import ResourceIcons from '@/components/ResourceIcons.vue'

/**
 * «Экономика → Дашборд»: две короткие таблицы по гильдиям текущего государства.
 *
 * 1. «Производство»: гильдия, предприятия (сжато), возможная добыча и
 *    переработка — ресурсы значками (ResourceIcons). Раскрытие строки —
 *    предприятия с расположением и максимальным выпуском.
 * 2. «Политика и торговля»: политдействия купцов за год, караваны за год,
 *    товарооборот и страны (флаг + оборот). Раскрытие строки — торговля по
 *    странам и все караваны за игру.
 *
 * Данные — GET /guilds/dashboard.json?country_id=... (GuildDashboardService).
 * Государство из useCurrentCountry: watch с immediate, а не onBeforeMount —
 * дочерний компонент монтируется раньше, чем родительский await завершится.
 */

const { currentCountryId, reloadToken, loadCurrentCountry } = useCurrentCountry()

const dashboard = ref(null)
const loading = ref(false)
const error = ref(null)

// Раскрытые строки в каждой таблице независимы
const openedProduction = ref({})
const openedTrade = ref({})

// Удаление каравана из истории гильдии (мастер исправляет ошибочную отправку)
const deletingCaravan = ref(null)
const deleteDialog = ref(false)
const deleteLoading = ref(false)
const deleteError = ref(null)

async function loadDashboard({ resetOpened = true } = {}) {
  await loadCurrentCountry()
  if (!currentCountryId.value) return

  loading.value = true
  error.value = null

  try {
    const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/guilds/dashboard.json`, {
      params: { country_id: currentCountryId.value },
    })
    dashboard.value = data
    if (resetOpened) {
      openedProduction.value = {}
      openedTrade.value = {}
    }
  } catch (e) {
    dashboard.value = null
    error.value = e?.response?.data?.error || e?.message || 'Не удалось загрузить дашборд'
  } finally {
    loading.value = false
  }
}

watch(currentCountryId, () => loadDashboard(), { immediate: true })
watch(reloadToken, () => loadDashboard())

// ---- форматирование ----

const formatNumber = (value) => Number(value || 0).toLocaleString('ru-RU')

const plantsSummary = (guild) => {
  const types = guild?.plants?.by_type || []
  if (!types.length) return '—'

  return types.map(type => `${type.name} ×${type.count}`).join(' · ')
}

// Уровни предприятий — в подсказке, чтобы строка таблицы оставалась в одну строку
const plantsTooltip = (guild) => (guild?.plants?.by_type || [])
  .map(type => `${type.name}: ${type.count} шт.${type.levels?.length ? `, ур. ${type.levels.join(', ')}` : ''}`)
  .join('\n')

const flatPlants = (guild) => (guild?.plants?.by_type || [])
  .flatMap(type => type.items || [])

const actionsTooltip = (guild) => (guild?.political_actions?.items || [])
  .map(action => `${action.name} — ${action.success ? 'успех' : 'неудача'}`)
  .join('\n')

const countriesTooltip = (guild) => (guild?.caravans?.year?.by_country || [])
  .map(row => `${row.name}: ${formatNumber(row.turnover)} зол., караванов ${row.count}`)
  .join('\n')

const countriesCount = computed(() => {
  const ids = new Set()

  ;(dashboard.value?.guilds || []).forEach((guild) => {
    (guild.caravans.year.by_country || []).forEach(row => ids.add(row.country_id))
  })

  return ids.size
})

const toggleProduction = (guildId) => {
  openedProduction.value = { ...openedProduction.value, [guildId]: !openedProduction.value[guildId] }
}

const toggleTrade = (guildId) => {
  openedTrade.value = { ...openedTrade.value, [guildId]: !openedTrade.value[guildId] }
}

const countryFlag = (country) => country?.flag_image_name
  ? `/images/countries/${country.flag_image_name}.png`
  : null

// ---- удаление каравана ----

const openDeleteDialog = (guild, caravan) => {
  deletingCaravan.value = { guild, caravan }
  deleteError.value = null
  deleteDialog.value = true
}

const closeDeleteDialog = () => {
  if (deleteLoading.value) return
  deleteDialog.value = false
  deletingCaravan.value = null
  deleteError.value = null
}

const confirmDeleteCaravan = async () => {
  const caravan = deletingCaravan.value?.caravan
  if (!caravan) return

  deleteLoading.value = true
  deleteError.value = null

  try {
    await axios.delete(`${import.meta.env.VITE_PROXY}/caravans/${caravan.id}.json`)
    deleteDialog.value = false
    deletingCaravan.value = null
    // Обновляем цифры, не сворачивая раскрытую строку гильдии
    await loadDashboard({ resetOpened: false })
  } catch (e) {
    deleteError.value = e?.response?.data?.error || e?.message || 'Не удалось удалить караван'
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div>
    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      :text="error"
    >
      <template #append>
        <VBtn
          size="small"
          variant="text"
          @click="loadDashboard"
        >
          Повторить
        </VBtn>
      </template>
    </VAlert>

    <div
      v-if="loading"
      class="d-flex justify-center pa-8"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <template v-else-if="dashboard">
      <!-- Одна строка контекста вместо KPI-карточек -->
      <div class="d-flex align-center flex-wrap gap-3 mb-3">
        <template v-if="dashboard.country">
          <img
            v-if="countryFlag(dashboard.country)"
            :src="countryFlag(dashboard.country)"
            :alt="dashboard.country.name"
            height="24"
          >
          <span class="text-h6">{{ dashboard.country.name }}</span>
        </template>
        <span class="text-body-2 text-medium-emphasis">{{ dashboard.year }}-й год</span>
        <span class="text-body-2">
          гильдий {{ dashboard.totals.guilds }} ·
          предприятий {{ dashboard.totals.plants }} ·
          караванов {{ dashboard.totals.caravans }} ·
          оборот {{ formatNumber(dashboard.totals.turnover) }} зол.
          <template v-if="countriesCount"> · стран: {{ countriesCount }}</template>
        </span>
      </div>

      <VAlert
        v-if="!dashboard.guilds.length"
        type="info"
        variant="tonal"
      >
        У этого государства нет гильдий: гильдии создаются в разделе «Игроки → Гильдии» и привязываются к государству.
      </VAlert>

      <template v-else>
        <!-- Таблица 1: производство -->
        <VCard class="mb-4">
          <VCardTitle class="text-subtitle-1 pb-1">
            Производство
          </VCardTitle>
          <VCardText class="pa-0">
            <VTable
              density="compact"
              class="dashboard-table"
            >
              <thead>
                <tr>
                  <th class="text-left">
                    Гильдия
                  </th>
                  <th class="text-left">
                    Предприятия
                  </th>
                  <th class="text-left">
                    Добыча
                  </th>
                  <th class="text-left">
                    Переработка
                  </th>
                  <th style="width: 44px" />
                </tr>
              </thead>
              <tbody>
                <template
                  v-for="guild in dashboard.guilds"
                  :key="guild.id"
                >
                  <tr>
                    <td class="font-weight-medium text-no-wrap">
                      {{ guild.name }}
                    </td>
                    <td class="plants-cell text-body-2" :title="plantsTooltip(guild)">
                      {{ plantsSummary(guild) }}
                    </td>
                    <td>
                      <ResourceIcons :resources="guild.plants.extraction" />
                    </td>
                    <td>
                      <ResourceIcons :resources="guild.plants.processing" />
                    </td>
                    <td class="text-center">
                      <VBtn
                        icon
                        size="x-small"
                        variant="text"
                        :title="openedProduction[guild.id] ? 'Скрыть предприятия' : 'Показать предприятия и расположение'"
                        @click="toggleProduction(guild.id)"
                      >
                        <VIcon
                          :icon="openedProduction[guild.id] ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
                        />
                      </VBtn>
                    </td>
                  </tr>
                  <tr v-if="openedProduction[guild.id]">
                    <td
                      colspan="5"
                      class="detail-cell"
                    >
                      <div class="text-caption text-medium-emphasis mb-1">
                        Предприятия и расположение
                      </div>
                      <VTable
                        v-if="flatPlants(guild).length"
                        density="compact"
                      >
                        <thead>
                          <tr>
                            <th class="text-left">
                              Предприятие
                            </th>
                            <th class="text-left">
                              Тип
                            </th>
                            <th class="text-center">
                              Ур.
                            </th>
                            <th class="text-left">
                              Расположение
                            </th>
                            <th class="text-left">
                              Макс. выпуск
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="plant in flatPlants(guild)"
                            :key="plant.id"
                          >
                            <td>{{ plant.comments || `${plant.plant_type} #${plant.id}` }}</td>
                            <td>{{ plant.plant_type || '—' }}</td>
                            <td class="text-center">
                              {{ plant.level || '—' }}
                            </td>
                            <td
                              class="location-cell"
                              :title="plant.location || ''"
                            >
                              {{ plant.region || plant.location || '—' }}
                            </td>
                            <td>
                              <ResourceIcons :resources="plant.output" />
                            </td>
                          </tr>
                        </tbody>
                      </VTable>
                      <div
                        v-else
                        class="text-body-2 text-medium-emphasis"
                      >
                        Предприятий нет
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <tr>
                  <td class="font-weight-medium text-no-wrap">
                    Итого
                  </td>
                  <td class="text-body-2">
                    {{ dashboard.totals.plants }} шт.
                  </td>
                  <td>
                    <ResourceIcons :resources="dashboard.totals.extraction" />
                  </td>
                  <td>
                    <ResourceIcons :resources="dashboard.totals.processing" />
                  </td>
                  <td />
                </tr>
              </tfoot>
            </VTable>
          </VCardText>
        </VCard>

        <!-- Таблица 2: политика и торговля -->
        <VCard>
          <VCardTitle class="text-subtitle-1 pb-1">
            Политика и торговля
          </VCardTitle>
          <VCardText class="pa-0">
            <VTable
              density="compact"
              class="dashboard-table"
            >
              <thead>
                <tr>
                  <th class="text-left">
                    Гильдия
                  </th>
                  <th class="text-left">
                    Политдействия
                  </th>
                  <th class="text-center">
                    Караванов
                  </th>
                  <th class="text-right">
                    Товарооборот
                  </th>
                  <th class="text-left">
                    Страны
                  </th>
                  <th style="width: 44px" />
                </tr>
              </thead>
              <tbody>
                <template
                  v-for="guild in dashboard.guilds"
                  :key="guild.id"
                >
                  <tr>
                    <td class="font-weight-medium text-no-wrap">
                      {{ guild.name }}
                    </td>
                    <td>
                      <span
                        v-if="guild.political_actions.performed"
                        class="d-inline-flex align-center gap-1 text-success"
                        :title="actionsTooltip(guild)"
                      >
                        <VIcon
                          icon="ri-checkbox-circle-fill"
                          size="16"
                        />
                        {{ guild.political_actions.count }}
                      </span>
                      <span
                        v-else
                        class="text-medium-emphasis"
                      >—</span>
                    </td>
                    <td class="text-center text-no-wrap">
                      {{ guild.caravans.year.count }}
                      <span
                        v-if="guild.caravans.year.robbed_count"
                        class="text-caption text-error"
                      >
                        ({{ guild.caravans.year.robbed_count }} огр.)
                      </span>
                    </td>
                    <td class="text-right text-no-wrap">
                      {{ formatNumber(guild.caravans.year.turnover) }}
                    </td>
                    <td>
                      <span
                        v-if="guild.caravans.year.by_country.length"
                        class="countries-cell"
                        :title="countriesTooltip(guild)"
                      >
                        <span
                          v-for="row in guild.caravans.year.by_country"
                          :key="row.country_id"
                          class="country-item"
                        >
                          <img
                            v-if="row.flag_image_name"
                            :src="`/images/countries/${row.flag_image_name}.png`"
                            :alt="row.name"
                            height="14"
                          >
                          <span>{{ formatNumber(row.turnover) }}</span>
                        </span>
                      </span>
                      <span
                        v-else
                        class="text-medium-emphasis"
                      >—</span>
                    </td>
                    <td class="text-center">
                      <VBtn
                        icon
                        size="x-small"
                        variant="text"
                        :title="openedTrade[guild.id] ? 'Скрыть торговлю' : 'Показать торговлю по странам и все караваны'"
                        @click="toggleTrade(guild.id)"
                      >
                        <VIcon
                          :icon="openedTrade[guild.id] ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
                        />
                      </VBtn>
                    </td>
                  </tr>
                  <tr v-if="openedTrade[guild.id]">
                    <td
                      colspan="6"
                      class="detail-cell"
                    >
                      <div class="text-caption text-medium-emphasis mb-1">
                        Торговля за {{ dashboard.year }}-й год по странам
                      </div>
                      <VTable
                        v-if="guild.caravans.year.by_country.length"
                        density="compact"
                      >
                        <thead>
                          <tr>
                            <th class="text-left">
                              Страна
                            </th>
                            <th class="text-center">
                              Караванов
                            </th>
                            <th class="text-right">
                              Товарооборот
                            </th>
                            <th class="text-left">
                              Вывезено
                            </th>
                            <th class="text-left">
                              Ввезено
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="row in guild.caravans.year.by_country"
                            :key="row.country_id"
                          >
                            <td class="text-no-wrap">
                              {{ row.name }}
                            </td>
                            <td class="text-center">
                              {{ row.count }}
                            </td>
                            <td class="text-right">
                              {{ formatNumber(row.turnover) }}
                            </td>
                            <td>
                              <ResourceIcons :resources="row.resources_export" />
                            </td>
                            <td>
                              <ResourceIcons :resources="row.resources_import" />
                            </td>
                          </tr>
                        </tbody>
                      </VTable>
                      <div
                        v-else
                        class="text-body-2 text-medium-emphasis mb-2"
                      >
                        В этом году караваны не отправлялись
                      </div>

                      <div class="text-caption text-medium-emphasis mb-1 mt-2">
                        Все караваны за игру ({{ guild.caravans.all_time.count }})
                      </div>
                      <VTable
                        v-if="guild.caravans.all_time.items.length"
                        density="compact"
                      >
                        <thead>
                          <tr>
                            <th class="text-center">
                              Год
                            </th>
                            <th class="text-left">
                              Страна
                            </th>
                            <th class="text-right">
                              Товарооборот
                            </th>
                            <th class="text-left">
                              Вывезено
                            </th>
                            <th class="text-left">
                              Ввезено
                            </th>
                            <th class="text-left">
                              Статус
                            </th>
                            <th class="text-center">
                              Удаление
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="caravan in guild.caravans.all_time.items"
                            :key="caravan.id"
                          >
                            <td class="text-center">
                              {{ caravan.year }}
                            </td>
                            <td class="text-no-wrap">
                              {{ caravan.country || '—' }}
                            </td>
                            <td class="text-right">
                              {{ formatNumber(caravan.turnover) }}
                            </td>
                            <td>
                              <ResourceIcons :resources="caravan.resources_export" />
                            </td>
                            <td>
                              <ResourceIcons :resources="caravan.resources_import" />
                            </td>
                            <td class="text-no-wrap">
                              <VChip
                                v-if="caravan.is_robbed"
                                size="x-small"
                                color="error"
                                variant="tonal"
                              >
                                ограблен
                              </VChip>
                              <VChip
                                v-else
                                size="x-small"
                                variant="tonal"
                              >
                                дошёл
                              </VChip>
                              <VChip
                                v-if="caravan.via_vyatka"
                                size="x-small"
                                variant="tonal"
                                class="ms-1"
                              >
                                Вятка
                              </VChip>
                            </td>
                            <td class="text-center">
                              <IconBtn
                                icon="ri-delete-bin-line"
                                size="x-small"
                                variant="text"
                                color="error"
                                title="Удалить караван"
                                @click.stop="openDeleteDialog(guild, caravan)"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </VTable>
                      <div
                        v-else
                        class="text-body-2 text-medium-emphasis"
                      >
                        Караванов ещё не было
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <tr>
                  <td class="font-weight-medium text-no-wrap">
                    Итого
                  </td>
                  <td>
                    <span
                      v-if="dashboard.totals.political_actions"
                      class="d-inline-flex align-center gap-1 text-success"
                      :title="`Гильдий с действиями: ${dashboard.totals.guilds_with_political_actions}`"
                    >
                      <VIcon
                        icon="ri-checkbox-circle-fill"
                        size="16"
                      />
                      {{ dashboard.totals.political_actions }}
                    </span>
                    <span
                      v-else
                      class="text-medium-emphasis"
                    >—</span>
                  </td>
                  <td class="text-center">
                    {{ dashboard.totals.caravans }}
                  </td>
                  <td class="text-right">
                    {{ formatNumber(dashboard.totals.turnover) }}
                  </td>
                  <td class="text-body-2">
                    {{ countriesCount ? `стран: ${countriesCount}` : '—' }}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </VTable>
          </VCardText>
        </VCard>
      </template>
    </template>

    <!-- Удаление каравана: подтверждение, чтобы случайный клик не правил историю -->
    <VDialog
      v-model="deleteDialog"
      max-width="480"
    >
      <VCard>
        <VCardTitle class="text-wrap">
          Удалить караван?
        </VCardTitle>
        <VCardText v-if="deletingCaravan">
          <div class="text-body-2 mb-2">
            Гильдия «{{ deletingCaravan.guild.name }}» ·
            {{ deletingCaravan.caravan.year }}-й год ·
            {{ deletingCaravan.caravan.country || '—' }}
          </div>
          <div class="text-body-2 text-medium-emphasis mb-0">
            Товарооборот: {{ formatNumber(deletingCaravan.caravan.turnover) }} зол.
            <template v-if="deletingCaravan.caravan.is_robbed">
              · караван ограблен
            </template>
          </div>
          <VAlert
            v-if="deleteError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
            :text="deleteError"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            :disabled="deleteLoading"
            @click="closeDeleteDialog"
          >
            Отмена
          </VBtn>
          <VBtn
            color="error"
            variant="tonal"
            :loading="deleteLoading"
            @click="confirmDeleteCaravan"
          >
            Удалить
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.gap-1 {
  gap: 4px;
}

.gap-3 {
  gap: 12px;
}

.dashboard-table :deep(td.plants-cell) {
  max-width: 360px;
  white-space: normal;
}

.dashboard-table :deep(td.location-cell) {
  max-width: 420px;
  white-space: normal;
  word-break: break-word;
}

.dashboard-table :deep(td.detail-cell) {
  background: rgba(var(--v-theme-on-surface), 0.02);
  white-space: normal;
  padding-top: 8px;
  padding-bottom: 12px;
}

.countries-cell {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.country-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
</style>
