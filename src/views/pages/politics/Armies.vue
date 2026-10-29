<script setup>
  import axios from 'axios'
  import Army from '@/views/pages/politics/Army.vue'
  import ArmyForm from '@/views/pages/politics/ArmyForm.vue'
  import { computed, onBeforeMount, ref, watch } from 'vue'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'

  /**
   * Раздел «Сражения» (ТЗ № 2, § 6).
   *
   * Вкладки делятся по государству, а не по типу владельца:
   *  - первая вкладка (ключ `own`) — название текущего государства; в ней армии,
   *    принадлежащие самому государству, и армии его знати (`Army.for_country`);
   *  - вкладка «Зарубеж» (ключ `foreign`) — армии всех прочих государств
   *    (`Army.foreign_to`).
   *
   * Государство армии приходит с бэкенда полем `country_id` (выводится из владельца),
   * поэтому состав вкладок не зависит от `owner_type`. Внутри строки армии сведения
   * о владельце (страна или игрок) сохраняются, а `Army.vue` получает `:foreign`
   * (истина — армия принадлежит чужому государству). Механики армий (найм, оплата,
   * перемещение, атака, разведка) не изменяются.
   */
  const { currentCountry, currentCountryId, reloadToken, loadCurrentCountry } = useCurrentCountry()

  // Первая вкладка названа текущим государством, вторая — общая «Зарубеж».
  const tabItems = computed(() => [
    {
      name: currentCountry.value?.name || 'Своё государство',
      key: 'own'
    },
    {
      name: 'Зарубеж',
      key: 'foreign'
    }
  ])

  const navigationTab = ref('own')
  const ownArmies = ref([]) // Армии текущего государства и армии его знати
  const foreignArmies = ref([]) // Армии всех прочих государств
  const owners = ref([])
  const selected_owners = ref([])
  const settlements = ref([])
  const troop_types = ref([])
  // Владельцы-государства для формы: только текущее государство
  const countries = ref([])
  // Владельцы-игроки для формы: только знать текущего государства
  const nobles = ref([])
  const editingArmy = ref(null)

  // Все загруженные армии: нужны вкладкам и списку целей в атаке/переходе (Army.vue).
  const armies = computed(() => [...ownArmies.value, ...foreignArmies.value])

  // Фильтр по игроку/стране строится из загруженных армий (обоих государственных разрезов).
  const filteredArmies = computed(() => {
    if (selected_owners.value.length === 0) {
      return armies.value
    }

    return armies.value.filter(army =>
      selected_owners.value.includes(`${army.owner?.owner_type}-${army.owner?.id}`)
    )
  })

  // Армии вкладки: `own` — текущее государство и его знать, `foreign` — остальные.
  const armiesByNav = (type) => {
    return filteredArmies.value.filter(army =>
      type === 'own' ? army.country_id === currentCountryId.value : army.country_id !== currentCountryId.value
    )
  }

  function onlyUnique(value, index, array) {
    return array.findIndex(item => item.id === value.id && item.owner_type === value.owner_type) === index
  }

  async function updateArmies() {
    try {
      // Деление по государству на бэкенде: `?foreign=0` — армии текущего государства
      // и его знати, `?foreign=1` — армии всех остальных государств.
      const [ownResponse, foreignResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_PROXY}/armies.json?foreign=0`),
        axios.get(`${import.meta.env.VITE_PROXY}/armies.json?foreign=1`)
      ])

      ownArmies.value = Array.isArray(ownResponse.data) ? ownResponse.data : []
      foreignArmies.value = Array.isArray(foreignResponse.data) ? foreignResponse.data : []
      owners.value = [...ownArmies.value, ...foreignArmies.value]
        .map(army => army.owner)
        .filter(Boolean)
        .filter(onlyUnique)
    } catch (error) {
      console.error('Ошибка при загрузке армий:', error)
    }
  }

  async function loadOwners() {
    try {
      // Государство — только текущее.
      countries.value = currentCountry.value ? [currentCountry.value] : []

      // Игроки — только знать текущего государства (2 — Знать).
      const countryId = currentCountryId.value
      const url = countryId
        ? `${import.meta.env.VITE_PROXY}/players.json?country_id=${countryId}&player_type_id=2`
        : `${import.meta.env.VITE_PROXY}/players.json?player_type_id=2`
      const playersResponse = await axios.get(url)

      nobles.value = (Array.isArray(playersResponse.data) ? playersResponse.data : [])
        .filter(player => player.player_type?.id == 2)
    } catch (error) {
      console.error('Ошибка при загрузке владельцев:', error)
    }
  }

  onBeforeMount(async () => {
    // Текущее государство — до запросов, чтобы вкладки и владельцы были корректны.
    await loadCurrentCountry()
    await Promise.all([
      updateArmies(),
      loadOwners(),
      axios.get(`${import.meta.env.VITE_PROXY}/settlements.json?all=1`)
        .then(response => {
          settlements.value = response.data
        }),
      axios.get(`${import.meta.env.VITE_PROXY}/troop_types.json`)
        .then(response => {
          troop_types.value = response.data
        })
    ])
  })

  // Смена государства: перечитываем армии и владельцев, сбрасываем выбранные фильтры.
  watch(reloadToken, () => {
    selected_owners.value = []
    updateArmies()
    loadOwners()
  })
</script>

<template>
  <div>
    <v-autocomplete
      v-model="selected_owners"
      :items="owners"
      label="Фильтр по игроку/стране"
      item-title="name"
      :item-value="item => `${item.owner_type}-${item.id}`"
      multiple
      clearable
      persistent-hint
    ></v-autocomplete>

    <VCard>
      <VTabs v-model="navigationTab">
        <VTab
          v-for="item in tabItems"
          :key="item.key"
          :value="item.key"
        >
          {{ item.name }}
        </VTab>
      </VTabs>

      <VWindow v-model="navigationTab" :touch="false">
        <VWindowItem
          v-for="(item) in tabItems"
          :key="item.key"
          :value="item.key"
        >
          <VCardText class="overflow-x-auto">
            <VRow>
              <template v-if="item.key == 'own'">
                <div class="d-flex flex-row">
                  <div style="padding: 20px">
                    <ArmyForm
                      title="Создать армию"
                      :settlements="settlements"
                      :nobles="nobles"
                      :countries="countries"
                      @army-created="updateArmies"
                    />
                    <ArmyForm
                      v-if="editingArmy"
                      title="Редактировать армию"
                      :settlements="settlements"
                      :nobles="nobles"
                      :countries="countries"
                      :army="editingArmy"
                      @army-updated="updateArmies"
                      @close="editingArmy = null"
                    />
                  </div>
                  <v-card flat>
                    <v-card-text>
                      <VRow>
                        <VCol
                          v-for="(army, i) in armiesByNav('own')"
                          :key="army.id"
                        >
                          <Army
                            :army="army"
                            :settlements="settlements"
                            :armies="armies"
                            :troop_types="troop_types"
                            :foreign="false"
                            :nobles="nobles"
                            :countries="countries"
                            @update-armies="updateArmies"
                            @edit-army="army => editingArmy = army"
                          />
                        </VCol>
                      </VRow>
                    </v-card-text>
                  </v-card>
                </div>
              </template>

              <template v-else-if="item.key == 'foreign'">
                <div class="d-flex flex-row">
                  <div style="padding: 20px">
                    <ArmyForm
                      title="Создать армию"
                      :settlements="settlements"
                      :nobles="nobles"
                      :countries="countries"
                      @army-created="updateArmies"
                    />
                    <ArmyForm
                      v-if="editingArmy"
                      title="Редактировать армию"
                      :settlements="settlements"
                      :nobles="nobles"
                      :countries="countries"
                      :army="editingArmy"
                      @army-updated="updateArmies"
                      @close="editingArmy = null"
                    />
                  </div>
                  <v-card flat>
                    <v-card-text>
                      <VRow>
                        <VCol
                          v-for="(army, i) in armiesByNav('foreign')"
                          :key="army.id"
                        >
                          <Army
                            :army="army"
                            :settlements="settlements"
                            :armies="armies"
                            :troop_types="troop_types"
                            :foreign="true"
                            :nobles="nobles"
                            :countries="countries"
                            @update-armies="updateArmies"
                            @edit-army="army => editingArmy = army"
                          />
                        </VCol>
                      </VRow>
                    </v-card-text>
                  </v-card>
                </div>
              </template>
            </VRow>
          </VCardText>
        </VWindowItem>
      </VWindow>
    </VCard>
  </div>
</template>
