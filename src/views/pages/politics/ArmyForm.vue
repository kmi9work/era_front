<script setup>
import { ref } from 'vue'
import axios from 'axios'
import ArmyDialog from './ArmyDialog.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
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

const emit = defineEmits(['army-created', 'army-updated'])

const dialog = ref(false)
const isProcessing = ref(false)

const handleSubmit = async (armyData) => {
  isProcessing.value = true
  
  try {
    if (props.army) {
      // Редактирование существующей армии
      const response = await axios.patch(`${import.meta.env.VITE_PROXY}/armies/${props.army.id}.json`, {
        army: armyData
      })
      
      if (response.status === 200) {
        dialog.value = false
        emit('army-updated')
      }
    } else {
      // Создание новой армии
      const response = await axios.post(`${import.meta.env.VITE_PROXY}/armies.json`, {
        army: armyData
      })
      
      if (response.status === 201) {
        dialog.value = false
        emit('army-created')
      }
    }
  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div>
    <VBtn
      color="primary"
      @click="dialog = true"
    >
      <VIcon :icon="army ? 'mdi-pencil' : 'mdi-plus'" />
      {{ title }}
    </VBtn>

    <ArmyDialog
      v-model="dialog"
      :settlements="settlements"
      :nobles="nobles"
      :countries="countries"
      :army="army"
      @submit="handleSubmit"
    />
  </div>
</template>