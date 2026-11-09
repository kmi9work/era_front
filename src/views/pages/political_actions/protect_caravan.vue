<script setup>
  import axios from 'axios'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'

  const props = defineProps({
    noble_job: {
      type: Object,
      required: true,
    },
    action: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['close-dialog']);

  const { currentCountryId, loadCurrentCountry } = useCurrentCountry()

  const guilds = ref([]);
  const armies = ref([]);
  const effects = ref([]);
  const guild_id = ref(0);
  const army_id = ref(0);

  /**
   * «Защита каравана»: мастер выбирает гильдию, чей караван защищают, и АРМИЮ
   * ГОСУДАРСТВА, которой Воевода за это не сможет распорядиться (ограничение на
   * движение живёт в клиенте мастеров как предупреждение).
   *
   * Выбрать можно любую армию государства (решение заказчика). Армии, уже
   * занятые другими действиями (передана соседу, охраняет караван, «Личный
   * визит», «государевы подводы»), отмечаются в списке — но выбрать их можно:
   * это предупреждение, а не запрет.
   */

  // ── Сопоставление целей длительных эффектов с армией ────────────────────
  const refOf = (value) => {
    if (value === null || value === undefined) return { id: null, name: null }
    if (typeof value === 'number') return { id: value, name: null }
    if (typeof value === 'string') return { id: null, name: value }
    const id = Number(value.id)
    return {
      id: Number.isFinite(id) ? id : null,
      name: typeof value.name === 'string' ? value.name : null,
    }
  }

  const matchesRef = (targets, ref) => (targets || []).some((target) => {
    const t = refOf(target)
    return (t.id !== null && ref.id !== null && t.id === ref.id)
      || (t.name && ref.name && t.name === ref.name)
  })

  const armyTargetRef = (army) => ({ id: army.id, name: army.name })
  const ownerTargetRef = (army) => ({ id: army.owner?.id ?? null, name: army.owner?.name ?? null })
  const countryTargetRef = (army) => ({ id: army.country_id ?? null, name: army.country?.name ?? null })

  /** Почему армия уже «занята»: строка для отметки в списке или пусто. */
  function busyReason(army) {
    const reasons = []
    const additional = army.params?.additional
    if (additional?.active) {
      reasons.push(additional.leased_to ? `передана: ${additional.leased_to}` : 'передана соседу')
    }

    ;(effects.value || []).forEach((effect) => {
      const targets = effect.targets
      if (effect.effect === 'single_army_complete_block' && matchesRef(targets, armyTargetRef(army))) {
        reasons.push('уже охраняет караван')
      }
      if (effect.effect === 'army_leased' && matchesRef(targets, armyTargetRef(army))) {
        reasons.push('передана соседу')
      }
      if (effect.effect === 'no_army_movement' && matchesRef(targets, ownerTargetRef(army))) {
        reasons.push('«Личный визит»')
      }
      if (effect.effect === 'all_armies_blocked' && matchesRef(targets, countryTargetRef(army))) {
        reasons.push('«государевы подводы»')
      }
    })

    return [...new Set(reasons)].join('; ')
  }

  /** Армии текущего государства (если сервер не отдал country_id — все). */
  const armyOptions = computed(() => {
    const countryId = currentCountryId.value
    const own = countryId
      ? armies.value.filter((army) => army.country_id === countryId)
      : armies.value
    const list = own.length > 0 ? own : armies.value
    return list.map((army) => {
      const busy = busyReason(army)
      return {
        ...army,
        busy,
        title: busy ? `${army.name} — занята: ${busy}` : army.name,
      }
    })
  })

  const selectedArmy = computed(() =>
    armyOptions.value.find((army) => army.id === army_id.value) || null)

  onBeforeMount(async () => {
    await loadCurrentCountry()
    await Promise.all([
      axios.get(`${import.meta.env.VITE_PROXY}/guilds.json`).then(response => {
        guilds.value = response.data || [];
        if (guilds.value.length > 0) {
          guild_id.value = guilds.value[0].id;
        }
      }),
      axios.get(`${import.meta.env.VITE_PROXY}/armies.json`).then(response => {
        armies.value = response.data || [];
      }),
      axios.get(`${import.meta.env.VITE_PROXY}/game_parameters/get_active_lingering_effects.json`)
        .then(response => {
          effects.value = response.data.effects || []
        })
        .catch(() => {
          // Эффекты нужны только для отметок — без них диалог остаётся рабочим.
          effects.value = []
        }),
    ])
    if (armyOptions.value.length > 0) {
      army_id.value = armyOptions.value[0].id
    }
  })

  async function runAction(noble_job_id, action_id){
    // army_id отправляем только при выборе: «0» сервер понял бы как id армии
    // и ответил отказом, которого диалог не покажет.
    const params = {guild_id: guild_id.value}
    if (army_id.value) {
      params.army_id = army_id.value
    }
    await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
        political_action_type_id: action_id,
        job_id: noble_job_id,
        params: params
      })
    emit('close-dialog')
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item
      subtitle="Эффект"
    >Караваны выбранной гильдии защищены от ограбления. Выбранная армия государства не может перемещаться в этом году.</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Параметры</v-list-subheader>

    <v-list-item>
      <v-select
        label="Выберите гильдию"
        :items="guilds"
        v-model="guild_id"
        item-title="name"
        item-value="id"
      ></v-select>
    </v-list-item>

    <v-list-item>
      <v-select
        label="Армия, которая защищает караван"
        :items="armyOptions"
        v-model="army_id"
        item-title="title"
        item-value="id"
        no-data-text="У государства нет армий"
      ></v-select>
    </v-list-item>

    <v-list-item v-if="selectedArmy && selectedArmy.busy">
      <v-alert type="warning" variant="tonal" density="compact" class="w-100">
        Армия уже занята: {{ selectedArmy.busy }}. Выбрать её можно, но ограничения сложатся.
      </v-alert>
    </v-list-item>
  </v-list>
  <v-card-text>
    <v-btn text="Выполнить" variant="tonal" color="primary" @click="runAction(noble_job.id, action.id)"></v-btn>
  </v-card-text>
</template>
