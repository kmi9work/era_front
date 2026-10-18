<script setup>
/**
 * Эмбарго страны на гильдию (п. 9) и снятие всех эмбарго (п. 10).
 *
 * Данные — `/many_teams/guild_embargoes?country_id=` (страна в параметре —
 * та, что накладывает эмбарго). Кнопка «на все гильдии страны» отправляет
 * список гильдий выбранного государства одним запросом.
 */
import { computed, ref, watch } from 'vue'
import axios from 'axios'
import { useCurrentCountry } from '@/composables/useCurrentCountry'
import { engineApi, errorMessage } from '../api'

const { currentCountryId, reloadToken, loadCurrentCountry } = useCurrentCountry()

const data = ref(null)
const loading = ref(false)
const error = ref(null)
const notice = ref(null)
const savingGuildId = ref(null)

// Диалог «эмбарго на все гильдии страны»
const imposeAllOpen = ref(false)
const targetCountryId = ref(null)
const imposingAll = ref(false)

// Диалог подтверждения снятия всех эмбарго
const liftAllOpen = ref(false)
const liftAllGuild = ref(null)

const overseasTradeOpen = ref(false)

const guilds = computed(() => data.value?.guilds || [])
const countries = computed(() => data.value?.countries || [])
const currentCountry = computed(() => data.value?.country || null)

async function load() {
  await loadCurrentCountry()
  if (!currentCountryId.value) {
    data.value = null
    return
  }

  loading.value = true
  error.value = null
  try {
    const { data: payload } = await engineApi.getEmbargoes(currentCountryId.value)
    data.value = payload
  } catch (e) {
    data.value = null
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

async function loadTechnology() {
  try {
    const { data: technologies } = await axios.get(`${import.meta.env.VITE_PROXY}/technologies.json`, {
      params: { country_id: currentCountryId.value },
    })
    const overseas = (technologies || []).find(item => item.name === 'Заморская торговля')
    overseasTradeOpen.value = overseas?.is_open === 1
  } catch (e) {
    overseasTradeOpen.value = false
  }
}

async function toggleEmbargo(guild, value) {
  savingGuildId.value = guild.id
  error.value = null
  notice.value = null
  try {
    const payload = { country_id: currentCountryId.value, guild_id: guild.id }
    if (value) await engineApi.imposeEmbargo(payload)
    else await engineApi.liftEmbargo(payload)
    notice.value = value
      ? `Эмбарго наложено на гильдию «${guild.name}»`
      : `Эмбарго с гильдии «${guild.name}» снято`
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    savingGuildId.value = null
  }
}

async function imposeOnAll() {
  imposingAll.value = true
  error.value = null
  try {
    const { data: payload } = await engineApi.imposeEmbargoOnAll({
      country_id: currentCountryId.value,
      target_country_id: targetCountryId.value,
    })
    notice.value = `Эмбарго наложено на гильдии: ${payload.count}`
    imposeAllOpen.value = false
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    imposingAll.value = false
  }
}

async function liftAll() {
  if (!liftAllGuild.value) return
  savingGuildId.value = liftAllGuild.value.id
  error.value = null
  try {
    const { data: payload } = await engineApi.liftAllEmbargoes({ guild_id: liftAllGuild.value.id })
    notice.value = `Снято эмбарго: ${payload.lifted_country_ids?.length || 0}`
    liftAllOpen.value = false
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    savingGuildId.value = null
  }
}

function openLiftAll(guild) {
  liftAllGuild.value = guild
  liftAllOpen.value = true
}

watch(currentCountryId, () => { load(); loadTechnology() }, { immediate: true })
watch(reloadToken, () => { load(); loadTechnology() })
</script>

<template>
  <VCard class="mt-5">
    <VCardItem>
      <VCardTitle>Эмбарго по гильдиям</VCardTitle>
      <VCardSubtitle>
        Эмбарго накладывается государством на одну гильдию. Кнопка «на все гильдии страны»
        накладывает эмбарго текущего государства на все гильдии выбранной державы.
        Снятие всех эмбарго с гильдии — действие Великого князя по технологии «Заморская торговля».
      </VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VAlert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
        {{ error }}
      </VAlert>
      <VAlert v-else-if="notice" type="success" variant="tonal" density="compact" class="mb-3">
        {{ notice }}
      </VAlert>

      <div class="d-flex flex-wrap align-center gap-2 mb-3">
        <VChip v-if="currentCountry" color="primary" variant="tonal" size="small">
          накладывает: {{ currentCountry.name }}
        </VChip>
        <VSpacer />
        <VBtn size="small" variant="tonal" @click="imposeAllOpen = true">
          Эмбарго на все гильдии страны
        </VBtn>
      </div>

      <div v-if="loading" class="text-medium-emphasis">
        Загрузка…
      </div>

      <v-table v-else density="compact">
        <thead>
          <tr>
            <th class="text-left">Гильдия</th>
            <th class="text-left">Государство гильдии</th>
            <th class="text-left">Эмбарго на гильдию</th>
            <th class="text-left">Эмбарго государств</th>
            <th class="text-left">Снять все</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="guild in guilds" :key="guild.id">
            <td>{{ guild.name }}</td>
            <td>{{ guild.country_name || '—' }}</td>
            <td>
              <VSwitch
                :model-value="guild.embargoed"
                density="compact"
                hide-details
                :loading="savingGuildId === guild.id"
                @update:model-value="value => toggleEmbargo(guild, value)"
              />
            </td>
            <td>
              <span v-if="!guild.embargoes.length" class="text-medium-emphasis">—</span>
              <VChip
                v-for="row in guild.embargoes"
                :key="row.country_id"
                size="x-small"
                color="error"
                variant="tonal"
                class="me-1"
              >
                {{ row.country_name }}
              </VChip>
            </td>
            <td>
              <VBtn
                size="x-small"
                variant="tonal"
                :disabled="!overseasTradeOpen || !guild.embargoes.length"
                @click="openLiftAll(guild)"
              >
                Снять все
              </VBtn>
            </td>
          </tr>
        </tbody>
      </v-table>

      <div v-if="!overseasTradeOpen" class="text-body-2 text-medium-emphasis mt-3">
        Снятие всех эмбарго доступно после открытия технологии «Заморская торговля».
      </div>
    </VCardText>

    <!-- Эмбарго на все гильдии выбранной страны -->
    <VDialog v-model="imposeAllOpen" max-width="480">
      <VCard title="Эмбарго на все гильдии страны">
        <VCardText>
          <p class="mb-3">
            Текущее государство наложит эмбарго на каждую гильдию выбранной державы.
          </p>
          <VSelect
            v-model="targetCountryId"
            :items="countries"
            item-title="name"
            item-value="id"
            label="Государство гильдий"
            density="compact"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="imposeAllOpen = false">
            Отмена
          </VBtn>
          <VBtn
            color="primary"
            :loading="imposingAll"
            :disabled="!targetCountryId"
            @click="imposeOnAll"
          >
            Наложить
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Подтверждение снятия всех эмбарго -->
    <VDialog v-model="liftAllOpen" max-width="480">
      <VCard title="Снять все эмбарго">
        <VCardText>
          С гильдии «{{ liftAllGuild?.name }}» будут сняты эмбарго всех государств.
          Действие выполняется Великим князем по технологии «Заморская торговля».
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="liftAllOpen = false">
            Отмена
          </VBtn>
          <VBtn color="primary" @click="liftAll">
            Снять
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>
