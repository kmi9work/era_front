<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { useCurrentCountry } from '@/composables/useCurrentCountry'

/**
 * «Служебное → Настройки» (ТЗ № 2, § 7.2).
 *
 * Суммы вассальных доходов правятся по каждому сюзерену: срез читается и
 * записывается с `country_id` текущего государства (`get_vassalage_settings` /
 * `update_vassalage_settings`), поэтому настройки одной команды не смешиваются
 * с настройками другой. При смене государства раздел перечитывается.
 */
const {
  currentCountry,
  currentCountryId,
  countries,
  reloadToken,
  loadCurrentCountry,
  withCountryParam,
} = useCurrentCountry()

const api = () => import.meta.env.VITE_PROXY

// Состояния
const yearsCount = ref(1)
const caravansPerGuild = ref(1)
const robbedCount = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Лимит отношений для получения торговых очков
const maxRelationsForTradePoints = ref(2)

// Вассальные доходы: vassalIncomes — суммы вассалов текущего сюзерена,
// vassalCountries — вассалы этого государства, vassalageCountry — сюзерен
const vassalIncomes = ref({})
const vassalCountries = ref([])
const vassalageCountry = ref(null)

// Заголовок раздела: чьи суммы вассальных доходов правятся
const vassalageCountryName = computed(
  () => vassalageCountry.value?.name || currentCountry.value?.name || 'текущее государство',
)

// Состояния для типов союзов
const alliancesEnabled = ref(false)
const allianceTypes = ref([])
const isAllianceTypesLoading = ref(false)
const showAllianceTypeForm = ref(false)
const editingAllianceType = ref(null)

const allianceTypeForm = ref({
  name: '',
  min_relations_level: 0,
})

const allianceTypeError = ref('')

// Название государства по id — для вассалов, суммы которых уже настроены
const countryNameById = id => countries.value.find(country => country.id === Number(id))?.name || `Вассал #${id}`

// Вассалы текущего сюзерена: чек-листы движка + вассалы с уже настроенными суммами
const loadVassalCountries = async () => {
  const list = []

  try {
    const response = await axios.get(
      withCountryParam(`${api()}/vassals_and_robbers/checklists.json`),
    )

    const checklists = Array.isArray(response.data) ? response.data : []

    checklists.forEach(checklist => {
      const vassal = checklist.vassal_country
      if (vassal && !list.some(item => item.id === vassal.id)) {
        list.push({
          id: vassal.id,
          name: vassal.name,
          vassalage_established: !!checklist.vassalage_established,
        })
      }
    })
  } catch (error) {
    // Движок вассалитета может быть не подключён — список берём из настроек
    console.error('Ошибка при загрузке вассалов:', error)
  }

  Object.keys(vassalIncomes.value || {}).forEach(id => {
    if (!list.some(item => item.id === Number(id))) {
      list.push({ id: Number(id), name: countryNameById(id), vassalage_established: null })
    }
  })

  list.sort((a, b) => a.name.localeCompare(b.name))
  vassalCountries.value = list

  // У вассала без сохранённой суммы показываем 0, чтобы поле было редактируемым
  list.forEach(vassal => {
    if (vassalIncomes.value[vassal.id] === undefined) vassalIncomes.value[vassal.id] = 0
  })
}

// Подсказка к полю: доход Казначея начисляется только по установленному вассалитету
const vassalIncomeHint = vassal => {
  if (vassal.vassalage_established === false) return 'Вассалитет не установлен — доход не начисляется'

  return 'Доход Казначея от вассала'
}

