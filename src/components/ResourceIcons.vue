<script setup>
import { reactive } from 'vue'

/**
 * Ресурсы одним «значком»: иконка + количество.
 *
 * Название ресурса не печатается рядом (иначе таблица расползается) — оно в
 * нативном tooltip. Если /images/resources/<icon>.png нет, показываем короткую
 * текстовую подпись вместо битой картинки.
 */
const props = defineProps({
  resources: {
    type: Array,
    default: () => [],
  },
  size: {
    type: Number,
    default: 18,
  },
})

const failed = reactive({})

const formatNumber = (value) => Number(value || 0).toLocaleString('ru-RU')

const iconFile = (resource) => resource?.icon || resource?.identificator

const fail = (resource) => {
  failed[resource.identificator] = true
}
</script>

<template>
  <span
    v-if="props.resources && props.resources.length"
    class="resource-icons"
  >
    <span
      v-for="resource in props.resources"
      :key="resource.identificator"
      class="resource-icons__item"
      :title="`${resource.name}: ${formatNumber(resource.count)}`"
    >
      <img
        v-if="!failed[resource.identificator]"
        :src="`/images/resources/${iconFile(resource)}.png`"
        :alt="resource.name"
        :width="props.size"
        :height="props.size"
        class="resource-icons__image"
        @error="fail(resource)"
      >
      <span
        v-else
        class="resource-icons__fallback"
      >{{ resource.name }}</span>
      <span class="resource-icons__count">{{ formatNumber(resource.count) }}</span>
    </span>
  </span>
  <span
    v-else
    class="text-medium-emphasis"
  >—</span>
</template>

<style scoped>
.resource-icons {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
}

.resource-icons__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.resource-icons__image {
  flex-shrink: 0;
  object-fit: contain;
}

.resource-icons__fallback {
  font-size: 11px;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface-variant));
}

.resource-icons__count {
  font-size: 12px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
</style>
