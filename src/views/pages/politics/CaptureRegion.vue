<script setup>
  import axios from 'axios'
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

  async function captureRegion(region_id, country_id, how) {
    let zb = ''
    if (country_id == 1){ //rus
      let bonus = confirm("Зачислить бонус Великому князю за присоединение земли?")
      zb = bonus ? '&grand_prince_bonus=1' : ''
    }
    await axios.patch(`${import.meta.env.VITE_PROXY}/regions/${region_id}/captured_by.json?country_id=${country_id}&how=${by_war.value}${zb}`)
      .then(async (response) => {
        capture_dialog.value = false;
        emit('capture-region');
      })
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
                @click="captureRegion(ownership.id, 1)">Русь</v-btn>
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
</template>

<style>
  .v-stepper-header{
    display: none !important;
  }
</style>