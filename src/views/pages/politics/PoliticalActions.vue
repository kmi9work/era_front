<script setup>
  import axios from 'axios'
  import PoliticalAction from '@/views/pages/politics/PoliticalAction.vue'

  const nobles = ref([]);
  const selected_noble = ref(0);
  const width_r = ref(300);
  const width_c = ref(300);

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/players.json`) 
      .then(response => {
        nobles.value = response.data.filter((player) => (player.player_type?.id == 2 && player.job.political_action_types.length > 0)); // 2 - Знать
      })
  })
</script>

<template>
  <VCard>
    <VCardText class="overflow-x-auto">
      <div class="d-flex flex-row">
        <v-tabs
          v-model="selected_noble"
          color="primary"
          direction="vertical"
          :style="`width: ${width_r}px;`"
        >
          <div style="text-align: center;">
            <h2 @click="width_r == 50 ? width_r = 300 : width_r = 50"> Дворяне </h2>
          </div>
          <v-tab 
            v-for="noble in nobles"
            :text="noble.job?.name" 
            :value="noble.id"
          ></v-tab>
        </v-tabs>

        <v-tabs-window v-model="selected_noble">
          <v-tabs-window-item 
            v-for="noble in nobles"
            :value="noble.id"
          >
            <v-card flat>
              <v-card-text>
                <v-list>
                  <PoliticalAction 
                    :noble="noble"
                  />
                </v-list>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
      </div>
    </VCardText>
  </VCard>
</template>