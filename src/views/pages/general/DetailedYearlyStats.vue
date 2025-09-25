<script setup>
import { ref, onBeforeMount, computed } from 'vue'
import axios from 'axios'

const detailedStats = ref({})
const selectedYear = ref(1) // Текущий год по умолчанию
const loading = ref(false)

// Загружаем подробную статистику за выбранный год
async function loadDetailedStats(year) {
  loading.value = true
  try {
    const response = await axios.get(`${import.meta.env.VITE_PROXY}/audits/detailed_yearly_stats.json?year=${year}`)
    detailedStats.value = response.data
  } catch (error) {
    console.error('Ошибка при загрузке подробной статистики:', error)
  } finally {
    loading.value = false
  }
}

// Получаем доступные годы (пока статично, можно сделать динамически)
const availableYears = computed(() => {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Можно расширить
})

// Переключаем год
function changeYear(year) {
  selectedYear.value = year
  loadDetailedStats(year)
}

onBeforeMount(() => {
  loadDetailedStats(selectedYear.value)
})
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Сводка событий за {{ selectedYear }} год</VCardTitle>
      <VCardSubtitle>Подробный отчет о произошедших событиях</VCardSubtitle>
      
      <template #append>
        <VSelect
          v-model="selectedYear"
          :items="availableYears"
          label="Выберите год"
          @update:model-value="changeYear"
          style="min-width: 120px"
        />
      </template>
    </VCardItem>

    <VCardText v-if="loading" class="text-center py-8">
      <VProgressCircular indeterminate color="primary" />
      <div class="mt-2">Загрузка сводки...</div>
    </VCardText>

    <VCardText v-else-if="!detailedStats || Object.keys(detailedStats).filter(key => key !== 'year').length === 0" class="text-center py-4">
      <VIcon icon="ri-calendar-line" size="48" class="text-disabled mb-2" />
      <div class="text-body-1 text-disabled">В этом году ничего не происходило</div>
    </VCardText>
    
    <VCardText v-else class="pa-6">
      <div class="yearly-summary">
        <!-- Оплата армий -->
        <div v-if="detailedStats.army_payments" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-shield-account" class="me-2" color="pink" />
            <h3 class="text-h6">Оплата армий</h3>
          </div>
          <div class="section-content">
            <p v-if="detailedStats.army_payments.paid_count > 0" class="text-body-1">
              <VIcon icon="mdi-check-circle" color="success" class="me-1" />
              <strong>Оплачено отрядов:</strong> {{ detailedStats.army_payments.paid_count }}
            </p>
            <div v-if="detailedStats.army_payments.paid_troops?.length > 0" class="mt-2">
              <div v-for="(troop, index) in detailedStats.army_payments.paid_troops" :key="index" class="text-body-2">
                <VIcon icon="mdi-check" color="success" class="me-1" />
                <span><strong>{{ troop.troop_type }}</strong> в армии <strong>{{ troop.army_name }}</strong> (<strong>{{ troop.owner_name }}</strong>)</span>
              </div>
            </div>
            
            <p v-if="detailedStats.army_payments.unpaid_count > 0" class="text-body-1 mt-3">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Неоплачено отрядов:</strong> {{ detailedStats.army_payments.unpaid_count }}
            </p>
            <div v-if="detailedStats.army_payments.unpaid_troops?.length > 0" class="mt-2">
              <div v-for="(troop, index) in detailedStats.army_payments.unpaid_troops" :key="index" class="text-body-2">
                <VIcon icon="mdi-close" color="error" class="me-1" />
                <span><strong>{{ troop.troop_type }}</strong> в армии <strong>{{ troop.army_name }}</strong> (<strong>{{ troop.owner_name }}</strong>)</span>
              </div>
            </div>
            
            <p v-if="!detailedStats.army_payments.paid_count && !detailedStats.army_payments.unpaid_count" class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Отряды не оплачивались</strong>
            </p>
          </div>
        </div>

        <!-- Госрасходы -->
        <div v-if="detailedStats.state_expenses" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-cog" class="me-2" color="blue-grey" />
            <h3 class="text-h6">Госрасходы</h3>
          </div>
          <div class="section-content">
            <p v-if="detailedStats.state_expenses.final_state === 'paid'" class="text-body-1">
              <VIcon icon="mdi-check-circle" color="success" class="me-1" />
              <strong>Госрасходы оплачены</strong>
            </p>
            <p v-else-if="detailedStats.state_expenses.final_state === 'unpaid'" class="text-body-1">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Госрасходы не оплачены</strong>
            </p>
            <p v-else class="text-body-1 text-disabled">
              <VIcon icon="mdi-help-circle" color="grey" class="me-1" />
              <strong>Состояние госрасходов неизвестно</strong>
            </p>
          </div>
        </div>

        <!-- Присоединение владений -->
        <div v-if="detailedStats.region_annexations" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-domain" class="me-2" color="blue" />
            <h3 class="text-h6">Присоединение владений</h3>
          </div>
          <div class="section-content">
            <p v-if="detailedStats.region_annexations.total_annexations > 0" class="text-body-1">
              <strong>Всего присоединено владений:</strong> {{ detailedStats.region_annexations.total_annexations }}
            </p>
            
            <!-- Присоединения к Руси -->
            <div v-if="detailedStats.region_annexations.to_russia?.count > 0" class="mt-3">
              <p class="text-body-1">
                <VIcon icon="mdi-flag" color="success" class="me-1" />
                <strong>К Руси присоединено:</strong> {{ detailedStats.region_annexations.to_russia.count }}
              </p>
              <div v-if="detailedStats.region_annexations.to_russia.regions?.length > 0" class="mt-2">
                <div v-for="(region, index) in detailedStats.region_annexations.to_russia.regions" :key="index" class="text-body-2">
                  <VIcon icon="mdi-check" color="success" class="me-1" />
                  <span><strong>{{ region }}</strong></span>
                </div>
              </div>
            </div>
            
            <!-- Присоединения к другим странам -->
            <div v-if="detailedStats.region_annexations.to_other_countries?.count > 0" class="mt-3">
              <p class="text-body-1">
                <VIcon icon="mdi-flag" color="warning" class="me-1" />
                <strong>К другим странам присоединено:</strong> {{ detailedStats.region_annexations.to_other_countries.count }}
              </p>
              <div v-if="detailedStats.region_annexations.to_other_countries.by_country" class="mt-2">
                <div v-for="(regions, country) in detailedStats.region_annexations.to_other_countries.by_country" :key="country" class="mb-2">
                  <div class="text-body-2">
                    <VIcon icon="mdi-flag" color="warning" class="me-1" />
                    <span><strong>{{ country }}:</strong></span>
                  </div>
                  <div v-for="(region, index) in regions" :key="index" class="text-body-2 ml-4">
                    <VIcon icon="mdi-arrow-right" class="me-1" />
                    <span><strong>{{ region }}</strong></span>
                  </div>
                </div>
              </div>
            </div>
            
            <p v-if="!detailedStats.region_annexations.total_annexations" class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Владения не присоединялись</strong>
            </p>
          </div>
        </div>

        <!-- Передача регионов игрокам -->
        <div v-if="detailedStats.region_transfers" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-account-switch" class="me-2" color="purple" />
            <h3 class="text-h6">Передача регионов игрокам</h3>
          </div>
          <div class="section-content">
            <p v-if="detailedStats.region_transfers.total_transfers > 0" class="text-body-1">
              <strong>Всего передано регионов:</strong> {{ detailedStats.region_transfers.total_transfers }}
            </p>
            <div v-if="detailedStats.region_transfers.by_player" class="mt-2">
              <div v-for="(regions, player) in detailedStats.region_transfers.by_player" :key="player" class="mb-2">
                <div class="text-body-2">
                  <VIcon icon="mdi-account" color="purple" class="me-1" />
                  <span><strong>{{ player }}:</strong></span>
                </div>
                <div v-for="(region, index) in regions" :key="index" class="text-body-2 ml-4">
                  <VIcon icon="mdi-arrow-right" class="me-1" />
                  <span><strong>{{ region }}</strong></span>
                </div>
              </div>
            </div>
            <p v-else class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Регионы игрокам не передавались</strong>
            </p>
          </div>
        </div>

        <!-- Сражения -->
        <div v-if="detailedStats.battles" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-sword-cross" class="me-2" color="red" />
            <h3 class="text-h6">Сражения</h3>
          </div>
          <div class="section-content">
            <p v-if="detailedStats.battles.total_battles > 0" class="text-body-1">
              <strong>Всего сражений:</strong> {{ detailedStats.battles.total_battles }}
            </p>
            <div v-if="detailedStats.battles.battles?.length > 0" class="mt-2">
              <div v-for="(battle, index) in detailedStats.battles.battles" :key="index" class="battle-item">
                <VIcon icon="mdi-sword" class="me-1" color="red" />
                <span><strong>{{ battle.attacker }}</strong> vs <strong>{{ battle.defender }}</strong> → <strong class="text-success">{{ battle.winner }}</strong> победил</span>
              </div>
            </div>
            <p v-else class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Сражений не было</strong>
            </p>
          </div>
        </div>

        <!-- Смена должностей -->
        <div v-if="detailedStats.job_changes" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-account-tie" class="me-2" color="deep-purple" />
            <h3 class="text-h6">Смена должностей</h3>
          </div>
          <div class="section-content">
            <p v-if="detailedStats.job_changes.total_changes > 0" class="text-body-1">
              <strong>Всего изменений должностей:</strong> {{ detailedStats.job_changes.total_changes }}
            </p>
            <div v-if="detailedStats.job_changes.changes?.length > 0" class="mt-2">
              <div v-for="(change, index) in detailedStats.job_changes.changes" :key="index" class="text-body-2">
                <VIcon icon="mdi-account-switch" class="me-1" />
                <span><strong>{{ change.job_name }}:</strong> {{ change.comment }}</span>
              </div>
            </div>
            <p v-else class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Должности не менялись</strong>
            </p>
          </div>
        </div>

        <!-- Действия знати -->
        <div v-if="detailedStats.noble_actions" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-crown" class="me-2" color="orange" />
            <h3 class="text-h6">Действия знати</h3>
          </div>
          <div class="section-content">
            <div v-if="detailedStats.noble_actions.total_successful > 0 || detailedStats.noble_actions.total_failed > 0" class="mb-2">
              <p v-if="detailedStats.noble_actions.total_successful > 0" class="text-body-1">
                <VIcon icon="mdi-check-circle" color="success" class="me-1" />
                <strong>Успешных действий:</strong> {{ detailedStats.noble_actions.total_successful }}
              </p>
              <p v-if="detailedStats.noble_actions.total_failed > 0" class="text-body-1">
                <VIcon icon="mdi-close-circle" color="error" class="me-1" />
                <strong>Неудачных действий:</strong> {{ detailedStats.noble_actions.total_failed }}
              </p>
            </div>
            <div v-if="detailedStats.noble_actions.successful_by_type" class="mt-2">
              <div v-for="(count, type) in detailedStats.noble_actions.successful_by_type" :key="type" class="text-body-2">
                <VIcon icon="mdi-check" color="success" class="me-1" />
                <span><strong>{{ type }}:</strong> {{ count }} успешных</span>
              </div>
            </div>
            <p v-if="!detailedStats.noble_actions.total_successful && !detailedStats.noble_actions.total_failed" class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Политических действий не было</strong>
            </p>
          </div>
        </div>

        <!-- Постройки -->
        <div v-if="detailedStats.buildings" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-hammer-wrench" class="me-2" color="purple" />
            <h3 class="text-h6">Постройки</h3>
          </div>
          <div class="section-content">
            <div v-if="detailedStats.buildings.total_created > 0 || detailedStats.buildings.total_updated > 0 || detailedStats.buildings.total_destroyed > 0" class="mb-2">
              <p v-if="detailedStats.buildings.total_created > 0" class="text-body-1">
                <VIcon icon="mdi-plus-circle" color="success" class="me-1" />
                <strong>Построено:</strong> {{ detailedStats.buildings.total_created }}
              </p>
              <p v-if="detailedStats.buildings.total_updated > 0" class="text-body-1">
                <VIcon icon="mdi-update" color="info" class="me-1" />
                <strong>Улучшено:</strong> {{ detailedStats.buildings.total_updated }}
              </p>
              <p v-if="detailedStats.buildings.total_destroyed > 0" class="text-body-1">
                <VIcon icon="mdi-minus-circle" color="error" class="me-1" />
                <strong>Разрушено:</strong> {{ detailedStats.buildings.total_destroyed }}
              </p>
            </div>
            <div v-if="detailedStats.buildings.created_by_type" class="mt-2">
              <div v-for="(count, type) in detailedStats.buildings.created_by_type" :key="type" class="text-body-2">
                <VIcon icon="mdi-home" class="me-1" />
                <span><strong>{{ type }}:</strong> {{ count }} построено</span>
              </div>
            </div>
            <p v-if="!detailedStats.buildings.total_created && !detailedStats.buildings.total_updated && !detailedStats.buildings.total_destroyed" class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Постройки не возводились</strong>
            </p>
          </div>
        </div>

        <!-- Общественный порядок -->
        <div v-if="detailedStats.public_order_changes" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-gavel" class="me-2" color="warning" />
            <h3 class="text-h6">Общественный порядок</h3>
          </div>
          <div class="section-content">
            <p v-if="detailedStats.public_order_changes.total_changes > 0" class="text-body-1">
              <strong>Всего изменений:</strong> {{ detailedStats.public_order_changes.total_changes }}
            </p>
            <div v-if="detailedStats.public_order_changes.by_region" class="mt-2">
              <div v-for="(value, region) in detailedStats.public_order_changes.by_region" :key="region" class="text-body-2">
                <VIcon :icon="value > 0 ? 'mdi-trending-up' : 'mdi-trending-down'" :color="value > 0 ? 'success' : 'error'" class="me-1" />
                <span><strong>{{ region }}:</strong> {{ value > 0 ? '+' : '' }}{{ value }}</span>
              </div>
            </div>
            <p v-else class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Изменений общественного порядка не было</strong>
            </p>
          </div>
        </div>

        <!-- Технологии -->
        <div v-if="detailedStats.technologies" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-cog" class="me-2" color="indigo" />
            <h3 class="text-h6">Технологии</h3>
          </div>
          <div class="section-content">
            <div v-if="detailedStats.technologies.total_opened > 0 || detailedStats.technologies.total_closed > 0" class="mb-2">
              <p v-if="detailedStats.technologies.total_opened > 0" class="text-body-1">
                <VIcon icon="mdi-check-circle" color="success" class="me-1" />
                <strong>Открыто технологий:</strong> {{ detailedStats.technologies.total_opened }}
              </p>
              <p v-if="detailedStats.technologies.total_closed > 0" class="text-body-1">
                <VIcon icon="mdi-close-circle" color="error" class="me-1" />
                <strong>Закрыто технологий:</strong> {{ detailedStats.technologies.total_closed }}
              </p>
            </div>
            <div v-if="detailedStats.technologies.opened_technologies?.length > 0" class="mt-2">
              <div v-for="tech in detailedStats.technologies.opened_technologies" :key="tech" class="text-body-2">
                <VIcon icon="mdi-lightbulb-on" color="success" class="me-1" />
                <span><strong>{{ tech }}</strong> - открыта</span>
              </div>
            </div>
            <p v-if="!detailedStats.technologies.total_opened && !detailedStats.technologies.total_closed" class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Технологии не развивались</strong>
            </p>
          </div>
        </div>

        <!-- Изменения отношений -->
        <div v-if="detailedStats.relations" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-handshake" class="me-2" color="blue" />
            <h3 class="text-h6">Изменения отношений</h3>
          </div>
          <div class="section-content">
            <p v-if="detailedStats.relations.total_changes > 0" class="text-body-1">
              <strong>Всего изменений отношений:</strong> {{ detailedStats.relations.total_changes }}
            </p>
            <div v-if="detailedStats.relations.by_country?.length > 0" class="mt-2">
              <div v-for="country in detailedStats.relations.by_country" :key="country.country_name" class="mb-2">
                <div class="text-body-2">
                  <VIcon icon="mdi-flag" color="blue" class="me-1" />
                  <span><strong>{{ country.country_name }}:</strong></span>
                  <span :class="country.total_value > 0 ? 'text-success' : country.total_value < 0 ? 'text-error' : ''">
                    {{ country.total_value > 0 ? '+' : '' }}{{ country.total_value }}
                  </span>
                </div>
                <div v-for="(change, index) in country.changes" :key="index" class="text-body-2 ml-4">
                  <VIcon :icon="change.value > 0 ? 'mdi-trending-up' : 'mdi-trending-down'" :color="change.value > 0 ? 'success' : 'error'" class="me-1" />
                  <span>{{ change.value > 0 ? '+' : '' }}{{ change.value }}</span>
                  <span v-if="change.comment">({{ change.comment }})</span>
                </div>
              </div>
            </div>
            <p v-else class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Отношения не изменялись</strong>
            </p>
          </div>
        </div>

        <!-- Изменения эмбарго -->
        <div v-if="detailedStats.embargo_changes" class="summary-section mb-6">
          <div class="section-header">
            <VIcon icon="mdi-flag" class="me-2" color="orange" />
            <h3 class="text-h6">Изменения эмбарго</h3>
          </div>
          <div class="section-content">
            <p v-if="detailedStats.embargo_changes.total_changes > 0" class="text-body-1">
              <strong>Всего изменений эмбарго:</strong> {{ detailedStats.embargo_changes.total_changes }}
            </p>
            <div v-if="detailedStats.embargo_changes.changes?.length > 0" class="mt-2">
              <div v-for="(change, index) in detailedStats.embargo_changes.changes" :key="index" class="text-body-2">
                <VIcon :icon="change.action === 'введено' ? 'mdi-flag' : 'mdi-flag-off'" :color="change.action === 'введено' ? 'error' : 'success'" class="me-1" />
                <span><strong>{{ change.country_name }}:</strong> эмбарго {{ change.action }}</span>
              </div>
            </div>
            <p v-else class="text-body-1 text-disabled">
              <VIcon icon="mdi-close-circle" color="error" class="me-1" />
              <strong>Эмбарго не изменялось</strong>
            </p>
          </div>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.yearly-summary {
  max-width: 800px;
  margin: 0 auto;
}

.summary-section {
  border-left: 4px solid #e0e0e0;
  padding-left: 16px;
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.section-header h3 {
  margin: 0;
  color: #1976d2;
}

.section-content p {
  margin: 8px 0;
  display: flex;
  align-items: center;
}

.battle-item {
  margin: 8px 0;
  padding: 8px;
  background: #fff3e0;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.text-body-2 {
  margin: 4px 0;
  display: flex;
  align-items: center;
}
</style>