<script setup>
/**
 * «Подорвать стабильность в регионе»: 10 000, общественный порядок −3 (п. 11).
 *
 * Регион выбирается только из стран-соперников — государств игроков, отмеченных
 * на экране «Дашборд», кроме текущего (список приходит с бэкенда).
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

const regions = ref([])
const regionId = ref(null)
const error = ref(null)
const result = ref(null)
const sending = ref(false)

const regionItems = computed(() => regions.value.map(region => ({
  id: region.id,
  title: region.country_name ? `${region.name} — ${region.country_name}` : region.name,
})))

async function load() {
  try {
    const { data } = await engineApi.getIntelligenceTargets()
    regions.value = data.regions || []
    regionId.value = regions.value[0]?.id || null
  } catch (e) {
    error.value = errorMessage(e)
  }
}

async function run() {
  sending.value = true
  error.value = null
  result.value = null
  try {
    const { data } = await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
      political_action_type_id: props.action.id,
      success: 1,
      params: { region_id: regionId.value },
    })
    result.value = data?.params
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
    <VAlert v-else-if="result" type="success" variant="tonal" density="compact" class="mb-3">
      Общественный порядок в регионе «{{ result.region_name }}» изменён на {{ result.public_order_delta }}.
      <template v-if="result.influence_delta">
        Влияние Тайного советника +{{ result.influence_delta }}.
      </template>
    </VAlert>

    <VSelect
      v-model="regionId"
      :items="regionItems"
      item-title="title"
      item-value="id"
      label="Регион страны-соперника"
      density="compact"
      class="mb-3"
    />

    <VAlert
      v-if="!regions.length"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      Нет регионов стран-соперников. Подтвердите набор государств игроков на экране
      «Дашборд» — регион выбирается только из стран, которые тоже играют.
    </VAlert>

    <div class="text-body-2 mb-3">
      Стоимость: <strong>{{ action.cost }}</strong>. Общественный порядок в регионе −3.
      Влияние Тайного советника: <strong>+3</strong>.
    </div>

    <VBtn color="primary" :loading="sending" :disabled="!regionId" @click="run">
      Подорвать стабильность
    </VBtn>

    <div class="d-flex mt-4">
      <VSpacer />
      <VBtn variant="text" @click="emit('close-dialog')">
        Закрыть
      </VBtn>
    </div>
  </VCardText>
</template>
