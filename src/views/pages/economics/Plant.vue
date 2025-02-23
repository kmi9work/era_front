<script>
  export default {
    props: ["plant"],
    setup(props){
    },
    data: () => {
      return {
      }
    },
  }
</script>

<template>
  <VCard :title="plant.plant_type.name">
    <VCardText>
      Уровень предприятия: {{plant.plant_level.level}}
    </VCardText>

    <VCardText>
      Владелец: {{plant.economic_subject.name}}
    </VCardText>

    <VCardActions>
      <VBtn>Location</VBtn>
      <VBtn>Reviews</VBtn>
    </VCardActions>
  </VCard>
</template>
