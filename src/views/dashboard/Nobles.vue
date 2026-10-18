<script setup>
  import axios from 'axios'
  import { ref, computed, watch } from 'vue'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'

  /**
   * Знать текущего государства (ТЗ № 2, § 3.3, § 3.4, § 3.7).
   *
   * Строки таблицы — игроки (влияние, доход и правки адресуются игроку, не должности).
   * Ниже отдельным списком показаны должности совета этого государства: незанятая
   * должность отмечается серой плашкой «должность не занята».
   */
  const props = defineProps({
    nobles: {
      type: Array,
      required: true,
    },
    country: {
      type: Object,
      default: null,
    },
  })

  const emit = defineEmits(['reload-dashboard']);

  const { currentCountry, currentCountryId } = useCurrentCountry()

  const country = computed(() => props.country || currentCountry.value)
  const countryName = computed(() => country.value?.name || 'государство не выбрано')

  const councilJobs = ref([])
  const incomeByPlayerId = ref({})
  const incomeLoadingByPlayerId = ref({})
  const incomeErrorByPlayerId = ref({})

  const formatNumber = (val) => {
    if (val === null || val === undefined || val === '') return '—'
    try {
      return new Intl.NumberFormat('ru-RU').format(Number(val))
    } catch {
      return String(val)
    }
  }

  async function loadCouncilJobs() {
    if (!currentCountryId.value) {
      councilJobs.value = []
      return
    }
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_PROXY}/jobs.json?nobles=1&country_id=${currentCountryId.value}`,
      )
      councilJobs.value = Array.isArray(data) ? data : []
    } catch (e) {
      console.error('Не удалось загрузить должности совета:', e)
      councilJobs.value = []
    }
  }

  const occupiedJobs = computed(() => councilJobs.value.filter(job => (job.players || []).length > 0))
  const vacantJobs = computed(() => councilJobs.value.filter(job => (job.players || []).length === 0))

  const jobHolderNames = (job) => (job.players || []).map(player => player.name).join(', ')

  const ensureIncomeLoaded = async (player) => {
    if (!player?.id) return
    if (incomeByPlayerId.value[player.id]) return

    incomeLoadingByPlayerId.value[player.id] = true
    incomeErrorByPlayerId.value[player.id] = null
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/players/${player.id}/income_breakdown.json?country_id=${currentCountryId.value}`)
      incomeByPlayerId.value[player.id] = data
    } catch (e) {
      incomeErrorByPlayerId.value[player.id] =
        e?.response?.data?.error || e?.message || 'Ошибка загрузки дохода'
    } finally {
      incomeLoadingByPlayerId.value[player.id] = false
    }
  }

  const refreshIncome = async (player) => {
    if (!player?.id) return
    incomeLoadingByPlayerId.value[player.id] = true
    incomeErrorByPlayerId.value[player.id] = null
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_PROXY}/players/${player.id}/income_breakdown.json?country_id=${currentCountryId.value}`)
      incomeByPlayerId.value[player.id] = data
    } catch (e) {
      incomeErrorByPlayerId.value[player.id] =
        e?.response?.data?.error || e?.message || 'Ошибка загрузки дохода'
    } finally {
      incomeLoadingByPlayerId.value[player.id] = false
    }
  }

  const formatSettlementIncomeLine = (s) => {
    const markets = Number(s?.markets_income ?? 0)
    const stGe = Number(s?.st_george_bonus ?? 0)
    const total = Number(s?.total ?? 0)

    const marketsPart = `Рынки +${formatNumber(markets)}`
    const yPart = stGe > 0 ? `, Юрьев день +${formatNumber(stGe)}` : ''
    return `${s?.name || '—'} (${marketsPart}${yPart}) - ${formatNumber(total)}`
  }

  const addIncomeItem = async (player) => {
    if (!player?.id) return
    const newValueRaw = prompt("Значение (может быть отрицательным)")
    if (newValueRaw === null) return
    const value = Number(newValueRaw)
    if (!Number.isFinite(value) || value === 0) {
      alert('Введите корректное число (не 0)')
      return
    }
    const comment = prompt("Комментарий") || "Ручная правка"
    try {
      await axios.patch(`${import.meta.env.VITE_PROXY}/players/${player.id}/add_income.json`, {
        value: Math.trunc(value),
        comment,
        country_id: currentCountryId.value,
      })
      await refreshIncome(player)
      emit('reload-dashboard')
    } catch (e) {
      alert('Не удалось добавить правку дохода')
    }
  }

  const removeIncomeItem = async (player, itemId) => {
    if (!player?.id) return
    const fl = confirm("Точно удалить?")
    if (!fl) return
    try {
      await axios.delete(`${import.meta.env.VITE_PROXY}/income_items/${itemId}.json`)
      await refreshIncome(player)
      emit('reload-dashboard')
    } catch (e) {
      alert('Не удалось удалить правку дохода')
    }
  }

  async function addItem(player_id){
    let new_value = prompt("Новое значение");
    if (new_value === null) return
    let comment = prompt("Комментарий");
    if (comment === null) return
    axios.patch(`${import.meta.env.VITE_PROXY}/players/${player_id}/add_influence.json`, {value: new_value, comment: comment, country_id: currentCountryId.value})
      .then(() => {
        emit('reload-dashboard');
      })
  }

  async function removeItem(item_id){
    let fl = confirm("Точно удалить?");
    if (fl){
      axios.delete(`${import.meta.env.VITE_PROXY}/influence_items/${item_id}.json`)
        .then(() => {
          emit('reload-dashboard');
        })
    }
  }

  // Флаг получения дохода живёт на игроке (`players.params['income_taken']`).
  // Доход считается только по владениям текущего государства (§ 3.6, § 3.7).
  async function takeIncome(params, player_id){
    params['income_taken'] = !params['income_taken']
    axios.patch(`${import.meta.env.VITE_PROXY}/players/${player_id}.json`, {params: params})
      .then(() => {
        emit('reload-dashboard');
      })
  }

  // Должности совета грузим, как только известно государство: на первом рендере
  // родитель ещё не успевает его получить (его onBeforeMount асинхронный), поэтому
  // следим за currentCountryId, а не за моментом монтирования (§ 3.3).
  watch(currentCountryId, () => {
    incomeByPlayerId.value = {}
    loadCouncilJobs()
  }, { immediate: true })

</script>


<template>
  <VCard max-width="600">
    <VCardItem>
      <VCardTitle>Знать: {{ countryName }}</VCardTitle>
    </VCardItem>

    <VCardText>
      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">
              Игрок
            </th>
            <th class="text-left">
              Должности
            </th>
            <th class="text-left">
              Доход
            </th>
            <th class="text-left">
              Влияние
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="player in nobles"
            :key="player.id"
          >
            <td>
              <v-btn
                variant="text"
                class="text-none px-0"
                color="medium-emphasis"
                prepend-icon="ri-arrow-down-double-fill"
                width="150"
                style="justify-content: start;"
                @click="ensureIncomeLoaded(player)"
              >
                {{ player.name }}
                <v-menu activator="parent">
                  <VList style="min-width: 520px;">

                    <VListItem v-if="incomeLoadingByPlayerId[player.id]">
                      <VListItemTitle>Загрузка...</VListItemTitle>
                    </VListItem>

                    <VListItem v-else-if="incomeErrorByPlayerId[player.id]">
                      <VListItemTitle>
                        {{ incomeErrorByPlayerId[player.id] }}
                      </VListItemTitle>
                    </VListItem>

                    <template v-else-if="incomeByPlayerId[player.id]">
                      <VListItem
                        v-for="s in (incomeByPlayerId[player.id].settlements || [])"
                        :key="s.settlement_id"
                      >
                        <VListItemTitle>
                          {{ formatSettlementIncomeLine(s) }}
                        </VListItemTitle>
                      </VListItem>

                      <VListItem v-if="incomeByPlayerId[player.id].components?.trade_bonus > 0">
                        <VListItemTitle>
                          Торговая надбавка | {{ formatNumber(incomeByPlayerId[player.id].components.trade_bonus) }}
                        </VListItemTitle>
                      </VListItem>

                      <VListItem v-if="incomeByPlayerId[player.id].components?.metropolitan_bonus > 0">
                        <VListItemTitle>
                          Доход от церквей | {{ formatNumber(incomeByPlayerId[player.id].components.metropolitan_bonus) }}
                        </VListItemTitle>
                      </VListItem>

                      <VListItem v-if="incomeByPlayerId[player.id].components?.vassal_income > 0">
                        <VListItemTitle>
                          Доход от вассалов | {{ formatNumber(incomeByPlayerId[player.id].components.vassal_income) }}
                        </VListItemTitle>
                      </VListItem>

                      <VListItem
                        v-for="ii in (incomeByPlayerId[player.id].income_items || [])"
                        :key="ii.id"
                      >
                        <VListItemTitle>
                          {{ ii.comment || '—' }} | {{ ii.value }} <span v-if="ii.year">Год: {{ ii.year }}</span>
                          <IconBtn
                            icon="ri-delete-bin-line"
                            class="me-1"
                            @click="removeIncomeItem(player, ii.id)"
                          />
                        </VListItemTitle>
                      </VListItem>

                      <VListItem key="_income_add">
                        <VListItemTitle>
                          <v-btn variant="text" @click="addIncomeItem(player)">
                            Добавить ручную правку
                          </v-btn>
                        </VListItemTitle>
                      </VListItem>
                    </template>
                  </VList>
                </v-menu>
              </v-btn>
            </td>
            <td>{{ (player.jobs || []).map((j) => j.name).join(", ") }}</td>
            <td>
              <VBtn
                :color="player.params?.['income_taken'] ? 'success' : 'error'"
                @click="takeIncome(player.params, player.id)"
              >
                {{ player.income }}
              </VBtn>
            </td>
            <td>
              <v-btn
                class="text-none"
                color="medium-emphasis"
                variant="text"
                rounded
                prepend-icon="ri-arrow-down-double-fill"
                min-width="50"
                style="justify-content: start;"
              >
                {{ player.influence }}
                <v-menu activator="parent">
                  <VList>
                    <VListItem
                      v-for="(item, i) in player.influence_items"
                      :key="i"
                    >
                      <VListItemTitle>
                        {{item.comment}} | {{item.value}} <span v-if="item.year">Год: {{item.year}}</span>
                        <IconBtn
                          icon="ri-delete-bin-line"
                          class="me-1"
                          @click="removeItem(item.id)"
                        />
                      </VListItemTitle>
                    </VListItem>
                    <VListItem key="_0">
                      <VListItemTitle>
                        <v-btn variant="text" @click="addItem(player.id)">
                          Добавить ручную правку
                        </v-btn>
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </v-menu>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>
