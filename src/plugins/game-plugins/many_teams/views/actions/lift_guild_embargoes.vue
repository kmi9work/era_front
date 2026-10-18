<script setup>
/**
 * Действие Великого князя: снять все эмбарго с гильдии (п. 10).
 * Доступно при открытой технологии «Заморская торговля» — проверяет бэкенд.
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

const guilds = ref([])
const guildId = ref(null)
const error = ref(null)
const result = ref(null)
const sending = ref(false)

const selected = computed(() => guilds.value.find(guild => guild.id === guildId.value))

async function load() {
  try {
    const { data } = await engineApi.getIntelligenceTargets()
    guilds.value = data.guilds || []
    guildId.value = guilds.value[0]?.id || null
  } catch (e) {
    error.value = errorMessage(e)
  }
}

async function run() {
  sending.value = true
  error.value = null
  result.value = null
  try {
    const { data } = await engineApi.liftAllEmbargoes({ guild_id: guildId.value })
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
      Снято эмбарго: {{ result.lifted_country_ids?.length || 0 }}.
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

    <div class="text-body-2 mb-3">
      Будут сняты все эмбарго, наложенные любыми государствами на гильдию
      «{{ selected?.name || '—' }}». Требуется технология «Заморская торговля».
    </div>

    <VBtn color="primary" :loading="sending" :disabled="!guildId" @click="run">
      Снять все эмбарго
    </VBtn>

    <div class="d-flex mt-4">
      <VSpacer />
      <VBtn variant="text" @click="emit('close-dialog')">
        Закрыть
      </VBtn>
    </div>
  </VCardText>
</template>
