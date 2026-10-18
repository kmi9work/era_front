<script setup>
/** «Подорвать стабильность в регионе»: 10 000, общественный порядок −3 (п. 11). */
import axios from 'axios'
import { onBeforeMount, ref } from 'vue'
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
    </VAlert>

    <VSelect
      v-model="regionId"
      :items="regions"
      item-title="name"
      item-value="id"
      label="Регион"
      density="compact"
      class="mb-3"
    />

    <div class="text-body-2 mb-3">
      Стоимость: <strong>{{ action.cost }}</strong>. Общественный порядок в регионе −3.
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
