<script setup>
  import axios from 'axios'
  import { ref } from 'vue'

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/countries/foreign_countries.json`)
    .then(response => {
      countries.value = response.data;
      first_country.value = countries.value[0].id
    })
    .catch(e => {
    });

    await axios.get(`${import.meta.env.VITE_PROXY}/resources/show_prices.json`)
    .then(response => {
      resources.value = response.data.prices;
    })
    .catch(e => {
    });
  })

  const countries = ref ([])
  const first_country = ref ()
  const prices = ref ([])
  const selectedCountry = ref (first_country)
  const resources = ref ([])
  const resourcesPlSells = ref ([])
  const resourcesPlBuys = ref ([])
  const gold = ref (null)
  const resToPlayer = ref ([])

  const filteredResources = computed(() => {
    let filtered = resources.value.filter((res) => res.country.id == selectedCountry.value)

    resourcesPlSells.value = Array(filtered.length).fill(0).map(
      function(_, i) {
        return {"name_and_s_pr": filtered[i].name_and_s_pr, "identificator": filtered[i].identificator, "count": null}
      })

    resourcesPlBuys.value = Array(filtered.length).fill(0).map(
      function(_, i) {
        return {"name_and_b_pr": filtered[i].name_and_b_pr, "identificator": filtered[i].identificator, "count": null}
      }
      )
    return filtered
  })

  function submit(){
    const resToBack = {"country_id"  : selectedCountry.value,
                       "res_pl_sells": resourcesPlSells.value,
                       "res_pl_buys" : resourcesPlBuys.value,
                       "gold"        : gold.value}

     axios.post(`${import.meta.env.VITE_PROXY}/resources/send_caravan`, resToBack)
     .then(response => {
      prices.value = response.data;
      resToPlayer.value = prices.value["res_to_player"]
    })
     .catch(e => {
     });
   }


 </script>

 <template>
     <div>
    <VSelect
    v-model="selectedCountry"
    label="Select"
    item-title="name"
    item-value="id"
    :items="countries"
    ></VSelect>

    <VCard title="">
      <VCardText>
        <VRow>
          <VCol>
            <VCard title='Игрок продает'>
              <VCardText>
                <v-col
                 cols="12"
                 md="4"
                 sm="6"
                 >
                  <v-form @submit.prevent class= "px-6">
                    <v-text-field
                     v-for="item, index in filteredResources"
                     v-model="resourcesPlSells[index].count"
                     :key="index"
                     :label="item.name_and_s_pr"
                     placeholder="Введите количество"
                     variant="outlined"
                     style="margin-bottom: 10px;"
                     >
                    </v-text-field>
                  </v-form>
                </v-col>
              </VCardText>
            </VCard>
          </VCol>
          <VCol>
            <VCard title='Игрок покупает'>
              <VCardText>
               <v-col
               cols="12"
               md="4"
               sm="6"
               >
                 <v-form @submit.prevent class= "px-3">
                   <v-text-field
                   v-for="item, index in filteredResources"

                    v-model="resourcesPlBuys[index].count"
                   :key="index"
                   :label="item.name_and_b_pr"
                   placeholder="Введите количество"
                   variant="outlined"
                   style="margin-bottom: 10px;"
                   >
                 </v-text-field>
               </v-form>
              </v-col>
             </VCardText>
           </VCard>
         </VCol>
       </VRow>

        <v-card
        class="mx-auto my-8"
        >
          <v-card-item>
            <v-form @submit.prevent>
              <v-text-field
              v-model="gold"
              label="Золото"
              ></v-text-field>
            </v-form>
          </v-card-item>
        </v-card>
      <v-btn class="mt-2" @click="submit" block>Загнать</v-btn>

      <p> </p>
      <VCard title="Выдать игроку"
      style="margin-bottom: 10px;">
        <li v-for="item, index in resToPlayer">
          <h v-if="item.count > 0">
          <span style="color:green"> {{ item.name }}: {{ item.count }} </span>
        </h>
          <h v-else-if="item.count < 0">
            <span style="color:red"> {{ item.name }}: {{ item.count }} </span>
          </h>

          <p> </p>
        </li>
      </VCard>


    </VCardText>

<p>  </p>

<VCardActions>
  <VBtn>Location</VBtn>
  <VBtn>Reviews</VBtn>
</VCardActions>
</VCard>

</div>
</template>
