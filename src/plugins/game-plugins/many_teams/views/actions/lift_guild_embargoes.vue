<script setup>
/**
 * Действие Великого князя: снять все эмбарго с гильдии (п. 10).
 *
 * Технология «Заморская торговля» — условие правила. Если в текущем государстве
 * она не открыта, экран выводит предупреждение «действие запрещено», но само
 * действие не блокирует: кнопка остаётся доступной.
 */
import { computed, onBeforeMount, ref, watch } from 'vue'
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
const availability = ref(null)
const error = ref(null)
const result = ref(null)
const sending = ref(false)

const selected = computed(() => guilds.value.find(guild => guild.id === guildId.value))
// Предупреждаем только по явному ответу бэкенда «технология закрыта»: если статус
// не пришёл, пугать мастера нечем — действие всё равно не блокируется.
const technologyClosed = computed(() => availability.value?.is_open === false)

async function loadGuilds() {
  try {
    const { data } = await engineApi.getIntelligenceTargets()
    guilds.value = data.guilds || []
    guildId.value = guilds.value[0]?.id || null
  } catch (e) {
    error.value = errorMessage(e)
  }
}

async function loadAvailability() {
  try {
    const { data } = await engineApi.getLiftAllAvailability()
    availability.value = data
  } catch {
    availability.value = null
  }
}

async function load() {
  error.value = null
  await Promise.all([loadGuilds(), loadAvailability()])
}

async function run() {
  sending.value = true
  error.value = null
  result.value = null
  try {
    const { data } = await engineApi.liftAllEmbargoes({ guild_id: guildId.value })
    result.value = data
    await loadAvailability()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    sending.value = false
  }
}

onBeforeMount(load)

// Диалог не пересоздаётся при повторном открытии: статус технологии перечитываем
// каждый раз (государство могло смениться), список гильдий — только если пуст.
watch(() => props.dialogOpen, (isOpen) => {
  if (!isOpen) return

  loadAvailability()
  if (!guilds.value.length) loadGuilds()
})
</script>

<template>
  <VCardText>
    <VAlert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
      {{ error }}
    </VAlert>
    <VAlert v-else-if="result" type="success" variant="tonal" density="compact" class="mb-3">
      Снято эмбарго: {{ result.lifted_country_ids?.length || 0 }}.
      <template v-if="result.overseas_trade_open === false">
        Действие выполнено без технологии «Заморская торговля».
      </template>
    </VAlert>

    <VAlert
      v-if="technologyClosed"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      Действие запрещено: в государстве «{{ availability.country_name }}» не открыта
      технология «{{ availability.technology_name }}».
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
