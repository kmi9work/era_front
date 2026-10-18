<script setup>
/**
 * «Разведка» Тайного советника (п. 11).
 *
 * Пункты и цены приходят с бэкенда (`/many_teams/intelligence/targets`):
 * общественный порядок в регионе — 1000, отношения соперника с державой — 1000,
 * доход знати соперника — 3000, открытые технологии соперника — 3000.
 * Отчёт считает бэкенд и возвращает в params политдействия.
 */
import axios from 'axios'
import { computed, onBeforeMount, ref } from 'vue'
import { engineApi, errorMessage } from '../../api'

const props = defineProps({
  action: { type: Object, required: true },
  noble_job: { type: Object, required: true },
  dialogOpen: { type: Boolean, default: false },
  countryId: { type: Number, default: null },
})

const emit = defineEmits(['close-dialog'])

const targets = ref(null)
const kind = ref('public_order')
const regionId = ref(null)
const rivalId = ref(null)
const partnerCountryId = ref(null)
const report = ref(null)
const error = ref(null)
const sending = ref(false)

const kinds = computed(() => targets.value?.intel_kinds || [])
const rivals = computed(() => targets.value?.rival_countries || [])
const regions = computed(() => targets.value?.regions || [])
const countries = computed(() => targets.value?.countries || [])
const price = computed(() => kinds.value.find(item => item.intel_type === kind.value)?.price || 0)

async function load() {
  try {
    const { data } = await engineApi.getIntelligenceTargets()
    targets.value = data
    rivalId.value = data.rival_countries?.[0]?.id || null
    regionId.value = data.regions?.[0]?.id || null
    partnerCountryId.value = data.rival_countries?.[0]?.id || null
  } catch (e) {
    error.value = errorMessage(e)
  }
}

async function run() {
  sending.value = true
  error.value = null
  report.value = null

  const params = { intel_type: kind.value }
  if (kind.value === 'public_order') params.region_id = regionId.value
  if (kind.value === 'rival_relations') {
    params.rival_country_id = rivalId.value
    if (partnerCountryId.value) params.country_id = partnerCountryId.value
  }
  if (kind.value === 'noble_income' || kind.value === 'technologies') params.rival_country_id = rivalId.value

  try {
    const { data } = await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
      political_action_type_id: props.action.id,
      success: 1,
      params,
    })
    report.value = data?.params?.report || null
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    sending.value = false
  }
}

onBeforeMount(load)
</script>

<template>
  <VCardText>
    <VAlert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
      {{ error }}
    </VAlert>

    <VSelect
      v-model="kind"
      :items="kinds"
      item-title="title"
      item-value="intel_type"
      label="Пункт разведки"
      density="compact"
      class="mb-3"
    >
      <template #item="{ props: itemProps, item }">
        <VListItem v-bind="itemProps" :subtitle="`${item.raw.price} золота`" />
      </template>
    </VSelect>

    <VSelect
      v-if="kind === 'public_order'"
      v-model="regionId"
      :items="regions"
      item-title="name"
      item-value="id"
      label="Регион"
      density="compact"
      class="mb-3"
    />

    <VSelect
      v-if="kind !== 'public_order'"
      v-model="rivalId"
      :items="rivals"
      item-title="name"
      item-value="id"
      label="Команда-соперник"
      density="compact"
      class="mb-3"
    />

    <VSelect
      v-if="kind === 'rival_relations'"
      v-model="partnerCountryId"
      :items="countries"
      item-title="name"
      item-value="id"
      label="Держава, с которой важны отношения"
      density="compact"
      class="mb-3"
    />

    <div class="text-body-2 mb-3">
      Стоимость пункта разведки: <strong>{{ price }}</strong> золота
    </div>

    <VBtn color="primary" :loading="sending" @click="run">
      Получить сведения
    </VBtn>

    <VCard v-if="report" variant="tonal" class="mt-4">
      <VCardTitle class="text-subtitle-1">
        {{ report.title }} — {{ report.price }} золота
      </VCardTitle>
      <VCardText>
        <div v-if="report.intel_type === 'public_order'">
          Регион «{{ report.data.region_name }}» ({{ report.data.country_name }}):
          общественный порядок <strong>{{ report.data.public_order }}</strong>.
        </div>

        <div v-else-if="report.intel_type === 'rival_relations'">
          <div class="mb-2">
            Отношения «{{ report.data.rival_country_name }}»:
          </div>
          <v-table density="compact">
            <tbody>
              <tr v-for="row in report.data.relations" :key="row.country_id">
                <td>{{ row.country_name }}</td>
                <td>{{ row.relations }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <div v-else-if="report.intel_type === 'noble_income'">
          <div class="mb-2">
            Доход знати «{{ report.data.rival_country_name }}» за {{ report.data.year }} год,
            всего {{ report.data.total }}:
          </div>
          <v-table density="compact">
            <tbody>
              <tr v-for="row in report.data.nobles" :key="row.player_id">
                <td>{{ row.name }}</td>
                <td>{{ row.income }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <div v-else-if="report.intel_type === 'technologies'">
          <div class="mb-2">
            Открытые технологии «{{ report.data.rival_country_name }}»:
          </div>
          <div v-if="!report.data.technologies.length" class="text-medium-emphasis">
            Технологий нет
          </div>
          <VChip
            v-for="technology in report.data.technologies"
            :key="technology.id"
            size="small"
            variant="tonal"
            class="me-1 mb-1"
          >
            {{ technology.name }}
          </VChip>
        </div>
      </VCardText>
    </VCard>

    <div class="d-flex mt-4">
      <VSpacer />
      <VBtn variant="text" @click="emit('close-dialog')">
        Закрыть
      </VBtn>
    </div>
  </VCardText>
</template>
