<script>
  import axios from 'axios'
  
  export default {
    setup(props){
    },
    data: () => {
      return {
        plants: [],
        dialog: false,
        notifications: false,
        sound: true,
        widgets: false,
      }
    },
    created() {
      axios.get(`${import.meta.env.VITE_PROXY}/plants.json`) 
        .then(response => {
          this.plants = response.data;
        })
        .catch(e => {
          this.error.push(e)
        });
    },
  }
</script>

<template>
  <div>
    <v-dialog
      v-model="dialog"
      transition="dialog-bottom-transition"
      fullscreen
    >
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn
          prepend-icon="ri-arrow-up-box-line"
          size="large"
          text="Отправить караван"
          v-bind="activatorProps"
        ></v-btn>
      </template>

      <v-card>
        <v-toolbar>
          <v-btn
            icon="mdi-close"
            @click="dialog = false"
          ></v-btn>

          <v-toolbar-title>Обработать</v-toolbar-title>

          <v-spacer></v-spacer>

          <v-toolbar-items>
            <v-btn
              text="Close"
              variant="text"
              @click="dialog = false"
            ></v-btn>
          </v-toolbar-items>
        </v-toolbar>

        <v-list lines="two">
          <v-list-subheader>User Controls</v-list-subheader>

          <v-list-item
            subtitle="Set the content filtering level to restrict apps that can be downloaded"
            title="Content filtering"
            link
          ></v-list-item>

          <v-list-item
            subtitle="Require password for purchase or use password to restrict purchase"
            title="Password"
            link
          ></v-list-item>

          <v-divider></v-divider>

          <v-list-subheader>General</v-list-subheader>

          <v-list-item
            subtitle="Notify me about updates to apps or games that I downloaded"
            title="Notifications"
            @click="notifications = !notifications"
          >
            <template v-slot:prepend>
              <v-list-item-action start>
                <v-checkbox-btn v-model="notifications" color="primary"></v-checkbox-btn>
              </v-list-item-action>
            </template>
          </v-list-item>

          <v-list-item
            subtitle="Auto-update apps at any time. Data charges may apply"
            title="Sound"
            @click="sound = !sound"
          >
            <template v-slot:prepend>
              <v-list-item-action start>
                <v-checkbox-btn v-model="sound" color="primary"></v-checkbox-btn>
              </v-list-item-action>
            </template>
          </v-list-item>

          <v-list-item
            subtitle="Automatically add home screen widgets"
            title="Auto-add widgets"
            @click="widgets = !widgets"
          >
            <template v-slot:prepend>
              <v-list-item-action start>
                <v-checkbox-btn v-model="widgets" color="primary"></v-checkbox-btn>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>
  </div>
</template>
