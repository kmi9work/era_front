<script setup>
/**
 * «Подорвать отношения двух стран»: 10 000, отношения −1 (п. 11).
 * По умолчанию первая страна — зарубежная, вторая — текущее государство.
 */
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

const countries = ref([])
const firstId = ref(null)
const secondId = ref(null)
const error = ref(null)
const result = ref(null)
const sending = ref(false)

async function load() {
  try {
    const { data } = await engineApi.getIntelligenceTargets()
    countries.value = data.countries || []
    const foreign = countries.value.find(country => country.id !== props.countryId)
    firstId.value = foreign?.id || null
    secondId.value = props.countryId || countries.value[0]?.id || null
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
      params: { country_a_id: firstId.value, country_b_id: secondId.value },
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
      Отношения пары изменены на {{ result.relations_delta }}.
      <template v-if="result.influence_delta">
        Влияние Тайного советника +{{ result.influence_delta }}.
      </template>
    </VAlert>

    <VSelect
      v-model="firstId"
      :items="countries"
      item-title="name"
      item-value="id"
      label="Первая страна (по умолчанию зарубежная)"
      density="compact"
      class="mb-3"
    />
    <VSelect
      v-model="secondId"
      :items="countries"
      item-title="name"
      item-value="id"
      label="Вторая страна"
      density="compact"
      class="mb-3"
    />

    <div class="text-body-2 mb-3">
      Стоимость: <strong>{{ action.cost }}</strong>. Отношения пары −1.
      Влияние Тайного советника: <strong>+3</strong>.
    </div>

    <VBtn
      color="primary"
      :loading="sending"
      :disabled="!firstId || !secondId || firstId === secondId"
      @click="run"
    >
      Подорвать отношения
    </VBtn>

    <div class="d-flex mt-4">
      <VSpacer />
      <VBtn variant="text" @click="emit('close-dialog')">
        Закрыть
      </VBtn>
    </div>
  </VCardText>
</template>
