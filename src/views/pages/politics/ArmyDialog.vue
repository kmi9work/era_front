<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  settlements: {
    type: Array,
    required: true,
  },
  nobles: {
    type: Array,
    required: true,
  },
  countries: {
    type: Array,
    required: true,
  },
  army: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dialog = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const settlementId = ref(null)
const ownerId = ref(null)
const armyName = ref('')
const errorMessage = ref('')

// Инициализация формы
const initForm = () => {
  if (props.army) {
    // Режим редактирования
    settlementId.value = props.army.settlement?.id
    ownerId.value = `${props.army.owner_type}-${props.army.owner_id}`
    armyName.value = props.army.name
  } else {
    // Режим создания
    resetForm()
  }
}

// Подготавливаем данные для select с группами
const ownerOptions = computed(() => {
  const noblesGroup = {
    title: 'Знатные игроки',
    items: props.nobles.map(noble => ({
      title: noble.name,
      value: `Player-${noble.id}`,
      props: {
        prependIcon: 'mdi-account'
      }
    }))
  }
  
  const countriesGroup = {
    title: 'Страны',
    items: props.countries.map(country => ({
      title: country.name,
      value: `Country-${country.id}`,
      props: {
        prependIcon: 'mdi-flag'
      }
    }))
  }
  
  return [noblesGroup, countriesGroup]
})

// Плоский список всех владельцев для item-value
const flatOwnerItems = computed(() => 
  ownerOptions.value.flatMap(group => group.items)
)

const resetForm = () => {
  settlementId.value = null
  ownerId.value = null
  armyName.value = ''
  errorMessage.value = ''
}

const submit = () => {
  if (!settlementId.value || !ownerId.value) {
    errorMessage.value = 'Пожалуйста, заполните все обязательные поля'
    return
  }

  const [ownerType, ownerIdValue] = ownerId.value.split('-')
  
  emit('submit', {
    settlement_id: settlementId.value,
    owner_id: ownerIdValue,
    owner_type: ownerType,
    name: armyName.value
  })
}

// Инициализируем форму при открытии диалога
watch(dialog, (val) => {
  if (val) initForm()
})

// Также следим за изменениями army
watch(() => props.army, () => {
  if (dialog.value) initForm()
}, { deep: true })
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="500"
  >
    <VCard>
      <VCardTitle class="headline">
        {{ army ? 'Редактировать армию' : 'Создать новую армию' }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="submit">
          <VTextField
            v-model="armyName"
            label="Название армии"
            class="mb-4"
          />

          <VSelect
            v-model="settlementId"
            :items="settlements"
            item-title="name"
            item-value="id"
            label="Поселение"
            required
            class="mb-4"
          />

          <VSelect
            v-model="ownerId"
            :items="flatOwnerItems"
            label="Владелец"
            required
            search
            class="mb-4"
          >
            <template #item="{ item, props: selectProps }">
              <VListItem
                v-bind="selectProps"
                :prepend-icon="item.props.prependIcon"
                :title="item.title"
                :value="item.value"
              ></VListItem>
            </template>
            
            <template #group-header="{ item, props: groupProps }">
              <VListItem
                v-bind="groupProps"
                :title="item.title"
                class="font-weight-bold bg-grey-lighten-4"
              ></VListItem>
            </template>
          </VSelect>

          <VAlert
            v-if="errorMessage"
            type="error"
            class="mb-4"
          >
            {{ errorMessage }}
          </VAlert>
        </VForm>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="blue darken-1"
          text
          @click="dialog = false"
        >
          Отмена
        </VBtn>
        <VBtn
          color="blue darken-1"
          text
          @click="submit"
        >
          {{ army ? 'Сохранить' : 'Создать' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>