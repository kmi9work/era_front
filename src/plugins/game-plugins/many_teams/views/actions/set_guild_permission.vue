<script setup>
/**
 * Действие Казначея: разрешить или запретить гильдии строительство и работу
 * предприятий в своём государстве (п. 2). Запрет один: он закрывает и
 * строительство, и работу. Запись делает бэкенд движка — он же фиксирует
 * политдействие.
 */
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
const guildId = ref(null)
const countryId = ref(null)
const allowed = ref(true)
const error = ref(null)
const result = ref(null)
const sending = ref(false)

const guilds = computed(() => targets.value?.guilds || [])
const countries = computed(() => targets.value?.countries || [])

async function load() {
  try {
    const { data } = await engineApi.getIntelligenceTargets()
    targets.value = data
    guildId.value = data.guilds?.[0]?.id || null
    countryId.value = data.player_country_ids?.[0] || props.countryId || null
    allowed.value = true
  } catch (e) {
    error.value = errorMessage(e)
  }
}

async function run() {
  sending.value = true
  error.value = null
  result.value = null
  try {
    const { data } = await engineApi.setGuildPermission({
      guild_id: guildId.value,
      country_id: countryId.value,
      allowed: allowed.value,
    })
    result.value = data
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
      Строительство и работа предприятий {{ result.allowed ? 'разрешены' : 'запрещены' }}
      (действие № {{ result.action_id }}).
    </VAlert>

    <VSelect
      v-model="guildId"
      :items="guilds"
      item-title="name"
      item-value="id"
      label="Гильдия"
      density="compact"
      class="mb-3"
    />
    <VSelect
      v-model="countryId"
      :items="countries"
      item-title="name"
      item-value="id"
      label="Государство"
      density="compact"
      class="mb-3"
    />
    <VSwitch
      v-model="allowed"
      label="Строительство и работа разрешены"
      color="success"
      density="compact"
      class="mb-3"
    />

    <VBtn color="primary" :loading="sending" :disabled="!guildId || !countryId" @click="run">
      Применить
    </VBtn>

    <div class="d-flex mt-4">
      <VSpacer />
      <VBtn variant="text" @click="emit('close-dialog')">
        Закрыть
      </VBtn>
    </div>
  </VCardText>
</template>
