<script setup>
  import axios from 'axios'

  import ceremonial from '@/views/pages/political_actions/ceremonial.vue'
  import defective_coin from '@/views/pages/political_actions/defective_coin.vue'
  import call_a_meeting from '@/views/pages/political_actions/call_a_meeting.vue'
  import send_embassy_vassals from '@/views/pages/political_actions/send_embassy_vassals.vue'
  import take_bribe from '@/views/pages/political_actions/take_bribe.vue'
  import equip_caravan from '@/views/pages/political_actions/equip_caravan.vue'
  import conduct_audit from '@/views/pages/political_actions/conduct_audit.vue'
  import peculation from '@/views/pages/political_actions/peculation.vue'
  import disperse_bribery from '@/views/pages/political_actions/disperse_bribery.vue'
  import implement_sabotage from '@/views/pages/political_actions/implement_sabotage.vue'
  import name_of_grand_prince from '@/views/pages/political_actions/name_of_grand_prince.vue'
  import recruiting_vassals from '@/views/pages/political_actions/recruiting_vassals.vue'
  import drain_the_swamps from '@/views/pages/political_actions/drain_the_swamps.vue'
  import contract_to_cousin from '@/views/pages/political_actions/contract_to_cousin.vue'
  import improving_the_city from '@/views/pages/political_actions/improving_the_city.vue'
  import sermon_vassals from '@/views/pages/political_actions/sermon_vassals.vue'
  import root_out_heresies from '@/views/pages/political_actions/root_out_heresies.vue'
  import call_for_unity_vassals from '@/views/pages/political_actions/call_for_unity_vassals.vue'
  import counterintelligence from '@/views/pages/political_actions/counterintelligence.vue'
  import fabricate_a_denunciation from '@/views/pages/political_actions/fabricate_a_denunciation.vue'
  import favoritism from '@/views/pages/political_actions/favoritism.vue'
  import dev_the_economy from '@/views/pages/political_actions/dev_the_economy.vue'
  import confused_mine from '@/views/pages/political_actions/confused_mine.vue'
  import patronage_of_infidel from '@/views/pages/political_actions/patronage_of_infidel.vue'
  
  // Новые политические действия из плагина vassals-and-robbers
  import support_export from '@/views/pages/political_actions/support_export.vue'
  import make_a_trip from '@/views/pages/political_actions/make_a_trip.vue'
  import transfere_army from '@/views/pages/political_actions/transfere_army.vue'
  import build_fort from '@/views/pages/political_actions/build_fort.vue'
  import invest from '@/views/pages/political_actions/invest.vue'
  import lease_cattle from '@/views/pages/political_actions/lease_cattle.vue'
  import boost_innovation from '@/views/pages/political_actions/boost_innovation.vue'
  import make_alliance from '@/views/pages/political_actions/make_alliance.vue'
  import bring_gifts_to_foreign_countries from '@/views/pages/political_actions/bring_gifts_to_foreign_countries.vue'
  import bring_gifts_to_russian_countries from '@/views/pages/political_actions/bring_gifts_to_russian_countries.vue'
  import protect_caravan from '@/views/pages/political_actions/protect_caravan.vue'
  import spy_away_mutiny from '@/views/pages/political_actions/spy_away_mutiny.vue'
  import infiltrate_army from '@/views/pages/political_actions/infiltrate_army.vue'

  const compMap = new Map();
  // Старые действия ядра игры
  compMap.set("ceremonial", ceremonial);
  compMap.set("defective_coin", defective_coin);
  compMap.set("call_a_meeting", call_a_meeting);
  compMap.set("send_embassy_vassals", send_embassy_vassals);
  compMap.set("take_bribe", take_bribe);
  compMap.set("equip_caravan", equip_caravan);
  compMap.set("conduct_audit", conduct_audit);
  compMap.set("peculation", peculation);
  compMap.set("disperse_bribery", disperse_bribery);
  compMap.set("implement_sabotage", implement_sabotage);
  compMap.set("name_of_grand_prince", name_of_grand_prince);
  compMap.set("recruiting_vassals", recruiting_vassals);
  compMap.set("drain_the_swamps", drain_the_swamps);
  compMap.set("contract_to_cousin", contract_to_cousin);
  compMap.set("improving_the_city", improving_the_city);
  compMap.set("sermon_vassals", sermon_vassals);
  compMap.set("root_out_heresies", root_out_heresies);
  compMap.set("call_for_unity_vassals", call_for_unity_vassals);
  compMap.set("counterintelligence", counterintelligence);
  compMap.set("fabricate_a_denunciation", fabricate_a_denunciation);
  compMap.set("favoritism", favoritism);
  compMap.set("dev_the_economy", dev_the_economy);
  compMap.set("confused_mine", confused_mine);
  compMap.set("patronage_of_infidel", patronage_of_infidel);
  
  // Новые действия плагина vassals-and-robbers
  compMap.set("support_export", support_export);
  compMap.set("make_a_trip", make_a_trip);
  compMap.set("transfere_army", transfere_army);
  compMap.set("build_fort", build_fort);
  compMap.set("invest", invest);
  compMap.set("lease_cattle", lease_cattle);
  compMap.set("boost_innovation", boost_innovation);
  compMap.set("make_alliance", make_alliance);
  compMap.set("bring_gifts_to_foreign_countries", bring_gifts_to_foreign_countries);
  compMap.set("bring_gifts_to_russian_countries", bring_gifts_to_russian_countries);
  compMap.set("protect_caravan", protect_caravan);
  compMap.set("spy_away_mutiny", spy_away_mutiny);
  compMap.set("infiltrate_army", infiltrate_army);

  const props = defineProps({
    noble_job: {
      type: Object,
      required: true,
    },
  })

  const emit = defineEmits(['reload-actions']);

  const pat_settings = ref([]);
  const dialogStates = ref({});

  function closeDialog(i){
    pat_settings.value[i] = false; 
    emit('reload-actions');
  }
  
  // Отслеживаем состояние каждого диалога
  watch(pat_settings, (newVal, oldVal) => {
    newVal.forEach((isOpen, index) => {
      dialogStates.value[index] = isOpen;
    });
  }, { deep: true });

</script>

<template>
  <v-dialog 
    v-for="(action, i) in noble_job.political_action_types"
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
        @close-dialog="closeDialog(i)"
        :action="action"
        :noble_job="noble_job"
        :dialog-open="pat_settings[i]"
      />

    </v-card>
  </v-dialog>
</template>