// Вассальные доходы текущего государства (срез сюзерена, § 7.2)
const loadVassalageSettings = async () => {
  try {
    const response = await axios.get(
      withCountryParam(`${api()}/game_parameters/get_vassalage_settings.json`),
    )

    // Бэкенд отдаёт `country` названием государства (в старом формате — объектом)
    const rawCountry = response.data?.country

    vassalageCountry.value = rawCountry
      ? {
        id: response.data.country_id ?? rawCountry.id,
        name: typeof rawCountry === 'string' ? rawCountry : rawCountry.name,
      }
      : null
    vassalIncomes.value = response.data?.vassal_incomes || {}
  } catch (error) {
    console.error('Ошибка при загрузке настроек вассалитета:', error)
    vassalageCountry.value = null
    vassalIncomes.value = {}
  }

  await loadVassalCountries()
}

// Загружаем текущие значения общих настроек и вассальные суммы государства
const loadSettings = async () => {
  try {
    isLoading.value = true

    const [yearsResponse, caravansResponse, statsResponse, maxRelationsResponse] = await Promise.all([
      axios.get(`${api()}/game_parameters/get_years_count.json`),
      axios.get(`${api()}/game_parameters/get_caravans_per_guild.json`),
      axios.get(`${api()}/game_parameters/get_robbery_stats.json`),
      axios.get(`${api()}/game_parameters/get_max_relations_for_trade_points.json`),
    ])

    yearsCount.value = yearsResponse.data.years_count || 1
    caravansPerGuild.value = caravansResponse.data.caravans_per_guild || 1
    robbedCount.value = statsResponse.data.robbed_count || 0

    // Лимит отношений
    maxRelationsForTradePoints.value = maxRelationsResponse.data.max_relations_for_trade_points || 2

    // Доходы от вассалов — по сюзерену (текущему государству)
    await loadVassalageSettings()
  } catch (error) {
    console.error('Ошибка при загрузке настроек:', error)
    errorMessage.value = 'Не удалось загрузить настройки'
  } finally {
    isLoading.value = false
  }
}

// Загружаем флаг включения функционала союзов у текущего государства
const loadAlliancesEnabled = async () => {
  if (!currentCountryId.value) {
    alliancesEnabled.value = false

    return
  }

  try {
    const response = await axios.get(`${api()}/countries/${currentCountryId.value}.json`)

    alliancesEnabled.value = response.data.alliances_enabled || false
    if (alliancesEnabled.value) {
      await loadAllianceTypes()
    }
  } catch (error) {
    console.error('Ошибка при загрузке флага союзов:', error)
    alliancesEnabled.value = false
  }
}

// Функции для управления типами союзов
const loadAllianceTypes = async () => {
  try {
    isAllianceTypesLoading.value = true

    const response = await axios.get(`${api()}/alliance_types.json`)

    allianceTypes.value = response.data
  } catch (error) {
    console.error('Ошибка при загрузке типов союзов:', error)
    allianceTypeError.value = 'Не удалось загрузить типы союзов'
  } finally {
    isAllianceTypesLoading.value = false
  }
}

const openAllianceTypeForm = (type = null) => {
  editingAllianceType.value = type
  if (type) {
    allianceTypeForm.value = {
      name: type.name,
      min_relations_level: type.min_relations_level,
    }
  } else {
    allianceTypeForm.value = {
      name: '',
      min_relations_level: 0,
    }
  }

  showAllianceTypeForm.value = true
  allianceTypeError.value = ''
}

const closeAllianceTypeForm = () => {
  showAllianceTypeForm.value = false
  editingAllianceType.value = null
  allianceTypeForm.value = {
    name: '',
    min_relations_level: 0,
  }
  allianceTypeError.value = ''
}

const saveAllianceType = async () => {
  try {
    allianceTypeError.value = ''

    if (!allianceTypeForm.value.name.trim()) {
      allianceTypeError.value = 'Название обязательно'
      return
    }

    if (editingAllianceType.value) {
      await axios.patch(
        `${api()}/alliance_types/${editingAllianceType.value.id}.json`,
        {
          alliance_type: allianceTypeForm.value,
        },
      )
    } else {
      await axios.post(
        `${api()}/alliance_types.json`,
        {
          alliance_type: allianceTypeForm.value,
        },
      )
    }

    await loadAllianceTypes()
    closeAllianceTypeForm()
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message
    allianceTypeError.value = errorMsg
  }
}

