<script setup>
  import axios from 'axios'

  import sedition from '@/views/pages/merchant_political_actions/sedition.vue'
  import charity from '@/views/pages/merchant_political_actions/charity.vue'
  import sabotage from '@/views/pages/merchant_political_actions/sabotage.vue'
  import contraband from '@/views/pages/merchant_political_actions/contraband.vue'
  import open_gate from '@/views/pages/merchant_political_actions/open_gate.vue'
  import new_fisheries from '@/views/pages/merchant_political_actions/new_fisheries.vue'
  import people_support from '@/views/pages/merchant_political_actions/people_support.vue'

  const compMap = new Map();
  compMap.set("sedition", sedition);
  compMap.set("charity", charity);
  compMap.set("sabotage", sabotage);
  compMap.set("contraband", contraband);
  compMap.set("open_gate", open_gate);
  compMap.set("new_fisheries", new_fisheries);
  compMap.set("people_support", people_support);

  const props = defineProps({
    actions: {
      type: Object,
      required: true,
    },
  })

  const pat_settings = ref([]);

</script>

<template>
  <v-dialog 
    v-for="(action, i) in actions"
    :key="i"
    v-model="pat_settings[i]" 
    transition="dialog-bottom-transition" 
    max-width="800"
  >
    <template v-slot:activator="{ props: activatorProps }">
      <v-list-item
        :key="action.id"
        v-bind="activatorProps"
      >
        <template v-slot:prepend>
          <v-icon :icon="action.icon"></v-icon>
        </template>
        <v-list-item-title :id="action.id" v-text="action.name"></v-list-item-title>
      </v-list-item>
    </template>

    <v-card>
      <v-toolbar>
        <v-btn icon="ri-close-line" @click="pat_settings[i] = false"></v-btn>

        <v-toolbar-title>{{action.name}}</v-toolbar-title>

        <v-spacer></v-spacer>
      </v-toolbar>
      <Component
        :is="compMap.get(action.action)"
        @close-dialog="pat_settings[i] = false"
        :action="action"
      />

    </v-card>
  </v-dialog>
</template>