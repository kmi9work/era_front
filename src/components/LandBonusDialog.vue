<script setup>
  import { computed, ref } from 'vue'

  /**
   * Очередь вопросов мастеру о влиянии за присоединённую землю.
   *
   * Родитель вызывает `bonusDialog.value.ask(questions)` и получает промис с
   * ответами `{ posol: true, grand_prince: false, ... }` либо `null`, если мастер
   * закрыл очередь. Вопросы строит `@/composables/useLandBonus`.
   */
  const props = defineProps({
    width: {
      type: [Number, String],
      default: 460
    }
  })

  const queue = ref([])
  const answers = ref({})
  let resolveFlow = null

  const current = computed(() => queue.value[0] ?? null)
  const isOpen = computed(() => queue.value.length > 0)

  function answer(value) {
    const question = queue.value[0]
    if (!question) return

    answers.value = { ...answers.value, [question.key]: value }
    queue.value = queue.value.slice(1)

    if (queue.value.length === 0 && resolveFlow) {
      const resolve = resolveFlow
      resolveFlow = null
      resolve({ ...answers.value })
    }
  }

  function ask(questions) {
    const list = Array.isArray(questions) ? questions.filter(Boolean) : []
    if (list.length === 0) return Promise.resolve({})

    answers.value = {}
    queue.value = [...list]

    return new Promise(resolve => {
      resolveFlow = resolve
    })
  }

  function cancel() {
    queue.value = []
    answers.value = {}
    if (resolveFlow) {
      const resolve = resolveFlow
      resolveFlow = null
      resolve(null)
    }
  }

  defineExpose({ ask, cancel })
</script>

<template>
  <VDialog
    :model-value="isOpen"
    :width="props.width"
    persistent
  >
    <VCard v-if="current">
      <VCardTitle class="text-wrap">
        {{ current.title }}
      </VCardTitle>

      <VCardText>
        <div class="text-body-1">
          {{ current.question }}
        </div>
        <div
          v-if="current.hint"
          class="text-medium-emphasis text-body-2 mt-3"
        >
          {{ current.hint }}
        </div>
      </VCardText>

      <VCardActions>
        <VBtn
          variant="text"
          color="medium-emphasis"
          @click="cancel()"
        >
          Отмена
        </VBtn>
        <VSpacer />
        <VBtn
          variant="text"
          @click="answer(false)"
        >
          {{ current.rejectText || 'Мастерское действие' }}
        </VBtn>
        <VBtn
          :color="current.acceptColor || 'primary'"
          variant="tonal"
          @click="answer(true)"
        >
          {{ current.acceptText || 'Начислить' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