const deleteAllianceType = async (typeId) => {
  if (!confirm('Точно удалить тип союза?')) return

  try {
    await axios.delete(`${api()}/alliance_types/${typeId}.json`)
    await loadAllianceTypes()
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message
    alert(`Ошибка: ${errorMsg}`)
  }
}

// Сохраняем настройки
const saveSettings = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    await Promise.all([
      axios.patch(`${api()}/game_parameters/update_years_count.json`, {
        years_count: yearsCount.value,
      }),
      axios.patch(`${api()}/game_parameters/update_caravans_per_guild.json`, {
        caravans_per_guild: caravansPerGuild.value,
      }),
      // Пишем только срез текущего сюзерена — настройки других государств сохраняются
      axios.patch(withCountryParam(`${api()}/game_parameters/update_vassalage_settings.json`), {
        vassal_incomes: vassalIncomes.value,
      }),
      axios.patch(`${api()}/game_parameters/update_max_relations_for_trade_points.json`, {
        max_relations_for_trade_points: maxRelationsForTradePoints.value,
      }),
    ])

    successMessage.value = 'Настройки успешно сохранены'

    // Скрываем сообщение об успехе через 3 секунды
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Ошибка при сохранении настроек:', error)
    errorMessage.value = 'Не удалось сохранить настройки'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadCurrentCountry()
  loadSettings()
  loadAlliancesEnabled()
})

// Смена государства: суммы вассалитета у каждого сюзерена свои — перечитываем
watch(reloadToken, () => {
  loadSettings()
  loadAlliancesEnabled()
})
</script>

