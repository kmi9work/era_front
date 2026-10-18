<script setup>
  import axios from 'axios'
  import { ref, computed, onMounted, watch } from 'vue'
  import RelationsRow from '@/components/RelationsRow.vue'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'
  import { usePairEffects } from '@/composables/usePairEffects'

  /**
   * Блок «Отношения» раздела «Информация о стране» (ТЗ № 2, § 3.5).
   *
   * Таблица прежнего вида: два столбца «Страна» и «Отношения». Строки — все
   * государства, кроме текущего; значение — отношения пары «текущее государство ↔
   * строка». Кнопки и диалоги — те же, что были до перехода на несколько государств
   * (разметка строки в `components/RelationsRow.vue`, она общая с Дашбордом).
   */
  const props = defineProps({
    countries: {
      type: Array,
      required: true,
    },
    partnerCountry: {
      type: Object,
      default: null,
    },
  })

  const emit = defineEmits(['reload-dashboard']);

  const { currentCountry } = useCurrentCountry()

  const partner = computed(() => props.partnerCountry || currentCountry.value)

  // Активные эффекты: блокировка улучшения отношений и запрет опускать отношения
  const activeEffects = ref([])
  const effectsRef = computed(() => activeEffects.value)
  const { hasNoRelationImprovement } = usePairEffects(partner, effectsRef)

  // Уведомление о появлении торговых очков (как было раньше)
  const previousRelationPoints = ref({})
  const snackbar = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('success')

  async function loadActiveEffects() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_active_lingering_effects.json`)
      activeEffects.value = response.data.effects || []
    } catch (error) {
      console.error('Ошибка при загрузке активных эффектов:', error)
      activeEffects.value = []
    }
  }

  function reload() {
    emit('reload-dashboard')
  }

  function initializePreviousPoints() {
    props.countries.forEach(country => {
      previousRelationPoints.value[country.id] = country.relation_points || 0
    })
  }

  function checkForNewRelationPoints() {
    props.countries.forEach(country => {
      const currentPoints = country.relation_points || 0
      const previousPoints = previousRelationPoints.value[country.id] || 0

      if (currentPoints > previousPoints) {
        const diff = currentPoints - previousPoints
        showNotification(`🎉 ${country.name}: получено ${diff} торговое очко!`, 'success')
      }

      previousRelationPoints.value[country.id] = currentPoints
    })
  }

  function showNotification(message, color = 'success') {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbar.value = true
  }

  watch(
    () => props.countries,
    (newCountries) => {
      if (newCountries && newCountries.length > 0) {
        checkForNewRelationPoints()
      }
    },
    { deep: true }
  )

  onMounted(async () => {
    initializePreviousPoints()
    await loadActiveEffects()
  })

  // Смена государства — перечитываем эффекты (они относятся к паре государств)
  watch(() => partner.value?.id, async () => {
    await loadActiveEffects()
  })
</script>


<template>
  <VCard width="600">
    <VCardItem>
      <VCardTitle>Отношения</VCardTitle>
    </VCardItem>

    <!-- Уведомление о блокировке улучшения отношений -->
    <VCardText v-if="hasNoRelationImprovement">
      <VAlert
        type="warning"
        variant="tonal"
        density="compact"
        prepend-icon="ri-error-warning-line"
      >
        <strong>⚠️ Действует эффект "Поддержать экспорт"</strong><br>
        В текущем году нельзя улучшить отношения со странами-импортерами автоматически.
        Мастер может изменять отношения вручную, но при улучшении будет показано предупреждение.
      </VAlert>
    </VCardText>

    <VCardText>
      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">
              Страна
            </th>
            <th class="text-left">
              Отношения
            </th>
          </tr>
        </thead>
        <tbody>
          <RelationsRow
            v-for="country in countries"
            :key="country.id"
            :country="country"
            :partner-country="partner"
            :effects="activeEffects"
            @reload="reload"
          />
        </tbody>
      </v-table>
    </VCardText>
  </VCard>

  <!-- Snackbar для уведомлений о новых торговых очках -->
  <v-snackbar
    v-model="snackbar"
    :color="snackbarColor"
    :timeout="5000"
    location="top right"
    elevation="24"
  >
    <div class="d-flex align-center">
      <v-icon icon="mdi-gift" class="mr-3" size="large" />
      <div>
        <div class="text-subtitle-1 font-weight-bold">Новые торговые очки!</div>
        <div class="text-body-2">{{ snackbarMessage }}</div>
      </div>
    </div>

    <template v-slot:actions>
      <v-btn
        variant="text"
        @click="snackbar = false"
      >
        Закрыть
      </v-btn>
    </template>
  </v-snackbar>
</template>
