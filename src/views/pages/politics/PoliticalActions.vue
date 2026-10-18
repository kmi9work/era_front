<script setup>
  import axios from 'axios'
  import { ref, onBeforeMount, watch } from 'vue'
  import { useCurrentCountry } from '@/composables/useCurrentCountry'
  import PoliticalAction from '@/views/pages/politics/PoliticalAction.vue'

  /**
   * Раздел «Политика → Политические действия» (ТЗ № 2, § 5).
   *
   * Экран работает в разрезе текущего государства:
   *  - список должностей — совет этого государства
   *    (`GET /jobs.json?nobles=1&country_id=`); бэкенд отдаёт в каждой должности
   *    только держателей этого государства и только его `political_actions`;
   *  - список для диалога «Кому?» — только знать этого государства
   *    (`GET /players.json?country_id=&player_type_id=2`);
   *  - отметка «действие выполнено в этом году» — по `(должность, год, государство)`:
   *    пришедшие `political_actions` уже отфильтрованы бэком по стране, поэтому
   *    отметка одного государства не влияет на другое;
   *  - смена держателя — `PATCH /jobs/:id.json` с обязательным `country_id`:
   *    без него бэкенд может заменить держателей другого государства.
   */
  const { currentCountryId, reloadToken, loadCurrentCountry } = useCurrentCountry()

  const nobles = ref([]);
  const noble_jobs = ref([]);
  const selected_noble = ref(0);
  const selected_job = ref(0);
  const width_r = ref(300);
  const width_c = ref(300);
  const change_noble_dialog = ref(false);
  const current_year = ref(0);

  async function updatePoliticalActions(){
    const countryId = currentCountryId.value;

    await axios.get(`${import.meta.env.VITE_PROXY}/jobs.json?nobles=1&country_id=${countryId}`)
      .then(response => {
        noble_jobs.value = Array.isArray(response.data) ? response.data : [];
        // У государства может не быть должностей — тогда ничего не выбираем.
        selected_job.value = noble_jobs.value.length ? noble_jobs.value[0].id : 0;
      })

    await axios.get(`${import.meta.env.VITE_PROXY}/players.json?country_id=${countryId}&player_type_id=2`) // 2 - Знать
      .then(response => {
        nobles.value = Array.isArray(response.data) ? response.data : [];
      })

    await axios.get(`${import.meta.env.VITE_PROXY}/game_parameters.json`)
      .then(response => {
        current_year.value = response.data.find((gp) => gp.identificator == "current_year")?.value;
      })
  }

  onBeforeMount(async () => {
    await loadCurrentCountry();
    updatePoliticalActions();
  })

  // Смена государства: перечитываем должности, знать и год; selected_job переустанавливается.
  watch(reloadToken, () => {
    updatePoliticalActions();
  })

  async function changeNoble(player_id) {
    await axios.patch(`${import.meta.env.VITE_PROXY}/jobs/${selected_job.value}.json?job[player_ids][]=${player_id}&country_id=${currentCountryId.value}`)
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
              :color="noble_job.political_actions.find((pa) => pa.year == current_year && pa.country_id == currentCountryId) ? 'error' : 'success'" 
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
