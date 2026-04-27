<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  intelligenceDataStatus: {
    type: Object,
    required: true,
  },
})

const hasImageError = ref(false)

const imageCode = computed(() => {
  const s = props.intelligenceDataStatus || {}
  const first = s.military_recruitment ? '1' : '0'
  const second = s.scientists_recruitment ? '1' : '0'
  const third = s.teaching_staff_recruitment ? '1' : '0'
  return `${first}${second}${third}`
})

const imageUrl = computed(() => `/images/intelligence/${imageCode.value}.png`)

watch(imageCode, () => {
  hasImageError.value = false
})
</script>

<template>
  <div class="intelligence-data">
    <img
      v-if="!hasImageError"
      :src="imageUrl"
      :alt="`Разведданные ${imageCode}`"
      class="intelligence-image"
      @error="hasImageError = true"
    />
    <div v-else class="intelligence-fallback">
      Нет изображения для кода {{ imageCode }}
    </div>
  </div>
</template>

<style scoped>
.intelligence-data {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.intelligence-image {
  width: min(92vw, 1400px);
  height: min(76vh, 900px);
  object-fit: contain;
  border-radius: 16px;
}

.intelligence-fallback {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.8);
}
</style>
