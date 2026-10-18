<script setup>
/**
 * Эмбарго государства B на гильдии государства A (п. 9).
 *
 * imposer — кто накладывает: государство строки в блоке «Отношения» (иностранное,
 *           торгует на рынке — правило заказчика: только такие страны накладывают);
 * target  — чьи гильдии, то есть текущее государство / государство столбца.
 *
 * Можно переключить одну гильдию или наложить эмбарго сразу на все гильдии
 * страны target. Данные — `/many_teams/guild_embargoes` с `target_country_id`.
 */
import { computed, ref, watch } from 'vue'
import { engineApi, errorMessage } from '../api'

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

const guilds = computed(() => data.value?.guilds || [])
const embargoedCount = computed(() => guilds.value.filter(guild => guild.embargoed).length)
const allEmbargoed = computed(() => guilds.value.length > 0 && embargoedCount.value === guilds.value.length)

function notify() {
  emit('changed', embargoedCount.value)
}

async function load() {
  if (!props.imposer?.id || !props.target?.id) {
    data.value = null
    return
  }

  loading.value = true
  error.value = null
  try {
    const { data: payload } = await engineApi.getEmbargoes(props.imposer.id, props.target.id)
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
  savingAll.value = true
  error.value = null
  notice.value = null
  try {
    const { data: payload } = await engineApi.imposeEmbargoOnAll({
      country_id: props.imposer.id,
      target_country_id: props.target.id,
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
  savingAll.value = true
  error.value = null
  notice.value = null
  try {
    const { data: payload } = await engineApi.liftAllEmbargoesForCountry({
      country_id: props.imposer.id,
      target_country_id: props.target.id,
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
  load()
})
</script>

<template>
  <VDialog
    v-model="open"
    max-width="560"
  >
    <VCard>
      <VCardItem>
        <VCardTitle class="text-wrap">
          Эмбарго: {{ imposer?.name || '—' }} → гильдии «{{ target?.name || '—' }}»
        </VCardTitle>
        <VCardSubtitle class="text-wrap">
          «{{ imposer?.name || 'Государство' }}» запрещает выбранным гильдиям торговлю с ним:
          их караваны не пройдут без карточки «Контрабанда». Наложить можно на одну гильдию
          или сразу на все гильдии страны.
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

        <div v-else-if="!guilds.length" class="text-medium-emphasis">
          У государства «{{ target?.name || '—' }}» нет гильдий — эмбарго накладывать не на кого.
        </div>

        <v-table v-else density="compact">
          <thead>
            <tr>
              <th class="text-left">Гильдия</th>
              <th class="text-center">Эмбарго</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="guild in guilds"
              :key="guild.id"
            >
              <td>
                {{ guild.name }}
                <span v-if="guild.embargo_year" class="text-caption text-medium-emphasis">
                  (с {{ guild.embargo_year }} г.)
                </span>
              </td>
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
          :disabled="!embargoedCount || savingAll"
          @click="liftAll"
        >
          Снять со всех
        </VBtn>
        <VBtn
          size="small"
          color="error"
          variant="tonal"
          :disabled="!guilds.length || allEmbargoed || savingAll"
          @click="imposeAll"
        >
          На все гильдии страны
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
