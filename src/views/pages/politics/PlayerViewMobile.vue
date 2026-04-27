<script setup>
import { ref } from 'vue'

const emit = defineEmits(['back'])

const handleBack = () => {
  emit('back')
}

defineExpose({
  handleBack
})
</script>

<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-btn icon @click="handleBack">
        <VIcon>mdi-arrow-left</VIcon>
      </v-btn>
      <v-toolbar-title>Мой персонаж</v-toolbar-title>
    </v-app-bar>

    <v-main style="padding-bottom: 80px;">
      <v-container>
        <v-card>
          <v-card-text class="text-center pa-8">
            <VIcon size="64" color="grey">ri-user-line</VIcon>
            <div class="mt-4 text-h6">Функция в разработке</div>
            <div class="mt-2 text-body-2 text-grey">Просмотр информации о персонаже будет доступен в следующей версии</div>
          </v-card-text>
        </v-card>
      </v-container>
      
      <!-- Фиксированная кнопка Назад -->
      <div class="back-button-fixed">
        <v-btn
          block
          color="primary"
          size="large"
          prepend-icon="mdi-arrow-left"
          @click="handleBack"
        >
          Назад
        </v-btn>
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.back-button-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
</style>