<template>
  <div class="settings-container">
    <VCard>
      <VCardTitle class="text-h5 mb-4">
        <VIcon icon="ri-settings-3-line" class="me-2" />
        Настройки игры
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Сообщения об ошибках и успехе -->
        <VAlert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          dismissible
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </VAlert>

        <VAlert
          v-if="successMessage"
          type="success"
          variant="tonal"
          class="mb-4"
        >
          {{ successMessage }}
        </VAlert>

        <!-- Настройка лет в игре -->
        <div class="setting-item">
          <VLabel class="mb-2">
            Количество лет:
          </VLabel>

          <VTextField
            v-model.number="yearsCount"
            type="number"
            min="1"
            max="10"
            variant="outlined"
            density="compact"
            :disabled="isLoading"
            hint="Установите, сколько лет будет в игре"
            persistent-hint
          />
        </div>

        <!-- Настройка количества караванов в гильдии -->
        <div class="setting-item">
          <VLabel class="mb-2">
            Количество караванов в гильдии:
          </VLabel>

          <VTextField
            v-model.number="caravansPerGuild"
            type="number"
            min="1"
            max="20"
            variant="outlined"
            density="compact"
            :disabled="isLoading"
            hint="Установите, сколько караванов может иметь гильдия"
            persistent-hint
          />
        </div>

        <!-- Статистика ограблений -->
        <div class="setting-item">
          <VLabel class="mb-2">
            Статистика ограблений:
          </VLabel>

          <VCard variant="outlined" color="warning">
            <VCardText>
              <div class="text-body-1">
                Ограблено караванов в текущем году: <strong>{{ robbedCount }}</strong>
              </div>
            </VCardText>
          </VCard>
        </div>

        <!-- Настройка доходов от вассалов (суммы сюзерена — текущего государства) -->
        <div class="setting-item">
          <VLabel class="mb-1">
            Доходы от вассальной зависимости (руб.), государство: {{ vassalageCountryName }}
          </VLabel>

          <div class="text-body-2 text-medium-emphasis mb-3">
            Суммы правятся по каждому сюзерену отдельно: сохраняются только вассалы
            {{ vassalageCountryName }}.
          </div>

          <VRow dense>
            <VCol
              v-for="country in vassalCountries"
              :key="country.id"
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="vassalIncomes[country.id]"
                :label="country.name"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
                :disabled="isLoading"
                :hint="vassalIncomeHint(country)"
                persistent-hint
              />
            </VCol>
          </VRow>

          <div
            v-if="!vassalCountries.length"
            class="text-body-2 text-medium-emphasis"
          >
            У государства нет вассалов: чек-листы вассалитета и настроенные суммы отсутствуют.
          </div>
        </div>

        <!-- Лимит отношений для получения торговых очков -->
        <div class="setting-item">
          <VLabel class="mb-2">
            Лимит отношений для торговых очков:
          </VLabel>

          <VTextField
            v-model.number="maxRelationsForTradePoints"
            type="number"
            min="0"
            max="2"
            variant="outlined"
            density="compact"
            :disabled="isLoading"
            hint="При достижении этого уровня отношений торговые очки не начисляются"
            persistent-hint
          />
        </div>

        <VBtn
          color="primary"
          class="mt-4"
          :loading="isLoading"
          @click="saveSettings"
        >
          <VIcon icon="ri-save-line" class="me-2" />
          Сохранить настройки
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Секция "Типы союзов" -->
    <VCard v-if="alliancesEnabled" class="mt-4">
      <VCardTitle class="text-h5 mb-4">
        <VIcon icon="ri-group-line" class="me-2" />
        Типы союзов
      </VCardTitle>

      <VDivider />

      <VCardText>
        <div class="d-flex justify-space-between align-center mb-4">
          <VBtn
            color="primary"
            @click="openAllianceTypeForm(null)"
          >
            <VIcon icon="ri-add-line" class="me-2" />
            Добавить тип союза
          </VBtn>
        </div>

        <!-- Таблица типов союзов -->
        <v-table v-if="!isAllianceTypesLoading" density="compact">
          <thead>
            <tr>
              <th class="text-left">
                Название
              </th>
              <th class="text-left">
                Минимальный уровень отношений
              </th>
              <th class="text-left">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="type in allianceTypes"
              :key="type.id"
            >
              <td>{{ type.name }}</td>
              <td>{{ type.min_relations_level }}</td>
              <td>
                <IconBtn
                  icon="ri-pencil-line"
                  color="primary"
                  title="Редактировать"
                  @click="openAllianceTypeForm(type)"
                />
                <IconBtn
                  icon="ri-delete-bin-line"
                  color="error"
                  title="Удалить"
                  @click="deleteAllianceType(type.id)"
                />
              </td>
            </tr>
            <tr v-if="allianceTypes.length === 0">
              <td colspan="3" class="text-center text-medium-emphasis">
                Нет типов союзов
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-else class="text-center pa-4">
          <VProgressCircular indeterminate color="primary" />
        </div>
      </VCardText>
    </VCard>

    <!-- Диалог добавления/редактирования типа союза -->
    <v-dialog
      v-model="showAllianceTypeForm"
      max-width="500"
    >
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center bg-primary">
          <span class="text-white">
            {{ editingAllianceType ? 'Редактировать тип союза' : 'Добавить тип союза' }}
          </span>
          <IconBtn
            icon="ri-close-line"
            color="white"
            @click="closeAllianceTypeForm"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <VAlert
            v-if="allianceTypeError"
            type="error"
            variant="tonal"
            class="mb-4"
            dismissible
            @click:close="allianceTypeError = ''"
          >
            {{ allianceTypeError }}
          </VAlert>

          <VTextField
            v-model="allianceTypeForm.name"
            label="Название"
            variant="outlined"
            density="compact"
            class="mb-3"
          />

          <VTextField
            v-model.number="allianceTypeForm.min_relations_level"
            type="number"
            label="Минимальный уровень отношений"
            variant="outlined"
            density="compact"
            min="0"
            max="2"
            hint="От 0 до 2"
            persistent-hint
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="closeAllianceTypeForm"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveAllianceType"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 16px;
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item:last-child {
  margin-bottom: 0;
}
</style>
