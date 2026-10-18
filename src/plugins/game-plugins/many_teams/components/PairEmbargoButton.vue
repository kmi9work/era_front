<script setup>
/**
 * Кнопка эмбарго в ячейке отношений (плагин many_teams).
 *
 * country         — государство строки B: оно накладывает эмбарго; кнопка видна
 *                   только если B торгует на рынке (поле `trades_on_market` из
 *                   /countries.json — правило п. 9);
 * partnerCountry  — государство A (текущее / государство столбца): его гильдии —
 *                   цель эмбарго.
 *
 * Клик открывает модалку выбора гильдии. Состояние кнопки — есть ли эмбарго B
 * хотя бы на одну гильдию A (одна короткая выборка на ячейку).
 */
import { computed, ref, watch } from 'vue'
import { engineApi } from '../api'
import GuildEmbargoDialog from './GuildEmbargoDialog.vue'

const props = defineProps({
  country: {
    type: Object,
    required: true,
  },
  partnerCountry: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['reload'])

const dialogOpen = ref(false)
const embargoedCount = ref(0)

const visible = computed(() => !!props.country?.trades_on_market)
const targetCountry = computed(() => props.partnerCountry)

async function refreshSummary() {
  if (!visible.value || !props.country?.id || !targetCountry.value?.id) {
    embargoedCount.value = 0
    return
  }

  try {
    const { data } = await engineApi.getEmbargoes(props.country.id, targetCountry.value.id)
    embargoedCount.value = (data?.guilds || []).filter(guild => guild.embargoed).length
  } catch (e) {
    embargoedCount.value = 0
  }
}

function onChanged(count) {
  embargoedCount.value = count
  emit('reload')
}

watch(
  () => [props.country?.id, props.country?.trades_on_market, targetCountry.value?.id],
  refreshSummary,
  { immediate: true }
)
</script>

<template>
  <template v-if="visible && targetCountry">
    <IconBtn
      icon="ri-store-line"
      :color="embargoedCount > 0 ? 'error' : 'success'"
      :title="embargoedCount > 0
        ? `Эмбарго «${country.name}»: гильдий под эмбарго — ${embargoedCount}`
        : `Эмбарго «${country.name}» на гильдии «${targetCountry.name}» не наложено`"
      @click="dialogOpen = true"
    />
    <GuildEmbargoDialog
      v-model="dialogOpen"
      :imposer="country"
      :target="targetCountry"
      @changed="onChanged"
    />
  </template>
</template>
