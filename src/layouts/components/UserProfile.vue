<script setup>
  import axios from 'axios'

  const users = ref([]);
  const current_user = ref({});

  onBeforeMount(async () => {
    await axios.get(`${import.meta.env.VITE_PROXY}/users.json`)
      .then(async (response) => {
        users.value = response.data;
      })
    await axios.get(`${import.meta.env.VITE_PROXY}/current_user.json`)
      .then(async (response) => {
        current_user.value = response.data;
      })
  })

  async function loginUser(user_id) {
    await axios.get(`${import.meta.env.VITE_PROXY}/login/${user_id}.json`)
      .then(async (response) => {
        current_user.value = response.data; 
      })
  };
</script>

<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    :color="current_user.id ? 'success' : 'error'"
    bordered
  >
    <VAvatar
      class="cursor-pointer"
      color="primary"
      variant="tonal"
    >
      <v-icon icon="ri-id-card-line"></v-icon>
      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="300"
        location="bottom end"
        offset="14px"
      >
        <VList>
          <!-- 👉 Profile -->
          <VListItem 
            v-for="(user, i) in users"
            :key="i"
            @click="loginUser(user.id)"
            :active="user.id == current_user.id"
          >
            <VListItemTitle>{{user.name}} | {{user.job}}</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
