<script setup>
/**
 * «Экономика» в игре many_teams.
 *
 * Вкладки повторяют экран ядра (правки ядра не нужны), но во вкладку «Дашборд»
 * добавлены блоки плагина:
 *  - «Эмбарго по гильдиям» — страна накладывает эмбарго на гильдию, кнопка
 *    «на все гильдии страны» (п. 9) и снятие всех эмбарго Великим князем (п. 10);
 *  - «Добыча по гильдиям» — показатель «можно ли добывать» для пары
 *    «государство × гильдия» (п. 4), меняется действием Казначея (п. 5).
 */
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GuildsDashboard from '@/views/pages/economics/GuildsDashboard.vue'
import Exchange from '@/views/pages/economics/Exchange.vue'
import PoliticalActions from '@/views/pages/economics/PoliticalActions.vue'
import ProductionFront from '@/views/pages/economics/ProductionFront.vue'
import TradeTurnover from '@/views/pages/economics/TradeTurnover.vue'
import GuildEmbargoPanel from '../components/GuildEmbargoPanel.vue'
import GuildPermissionsPanel from '../components/GuildPermissionsPanel.vue'
import { engineApi } from '../api'
import { useCurrentCountry } from '@/composables/useCurrentCountry'

const route = useRoute()
const activeTab = ref(route.params.tab || 'dashboard')
const exchangeKey = ref(0)

const { currentCountryId, loadCurrentCountry } = useCurrentCountry()

// «Рынок»: эмбарго накладывается на гильдию, поэтому подсветка зависит от
// выбранной гильдии. Карту «страна → есть эмбарго» считает движок
// (GET /many_teams/guild_embargoes/market), карта уходит в ядро Exchange
// пропсом embargoCountries вместо странового флага params["embargo"].
const marketEmbargo = ref({})
const selectedGuildId = ref(null)

const loadMarketEmbargo = async () => {
  marketEmbargo.value = {}
  if (!selectedGuildId.value) return
  try {
    const { data } = await engineApi.getMarketEmbargoes(selectedGuildId.value, currentCountryId.value)
    marketEmbargo.value = Object.fromEntries(
      (data?.countries || []).map(country => [country.id, Boolean(country.embargoed)])
    )
  } catch (e) {
    // Нет движка — считаем, что эмбарго нет: страновой флаг ядра в many_teams
    // не используется (эмбарго накладывается только на гильдию)
    marketEmbargo.value = {}
  }
}

const onGuildSelected = (guildId) => {
  selectedGuildId.value = guildId || null
  if (!selectedGuildId.value) {
    marketEmbargo.value = {}
    return
  }
  loadMarketEmbargo()
}

watch(activeTab, (newTab) => {
  if (newTab === 'exchange') {
    exchangeKey.value += 1
    loadCurrentCountry()
  }
})

// Переключение государства в шапке: карта эмбарго относится к гильдиям
// прошлого государства и больше не действует.
watch(currentCountryId, () => {
  selectedGuildId.value = null
  marketEmbargo.value = {}
})

const tabs = [
  { title: 'Дашборд', icon: 'ri-dashboard-line', tab: 'dashboard' },
  { title: 'Рынок', icon: 'ri-exchange-line', tab: 'exchange' },
  { title: 'Политические действия', icon: 'ri-shake-hands-line', tab: 'buyer_actions' },
  { title: 'Товарооборот', icon: 'ri-arrow-left-right-line', tab: 'trade_turnover' },
  { title: 'Производство', icon: 'ri-cpu-line', tab: 'production_front' },
]
</script>

<template>
  <div>
    <VTabs
      v-model="activeTab"
      show-arrows
      class="v-tabs-pill"
    >
      <VTab
        v-for="item in tabs"
        :key="item.icon"
        :value="item.tab"
      >
        <VIcon
          size="20"
          start
          :icon="item.icon"
        />
        {{ item.title }}
      </VTab>
    </VTabs>

    <VWindow
      v-model="activeTab"
      class="mt-5 disable-tab-transition"
      :touch="false"
    >
      <VWindowItem value="dashboard">
        <GuildsDashboard />
        <GuildEmbargoPanel />
        <GuildPermissionsPanel />
      </VWindowItem>

      <VWindowItem
        value="exchange"
        :key="exchangeKey"
      >
        <Exchange
          :embargo-countries="marketEmbargo"
          embargo-dialog-title="Эта страна наложила эмбарго на гильдию!"
          embargo-dialog-text="Караван этой гильдии не пройдёт без карточки «Контрабанда»."
          @guild-selected="onGuildSelected"
        />
      </VWindowItem>

      <VWindowItem value="trade_turnover">
        <TradeTurnover />
      </VWindowItem>

      <VWindowItem value="production_front">
        <ProductionFront />
      </VWindowItem>

      <VWindowItem value="buyer_actions">
        <PoliticalActions />
      </VWindowItem>
    </VWindow>
  </div>
</template>
