<script setup>
  import axios from 'axios'

  import ceremonial from '@/views/pages/political_actions/ceremonial.vue'
  import defective_coin from '@/views/pages/political_actions/defective_coin.vue'
  import call_a_meeting from '@/views/pages/political_actions/call_a_meeting.vue'
  import send_embassy from '@/views/pages/political_actions/send_embassy.vue'
  import take_bribe from '@/views/pages/political_actions/take_bribe.vue'
  import equip_caravan from '@/views/pages/political_actions/equip_caravan.vue'
  import сonduct_audit from '@/views/pages/political_actions/сonduct_audit.vue'
  import peculation from '@/views/pages/political_actions/peculation.vue'
  import disperse_bribery from '@/views/pages/political_actions/disperse_bribery.vue'
  import implement_sabotage from '@/views/pages/political_actions/implement_sabotage.vue'
  import name_of_grand_prince from '@/views/pages/political_actions/name_of_grand_prince.vue'
  import recruiting from '@/views/pages/political_actions/recruiting.vue'
  import drain_the_swamps from '@/views/pages/political_actions/drain_the_swamps.vue'
  import contract_to_cousin from '@/views/pages/political_actions/contract_to_cousin.vue'
  import improving_the_city from '@/views/pages/political_actions/improving_the_city.vue'
  import sermon from '@/views/pages/political_actions/sermon.vue'
  import root_out_heresies from '@/views/pages/political_actions/root_out_heresies.vue'
  import call_for_unity from '@/views/pages/political_actions/call_for_unity.vue'
  import counterintelligence from '@/views/pages/political_actions/counterintelligence.vue'
  import fabricate_a_denunciation from '@/views/pages/political_actions/fabricate_a_denunciation.vue'
  import favoritism from '@/views/pages/political_actions/favoritism.vue'
  import dev_the_economy from '@/views/pages/political_actions/dev_the_economy.vue'
  import confused_mine from '@/views/pages/political_actions/confused_mine.vue'
  import patronage_of_infidel from '@/views/pages/political_actions/patronage_of_infidel.vue'

  const compMap = new Map();
  compMap.set("ceremonial", ceremonial);
  compMap.set("defective_coin", defective_coin);
  compMap.set("call_a_meeting", call_a_meeting);
  compMap.set("send_embassy", send_embassy);
  compMap.set("take_bribe", take_bribe);
  compMap.set("equip_caravan", equip_caravan);
  compMap.set("сonduct_audit", сonduct_audit);
  compMap.set("peculation", peculation);
  compMap.set("disperse_bribery", disperse_bribery);
  compMap.set("implement_sabotage", implement_sabotage);
  compMap.set("name_of_grand_prince", name_of_grand_prince);
  compMap.set("recruiting", recruiting);
  compMap.set("drain_the_swamps", drain_the_swamps);
  compMap.set("contract_to_cousin", contract_to_cousin);
  compMap.set("improving_the_city", improving_the_city);
  compMap.set("sermon", sermon);
  compMap.set("root_out_heresies", root_out_heresies);
  compMap.set("call_for_unity", call_for_unity);
  compMap.set("counterintelligence", counterintelligence);
  compMap.set("fabricate_a_denunciation", fabricate_a_denunciation);
  compMap.set("favoritism", favoritism);
  compMap.set("dev_the_economy", dev_the_economy);
  compMap.set("confused_mine", confused_mine);
  compMap.set("patronage_of_infidel", patronage_of_infidel);

  const props = defineProps({
    noble: {
      type: Object,
      required: true,
    },
  })

  const pat_settings = ref([]);

</script>

<template>
  <v-dialog 
    v-for="(action, i) in noble.job?.political_action_types"
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
        :noble="noble"
      />

    </v-card>
  </v-dialog>
</template>