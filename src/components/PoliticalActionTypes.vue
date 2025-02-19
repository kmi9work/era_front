<template>
  <v-card class="mx-auto" max-width="300">
    <v-list>
      <v-list-subheader>Политические действия</v-list-subheader>

      <v-list-item
        v-for="(pat, i) in political_action_types"
        :key="i"
        color="primary"
        rounded="xl"
        v-on:click="runPoliticalAction"
      >
        <template v-slot:prepend>
          <v-icon :icon="pat.icon"></v-icon>
        </template>

        <v-list-item-title :id="pat.id" v-text="pat.title"></v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
  import axios from 'axios'
  
  export default {
    props: ["political_actions"],
    setup(props){
    },
    data: () => {
      return {
        political_action_types: [],
      }
    },
    methods: {
      async runPoliticalAction(event) {
        const res = await confirm('Уверен?');
        this.$emit('runPoliticalAction')
        if (res){
          const data = await axios.post(`${import.meta.env.VITE_PROXY}/political_actions.json`, {
            political_action_type_id: event.target.id,
            success: true,
            player_id: 1,
            params: {country_id: 1}
          }).then(response => {
            return response.data;
          })
          this.political_actions.push(data)
        } else {
          return {};
        }
      }
    },
    created() {
      axios.get(`${import.meta.env.VITE_PROXY}/political_action_types.json`) 
        .then(response => {
          this.political_action_types = response.data;
        })
        .catch(e => {
          this.error.push(e)
        });
    },
  }
</script>