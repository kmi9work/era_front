<script setup>
  import axios from 'axios'
  import { computed } from 'vue'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'

  /**
   * Технологии текущего государства (ТЗ № 2, § 3.2).
   *
   * Номенклатура технологий общая, флаг открытия — свой у каждого государства.
   * В карточке подписано, чей это флаг, чтобы не спутать при нескольких командах.
   */
  const props = defineProps({
    technologies: {
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

  async function editItem(item_id, value){
    const fl = confirm(`Добавить бонус Окольничему (государство: ${countryName.value})?`)
    const params = fl ? '?okolnichy_bonus=1' : ''
    axios.patch(`${import.meta.env.VITE_PROXY}/technology_items/${item_id}.json${params}`, {value: value, country_id: currentCountryId.value})
      .then(() => {
        emit('reload-dashboard');
      })
  }
</script>


<template>
  <VCard max-width="600">
    <VCardItem>
      <VCardTitle>Технологии: {{ countryName }}</VCardTitle>
    </VCardItem>

    <VCardText>
      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">
              Название
            </th>
            <th class="text-left">
              Открыта?
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(tech, ri) in technologies"
            :key="tech.id"
          >
            <td>
              <v-btn
                class="text-none"
                color="medium-emphasis"
                variant="text"
                rounded
                prepend-icon="ri-arrow-down-double-fill"
                min-width="300"
                style="justify-content: start;"
              >
                {{ tech.name }}
                <v-menu activator="parent">
                  <VList>
                    <VListItem
                      v-for="(item, i) in tech.technology_items"
                      :key="i"
                    >
                      <VListItemTitle v-if="item.id != 0">
                        <span class="text-caption text-medium-emphasis me-2">
                          Флаг государства: {{ countryName }}
                        </span>
                        <v-btn variant="text" @click="editItem(item.id, 0)" v-if="item.value == 1">
                          Закрыть
                        </v-btn>
                        <v-btn variant="text" @click="editItem(item.id, 1)" v-else>
                          Открыть
                        </v-btn>
                      </VListItemTitle>
                      <VListItemTitle v-else>
                        {{item.comment}}
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </v-menu>
              </v-btn>

            </td>
            <td>{{ tech.is_open == 1 ? 'Да' : 'Нет' }}</td>
          </tr>
        </tbody>
      </v-table>
    </VCardText>
  </VCard>
</template>
