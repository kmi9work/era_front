<script setup>
  import axios from 'axios'
  import PoliticalAction from '@/views/pages/politics/PoliticalAction.vue'

  const nobles = ref([]);
  const noble_jobs = ref([]);
  const selected_noble = ref(0);
  const selected_job = ref(0);
  const width_r = ref(300);
  const width_c = ref(300);
  const change_noble_dialog = ref(false);
  const current_year = ref(0);

  async function updatePoliticalActions(){
    await axios.get(`${import.meta.env.VITE_PROXY}/jobs.json?nobles=1`) 
      .then(response => {
        noble_jobs.value = response.data;
        selected_job.value = noble_jobs.value[0].id;
      })

    await axios.get(`${import.meta.env.VITE_PROXY}/players.json`) 
      .then(response => {
        nobles.value = response.data.filter((player) => player.player_type?.id == 2); // 2 - Знать
      })

    await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters.json`) 
      .then(response => {
        current_year.value = response.data.find((gp) => gp.identificator == "current_year")?.value;
      })
  }

  onBeforeMount(async () => {
    updatePoliticalActions()
  })

  async function changeNoble(player_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/jobs/${selected_job.value}.json?job[player_ids][]=${player_id}`)
      .then(async (response) => {
        change_noble_dialog.value = false;
        updatePoliticalActions();
      })
  };
</script>

<template>
  <VCard>
    <VCardText class="overflow-x-auto">
      <div class="d-flex flex-row">
        <v-tabs
          v-model="selected_job"
          color="primary"
          direction="vertical"
          :style="`width: ${width_r}px;`"
        >
          <div style="text-align: center;">
            <h2 @click="width_r == 50 ? width_r = 300 : width_r = 50"> Дворяне </h2>
          </div>
          <v-tab 
            v-for="noble_job in noble_jobs"
            :value="noble_job.id"
          >
            {{noble_job.name}}
            <v-icon 
              icon="ri-circle-fill" 
              :color="noble_job.political_actions.find((pa) => pa.year == current_year) ? 'error' : 'success'" 
            />
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="selected_job">
          <v-tabs-window-item 
            v-for="noble_job in noble_jobs"
            :value="noble_job.id"
          >
            <v-card flat>
              <v-card-text>
                Должность занимает: {{noble_job.players.map((p) => p.name).join(", ")}} 
                <v-btn @click="change_noble_dialog = true" variant="plain">Сменить</v-btn>
                <VDialog
                  v-model="change_noble_dialog"
                  width="auto"
                >
                  <VCard
                    width="400"
                    title="Кому?"
                  >
                    <VList>
                      <VListItem
                        v-for="(noble, i) in nobles"
                        :key="i"
                        :value="noble.id"
                        color="primary"
                        rounded="xl"
                        @click="changeNoble(noble.id)"
                      >
                        <VListItemTitle v-text="`${noble.name}`"></VListItemTitle>
                      </VListItem>
                    </VList>
                    <template v-slot:actions>
                      <VBtn
                        class="ms-auto"
                        text="Отмена"
                        @click="change_noble_dialog = false"
                      ></VBtn>
                    </template>
                  </VCard>
                </VDialog>
              </v-card-text>
              <v-card-text>
                <v-list>
                  <PoliticalAction 
                    :noble_job="noble_job"
                    @reload-actions="updatePoliticalActions()"
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