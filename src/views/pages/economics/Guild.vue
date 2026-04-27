<script>
  export default {
    props: ["guild"],
    setup(props){
    },
    data: () => {
      return {
      }
    },
  }
</script>

<template>
  <VCard :title="guild.name">
    <VCardText>
      Участники: 
      <v-list>
        <v-list-item
          v-for="(player, i) in guild.players"
          :key="i"
          color="primary"
          rounded="xl"
          v-on:click=""
        >
          <v-list-item-title :id="player.id">
            {{player.name}} ({{player.human.name}})
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </VCardText>

    <VCardActions>
      <VBtn>Location</VBtn>
      <VBtn>Reviews</VBtn>
    </VCardActions>
  </VCard>
</template>
