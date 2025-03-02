<script setup>
  const names = ref(["adfd", "fsdf", "fdsf"])
  const selected_names = ref([1,2,3]);
  function showNames(){
    alert(selected_names.value[0]);
    alert(selected_names.value[1]);
    alert(selected_names.value[2]);
  }

  // axios.post('/user', {
  //   firstName: names[0],
  //   lastName: names[1]
  // })
  // .then(function (response) {
  //   console.log(response);
  // })
  // .catch(function (error) {
  //   console.log(error);
  // });
</script>

<template>
  <v-form fast-fail @submit.prevent>
    <v-text-field
      v-for="name, index in names"
      v-model="selected_names[index]"
      label="First name"
    ></v-text-field>

    <v-btn @click="showNames">Submit</v-btn>
  </v-form>

</template>