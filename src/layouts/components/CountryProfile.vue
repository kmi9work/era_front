<script setup>
  import { computed, onBeforeMount } from 'vue'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'

  // Текущее государство: тот, «за кого» сейчас работают мастера (ТЗ № 2, § 1.1).
  // Признака «играбельное государство» нет — в списке все государства.
  // Когда мастера работают за одну страну, бейдж просто показывает её.
  const {
    currentCountry,
    countries,
    isLoading,
    loadCountries,
    loadCurrentCountry,
    setCurrentCountry,
  } = useCurrentCountry()

  onBeforeMount(async () => {
    await loadCountries()
    await loadCurrentCountry()
  })

  const flagSrc = (country) => {
    if (!country?.flag_image_name) return null
    return `/images/countries/${country.flag_image_name}.png`
  }

  const currentFlag = computed(() => flagSrc(currentCountry.value))
  const currentLabel = computed(() => currentCountry.value?.short_name
    || currentCountry.value?.name
    || 'Государство не выбрано')

  async function chooseCountry(countryId) {
    if (countryId === currentCountry.value?.id) return
    await setCurrentCountry(countryId)
  }
</script>

<template>
  <VBadge
    :color="currentCountry ? 'success' : 'error'"
    location="bottom right"
    offset-x="3"
    offset-y="3"
    dot
    bordered
  >
    <VAvatar
      class="cursor-pointer"
      color="primary"
      size="36"
      variant="tonal"
    >
      <img
        v-if="currentFlag"
        :src="currentFlag"
        :alt="currentLabel"
        class="country-flag"
      >
      <VIcon
        v-else
        icon="ri-flag-2-line"
        size="20"
      />

      <!-- SECTION Меню выбора государства -->
      <VMenu
        activator="parent"
        width="320"
        location="bottom end"
        offset="14px"
      >
        <VList>
          <VListSubheader>
            Текущее государство: {{ currentLabel }}
          </VListSubheader>

          <VDivider class="mb-1" />

          <VListItem
            v-for="country in countries"
            :key="country.id"
            :active="country.id === currentCountry?.id"
            :disabled="isLoading"
            @click="chooseCountry(country.id)"
          >
            <template #prepend>
              <img
                v-if="country.flag_image_name"
                :src="flagSrc(country)"
                :alt="country.name"
                class="country-flag me-2"
              >
              <VIcon
                v-else
                icon="ri-flag-2-line"
                class="me-2"
              />
            </template>
            <VListItemTitle>{{ country.name }}</VListItemTitle>
            <VListItemSubtitle v-if="country.short_name && country.short_name !== country.name">
              {{ country.short_name }}
            </VListItemSubtitle>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>

<style scoped>
.country-flag {
  block-size: 22px;
  inline-size: 30px;
  border-radius: 3px;
  object-fit: cover;
}
</style>
