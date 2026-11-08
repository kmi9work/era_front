<script setup>
  import axios from 'axios'
  import AlliancesDialog from '@/components/AlliancesDialog.vue'

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

  const countries = ref([]);
  const selectedCountry = ref(null);
  const showAlliancesDialog = ref(false);
  
  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/countries.json?vyatka_free=1`) 
      .then(response => {
        countries.value = response.data;
      })
  })

  function openAlliancesDialog(country) {
    selectedCountry.value = country;
    showAlliancesDialog.value = true;
  }

  function onAllianceCreated() {
    // Можно показать уведомление об успехе
    emit('close-dialog');
  }
</script>

<template>
  <v-list>
    <v-list-subheader>Описание</v-list-subheader>

    <v-list-item
      subtitle="Эффект"
    >Заключается союз между Вяткой и выбранной страной. Выберите страну из списка для управления союзами.</v-list-item>

    <v-list-item
      subtitle="Стоимость"
    >{{action.cost}}</v-list-item>

    <v-divider></v-divider>

    <v-list-subheader>Выберите страну</v-list-subheader>

    <v-list-item
      v-for="country in countries"
      :key="country.id"
      @click="openAlliancesDialog(country)"
      class="cursor-pointer"
    >
      <template v-slot:prepend>
        <v-icon icon="ri-group-line" color="primary"></v-icon>
      </template>
      <v-list-item-title>{{ country.name }}</v-list-item-title>
      <v-list-item-subtitle>Отношения: {{ country.relations || 0 }}</v-list-item-subtitle>
      <template v-slot:append>
        <v-icon icon="ri-arrow-right-s-line"></v-icon>
      </template>
    </v-list-item>

    <v-alert v-if="countries.length === 0" type="info" variant="tonal" class="ma-4">
      Нет доступных стран для заключения союза
    </v-alert>
  </v-list>

  <!-- Используем компонент AlliancesDialog -->
  <AlliancesDialog
    v-model="showAlliancesDialog"
    :country="selectedCountry"
    @alliance-created="onAllianceCreated"
  />
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>

