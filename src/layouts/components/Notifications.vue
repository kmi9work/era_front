<script setup>
  import axios from 'axios'

  const audits = ref([]);
  const not_read = ref([2])

  async function updateNotifications(){
    await axios.get(`${import.meta.env.VITE_PROXY}/audits.json`)
      .then(async (response) => {
        audits.value = response.data;
      })
  }

  onBeforeMount(async () => {
    updateNotifications()
  })
</script>

<template>
  <IconBtn class="cursor-pointer" @click="updateNotifications()">
    <VIcon icon="ri-notification-line" />
    <VMenu
      activator="parent"
      location="bottom end"
      offset="14px"
    >

      <v-card class="mx-auto" max-width="500">
        <v-toolbar color="pink">
          <v-btn icon="mdi-menu"></v-btn>

          <v-toolbar-title>Новые действия</v-toolbar-title>

          <v-spacer></v-spacer>

          <v-btn icon="mdi-magnify"></v-btn>

          <v-btn icon="mdi-checkbox-marked-circle"></v-btn>
        </v-toolbar>

        <v-list v-model:selected="not_read" select-strategy="leaf">
          <v-list-item
            v-for="audit in audits"
            :key="audit.id"
            :value="audit.id"
            active-class="text-pink"
            class="py-3"
          >
            <v-list-item-title>{{audit.id}}. {{audit.auditable_type}}: {{audit.auditable_type}} - {{ audit.auditable?.name || audit.auditable?.comment }}</v-list-item-title>

            <v-list-item-subtitle class="text-high-emphasis">{{ audit.action }}: {{audit.audited_changes}}</v-list-item-subtitle>

            <template v-slot:append="{ isSelected }">
              <v-list-item-action class="flex-column align-end">
                <small class="mb-4 text-high-emphasis opacity-60">{{ audit.user?.name }}</small>

                <v-spacer></v-spacer>

                <v-icon v-if="isSelected" color="yellow-darken-3">mdi-star</v-icon>

                <v-icon v-else class="opacity-30">mdi-star-outline</v-icon>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </VMenu>
  </IconBtn>

</template>