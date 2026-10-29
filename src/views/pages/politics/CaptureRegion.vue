<script setup>
  import axios from 'axios'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'
  import { awardedText, landBonusParams, landBonusQuestions } from '@/composables/useLandBonus'
  import LandBonusDialog from '@/components/LandBonusDialog.vue'

  // Передача региона государству (ТЗ № 2, § 4 п. 5): быстрая кнопка передаёт регион
  // ТЕКУЩЕМУ государству (прежде — жёстко «Руси»).
  //
  // Влияние за землю (Посольский дьяк +7, Князь +5 за КАЖДУЮ землю) начисляется по
  // решению мастера и отдельно по каждой должности: два вопроса «начислить бонус»
  // или «мастерское действие». Если регион уходит другому государству, перед ними
  // задаются два вопроса о снятии бонуса у прежнего государства — земля перешла от
  // одних игроков к другим.
  const { currentCountry, currentCountryId, loadCurrentCountry } = useCurrentCountry()

  const props = defineProps({
    countries: {
      type: Array,
      required: true
    },
    ownership: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      required: true
    }
  })
  const warPeaceSelect = [
    {
      name: 'Войной',
      key: 1
    },
    {
      name: 'Миром',
      key: 0
    },
  ]
  const emit = defineEmits(['capture-region']);

  const capture_dialog = ref(false);
  const by_war = ref(0);
  const capture_stepper = ref(0);
  const bonusDialog = ref(null);
  const capture_busy = ref(false);

  onBeforeMount(() => {
    loadCurrentCountry()
  })

  // Государство, которому регион принадлежит сейчас (может отличаться от текущего).
  const sourceCountryId = computed(() => {
    const ownership = props.ownership || {}
    return ownership.country?.id ?? ownership.country_id ?? null
  })

  function countryById(id) {
    if (id === null || id === undefined) return null
    return (props.countries || []).find(country => Number(country.id) === Number(id)) || null
  }

  async function captureRegion(region_id, country_id, how) {
    if (capture_busy.value) return

    const targetId = Number(country_id)
    const sourceId = sourceCountryId.value === null ? null : Number(sourceCountryId.value)

    // Вопросы мастеру: снятие у прежнего государства, начисление получателю.
    // Передача «самому себе» ничего не меняет — вопросов нет.
    let answers = {}
    if (sourceId === null || sourceId !== targetId) {
      const questions = landBonusQuestions({
        source: countryById(sourceId),
        target: countryById(targetId),
        landLabel: props.ownership?.name ? `земли «${props.ownership.name}»` : 'земли'
      })
      const result = await bonusDialog.value?.ask(questions)
      if (result === null) return
      answers = result || {}
    }

    capture_busy.value = true
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_PROXY}/regions/${region_id}/captured_by.json`,
        null,
        {
          params: {
            country_id: targetId,
            how: how ?? by_war.value,
            ...landBonusParams(answers)
          }
        }
      )
      capture_dialog.value = false;
      emit('capture-region');
      const report = awardedText(response?.data?.awarded)
      if (report) alert(`Влияние за землю: ${report}`)
    } finally {
      capture_busy.value = false
    }
  };
</script>
<template>
  <VBtn @click="capture_dialog = true">{{title}}</VBtn>
  <VDialog
    v-model="capture_dialog"
    width="auto"
  >
    <VCard
      width="300"
    >
      <v-stepper 
        :items="['Войной/миром', 'Куда?']" 
        v-model="capture_stepper"
        next-text="Куда?"
        prev-text="Войной/миром?"
      >
        <template v-slot:item.1>
          <v-card title="Войной/миром" height="200">
            <v-radio-group v-model="by_war" @change="capture_stepper = 2">
              <v-radio 
                v-for="item in warPeaceSelect"
                :label="item.name"
                :value="item.key" 
              />
            </v-radio-group>
          </v-card>
        </template>

        <template v-slot:item.2>
          <v-card height="200" class="overflow-y-auto">
            <template v-slot:title>
              <v-btn 
                class="text-none"
                color="medium-emphasis"
                min-width="92"
                variant="outlined"
                rounded
                @click="captureRegion(ownership.id, currentCountryId)">
                {{ currentCountry?.short_name || currentCountry?.name || 'Текущее государство' }}
              </v-btn>
            </template>
            <VList>
              <VListItem
                v-for="(country, i) in countries"
                :key="i"
                :value="country.id"
                color="primary"
                rounded="xl"
                @click="captureRegion(ownership.id, country.id)"
              >
                <VListItemTitle v-text="`${country.name}`"></VListItemTitle>
              </VListItem>
            </VList>
          </v-card>
        </template>
      </v-stepper>
      <template v-slot:actions>
        <VBtn
          class="ms-auto"
          text="Отмена"
          @click="capture_dialog = false"
        ></VBtn>
      </template>
    </VCard>
  </VDialog>

  <!-- Вопросы мастеру по влиянию за землю: Посольский дьяк и Князь отдельно. -->
  <LandBonusDialog ref="bonusDialog" />
</template>

<style>
  .v-stepper-header{
    display: none !important;
  }
</style>