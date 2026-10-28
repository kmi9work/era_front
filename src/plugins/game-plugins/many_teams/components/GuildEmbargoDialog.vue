<script setup>
/**
 * Эмбарго государства B на гильдии (п. 9).
 *
 * imposer — кто накладывает: государство строки в блоке «Отношения» (иностранное,
 *           торгует на рынке — правило заказчика: только такие страны накладывают);
 * target  — государство, чьи гильдии показываются первыми (текущее / государство
 *           столбца). Это только фильтр по умолчанию: эмбарго можно наложить на
 *           любую гильдию игры, для этого в диалоге есть выбор государства.
 *
 * Можно переключить одну гильдию или наложить эмбарго сразу на все гильдии
 * выбранного государства. Данные — `/many_teams/guild_embargoes` без
 * `target_country_id` (все гильдии игры с их государствами).
 */
import { computed, ref, watch } from 'vue'
import { engineApi, errorMessage } from '../api'

const ALL_COUNTRIES = 0

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  imposer: {
    type: Object,
    default: null,
  },
  target: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'changed'])

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const data = ref(null)
const loading = ref(false)
const error = ref(null)
const notice = ref(null)
const savingGuildId = ref(null)
const savingAll = ref(false)
const countryFilterId = ref(ALL_COUNTRIES)

const guilds = computed(() => data.value?.guilds || [])
const countries = computed(() => data.value?.countries || [])
const filterItems = computed(() => [
  { id: ALL_COUNTRIES, title: 'Все государства игры' },
  ...countries.value.map(country => ({ id: country.id, title: country.name })),
])
const filteredByCountry = computed(() => Number(countryFilterId.value) > 0)
const filterCountry = computed(() => countries.value.find(country => country.id === countryFilterId.value) || null)
const visibleGuilds = computed(() => filteredByCountry.value
  ? guilds.value.filter(guild => guild.country_id === countryFilterId.value)
  : guilds.value)
const embargoedCount = computed(() => guilds.value.filter(guild => guild.embargoed).length)
const visibleEmbargoedCount = computed(() => visibleGuilds.value.filter(guild => guild.embargoed).length)
const allVisibleEmbargoed = computed(() => visibleGuilds.value.length > 0 &&
  visibleEmbargoedCount.value === visibleGuilds.value.length)

function notify() {
  emit('changed', embargoedCount.value)
}

async function load() {
  if (!props.imposer?.id) {
    data.value = null
    return
  }

  loading.value = true
  error.value = null
  try {
    const { data: payload } = await engineApi.getEmbargoes(props.imposer.id)
    data.value = payload
  } catch (e) {
    data.value = null
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

async function toggleGuild(guild, value) {
  savingGuildId.value = guild.id
  error.value = null
  notice.value = null
  try {
    const payload = { country_id: props.imposer.id, guild_id: guild.id }
    if (value) await engineApi.imposeEmbargo(payload)
    else await engineApi.liftEmbargo(payload)

    notice.value = value
      ? `Эмбарго наложено на гильдию «${guild.name}»`
      : `Эмбарго с гильдии «${guild.name}» снято`
    await load()
    notify()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    savingGuildId.value = null
  }
}

async function imposeAll() {
  if (!filteredByCountry.value) return

  savingAll.value = true
  error.value = null
  notice.value = null
  try {
    const { data: payload } = await engineApi.imposeEmbargoOnAll({
      country_id: props.imposer.id,
      target_country_id: countryFilterId.value,
    })
    notice.value = `Эмбарго наложено на гильдии: ${payload.count}`
    await load()
    notify()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    savingAll.value = false
  }
}

async function liftAll() {
  if (!filteredByCountry.value) return

  savingAll.value = true
  error.value = null
  notice.value = null
  try {
    const { data: payload } = await engineApi.liftAllEmbargoesForCountry({
      country_id: props.imposer.id,
      target_country_id: countryFilterId.value,
    })
    notice.value = `Эмбарго снято с гильдий: ${payload.count}`
    await load()
    notify()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    savingAll.value = false
  }
}

watch(open, value => {
  if (!value) return
  notice.value = null
  // По умолчанию показываем гильдии государства из ячейки, но выбор не ограничен:
  // в списке можно взять гильдии любого государства игры.
  countryFilterId.value = props.target?.id || ALL_COUNTRIES
  load()
})
</script>

<template>
  <VDialog
    v-model="open"
    max-width="640"
  >
    <VCard>
      <VCardItem>
        <VCardTitle class="text-wrap">
          Эмбарго: {{ imposer?.name || '—' }} → гильдии
          <template v-if="filterCountry">«{{ filterCountry.name }}»</template>
          <template v-else>любых государств</template>
        </VCardTitle>
        <VCardSubtitle class="text-wrap">
          «{{ imposer?.name || 'Государство' }}» запрещает выбранным гильдиям торговлю с ним:
          их караваны не пройдут без карточки «Контрабанда». Наложить можно на любую
          гильдию игры — выберите государство и переключите нужные гильдии.
        </VCardSubtitle>
      </VCardItem>

      <VCardText>
        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ error }}
        </VAlert>
        <VAlert
          v-else-if="notice"
          type="success"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ notice }}
        </VAlert>

        <div v-if="loading" class="text-medium-emphasis">
          Загрузка…
        </div>

        <template v-else>
          <VSelect
            v-model="countryFilterId"
            :items="filterItems"
            item-title="title"
            item-value="id"
            label="Государство гильдий"
            density="compact"
            class="mb-3"
          />

          <div v-if="!guilds.length" class="text-medium-emphasis">
            В игре нет гильдий — эмбарго накладывать не на кого.
          </div>

          <div v-else-if="!visibleGuilds.length" class="text-medium-emphasis">
            У государства «{{ filterCountry?.name || '—' }}» нет гильдий.
          </div>

          <v-table v-else density="compact">
            <thead>
              <tr>
                <th class="text-left">Гильдия</th>
                <th class="text-left">Государство</th>
                <th class="text-center">Эмбарго</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="guild in visibleGuilds"
                :key="guild.id"
              >
                <td>
                  {{ guild.name }}
                  <span v-if="guild.embargo_year" class="text-caption text-medium-emphasis">
                    (с {{ guild.embargo_year }} г.)
                  </span>
                </td>
                <td>{{ guild.country_name || '—' }}</td>
                <td class="text-center">
                  <VSwitch
                    :model-value="guild.embargoed"
                    density="compact"
                    hide-details
                    color="error"
                    :loading="savingGuildId === guild.id"
                    @update:model-value="value => toggleGuild(guild, value)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </VCardText>

      <VCardActions class="flex-wrap">
        <VBtn
          variant="text"
          @click="open = false"
        >
          Закрыть
        </VBtn>
        <VSpacer />
        <VBtn
          size="small"
          variant="tonal"
          :disabled="!filteredByCountry || !visibleEmbargoedCount || savingAll"
          @click="liftAll"
        >
          Снять со всех<template v-if="filterCountry"> в «{{ filterCountry.name }}»</template>
        </VBtn>
        <VBtn
          size="small"
          color="error"
          variant="tonal"
          :disabled="!filteredByCountry || !visibleGuilds.length || allVisibleEmbargoed || savingAll"
          @click="imposeAll"
        >
          На все гильдии<template v-if="filterCountry"> «{{ filterCountry.name }}»</template>
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
