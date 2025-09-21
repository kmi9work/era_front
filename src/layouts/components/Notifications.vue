<script setup>
  import { ref, onBeforeMount, computed } from 'vue'
  import axios from 'axios'

  const audits = ref([]);
  const not_read = ref([2])
  const expandedItems = ref(new Set())
  const expandedGroups = ref(new Set())

  const groupedAudits = computed(() => {
    const groups = {}
    
    audits.value.forEach(audit => {
      const category = getActionCategory(audit)
      const categoryKey = category.category
      
      if (!groups[categoryKey]) {
        groups[categoryKey] = {
          category: category,
          items: []
        }
      }
      
      groups[categoryKey].items.push(audit)
    })
    
    // Сортируем группы по количеству элементов (больше сначала)
    return Object.values(groups).sort((a, b) => b.items.length - a.items.length)
  })

  async function updateNotifications(){
    await axios.get(`${import.meta.env.VITE_PROXY}/audits.json`)
      .then(async (response) => {
        audits.value = response.data;
        // По умолчанию все группы скрыты
        expandedGroups.value = new Set()
      })
  }

  function toggleExpanded(itemId, event) {
    event.stopPropagation()
    if (expandedItems.value.has(itemId)) {
      expandedItems.value.delete(itemId)
    } else {
      expandedItems.value.add(itemId)
    }
  }

  function isExpanded(itemId) {
    return expandedItems.value.has(itemId)
  }

  function toggleGroupExpanded(categoryName, event) {
    event.stopPropagation()
    if (expandedGroups.value.has(categoryName)) {
      expandedGroups.value.delete(categoryName)
    } else {
      expandedGroups.value.add(categoryName)
    }
  }

  function isGroupExpanded(categoryName) {
    return expandedGroups.value.has(categoryName)
  }

  function getPoliticalActionDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, job_name, action_name, year, success } = audit
    
    if (auditable_type !== 'PoliticalAction') return null
    
    // Получаем информацию о должности из новых полей
    const jobName = job_name || auditable?.job_name || auditable?.job?.name || 'Неизвестная должность'
    
    // Получаем информацию об успехе
    let successText = 'Результат неизвестен'
    if (success !== undefined) {
      successText = success === 1 ? 'успешно' : 'неудачно'
    } else if (audited_changes && typeof audited_changes === 'object') {
      if (audited_changes.success !== undefined) {
        successText = audited_changes.success === 1 ? 'успешно' : 'неудачно'
      }
    }
    
    // Получаем год
    const actionYear = year || auditable?.year || 'неизвестный год'
    
    // Получаем название действия из новых полей
    const actionName = action_name || auditable?.action_name || auditable?.political_action_type?.name || action || 'Неизвестное действие'
    
    return `${jobName}: ${actionName.toLowerCase()} - ${successText} (${actionYear})`
  }

  function getInfluenceItemDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, player_name, value, comment, year } = audit
    
    if (auditable_type !== 'InfluenceItem') return null
    
    // Получаем имя игрока
    const playerName = player_name || auditable?.player_name || auditable?.player?.name || 'Неизвестный игрок'
    
    // Получаем значение влияния
    const influenceValue = value !== undefined ? value : auditable?.value
    if (influenceValue === undefined) return null
    
    // Формируем сжатое описание изменения влияния
    const changeText = influenceValue > 0 ? `+${influenceValue}` : `${influenceValue}`
    
    // Получаем комментарий
    const actionComment = comment || auditable?.comment || 'Без комментария'
    
    // Получаем год
    const actionYear = year || auditable?.year || 'неизвестный год'
    
    return `${playerName}: влияние ${changeText} - "${actionComment}" (${actionYear})`
  }

  function getSettlementDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, old_player_name, new_player_name, year } = audit
    
    if (auditable_type !== 'Settlement') return null
    
    // Получаем название поселения
    const settlementName = auditable?.name || 'Неизвестное поселение'
    
    // Получаем год из бэкенда
    const actionYear = year || audited_changes?.year || auditable?.year || 'неизвестный год'
    
    // Определяем действие
    if (action === 'create') {
      return `${settlementName} - создано (${actionYear})`
    } else if (action === 'destroy') {
      return `${settlementName} - уничтожено (${actionYear})`
    } else if (action === 'update' && (old_player_name !== undefined || new_player_name !== undefined)) {
      // Передача владения
      if (old_player_name === null || old_player_name === undefined) {
        return `${settlementName} - передано игроку ${new_player_name} (${actionYear})`
      } else if (new_player_name === null || new_player_name === undefined) {
        return `${settlementName} - отобрано у игрока ${old_player_name} (${actionYear})`
      } else {
        return `${settlementName} - передано от ${old_player_name} к ${new_player_name} (${actionYear})`
      }
    }
    
    return `${settlementName} - изменено (${actionYear})`
  }

  function getPublicOrderDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, region_name, year } = audit
    
    if (auditable_type !== 'PublicOrderItem') return null
    
    // Получаем данные из audited_changes
    const value = audited_changes?.value || auditable?.value || 0
    const comment = audited_changes?.comment || auditable?.comment || ''
    
    // Получаем название региона из бэкенда
    const regionName = region_name || 'неизвестном регионе'
    
    // Получаем год из бэкенда
    const actionYear = year || audited_changes?.year || auditable?.year || 'неизвестный год'
    
    // Формируем описание изменения
    const changeText = value > 0 ? `+${value}` : `${value}`
    
    return `ОП в ${regionName} ${changeText} (${comment}) (${actionYear})`
  }

  function getRegionDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, old_country_name, new_country_name, year } = audit
    
    if (auditable_type !== 'Region') return null
    
    // Получаем название региона
    const regionName = auditable?.name || 'Неизвестный регион'
    
    // Получаем год из бэкенда
    const actionYear = year || audited_changes?.year || auditable?.year || 'неизвестный год'
    
    // Определяем действие
    if (action === 'create') {
      return `${regionName} - создан (${actionYear})`
    } else if (action === 'destroy') {
      return `${regionName} - уничтожен (${actionYear})`
    } else if (action === 'update' && (old_country_name !== undefined || new_country_name !== undefined)) {
      // Присоединение к стране
      if (old_country_name === null || old_country_name === undefined) {
        return `${regionName} - присоединен к стране ${new_country_name} (${actionYear})`
      } else if (new_country_name === null || new_country_name === undefined) {
        return `${regionName} - отторгнут от страны ${old_country_name} (${actionYear})`
      } else {
        return `${regionName} - передан от ${old_country_name} к ${new_country_name} (${actionYear})`
      }
    }
    
    return `${regionName} - изменен (${actionYear})`
  }

  function getBuildingDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, settlement_name, building_type_name, building_level_level } = audit
    
    if (auditable_type !== 'Building') return null
    
    // Для удаления берем данные из audited_changes, так как auditable может быть null
    let settlementName, buildingType, level
    
    if (action === 'destroy') {
      // Для удаления берем данные из audited_changes
      settlementName = settlement_name || 'Неизвестное поселение'
      buildingType = building_type_name || 'Неизвестный тип'
      
      // Получаем уровень из audited_changes для удаления
      if (audited_changes && audited_changes.building_level) {
        if (Array.isArray(audited_changes.building_level)) {
          level = audited_changes.building_level[0] // Старый уровень (до удаления)
        } else {
          level = audited_changes.building_level
        }
      } else if (audited_changes && audited_changes.building_level_id) {
        if (Array.isArray(audited_changes.building_level_id)) {
          level = audited_changes.building_level_id[0] // Старый ID (до удаления)
        } else {
          level = audited_changes.building_level_id
        }
      }
      
      // Если уровень все еще null, используем building_level_level из бэкенда
      if (level === null) {
        level = building_level_level
      }
      
      return `${settlementName}: ${buildingType} (ур.${level}) - разрушено`
    }
    
    // Для других действий используем обычную логику
    // Получаем название поселения
    settlementName = settlement_name || auditable?.settlement_name || auditable?.settlement?.name || 'Неизвестное поселение'
    
    // Получаем тип здания
    buildingType = building_type_name || auditable?.building_type_name || 'Неизвестный тип'
    
    // Проверяем, является ли это оплатой церкви (изменение params)
    if (audited_changes && audited_changes.params && Array.isArray(audited_changes.params) && audited_changes.params.length === 2) {
      const [oldParams, newParams] = audited_changes.params
      
      // Проверяем изменение paid в params
      if (oldParams && newParams && oldParams.paid && newParams.paid) {
        const oldPaid = oldParams.paid
        const newPaid = newParams.paid
        
        // Определяем, была ли это оплата или отмена оплаты
        const currentYear = 1 // Используем 1 как текущий год из логов
        const wasPaid = oldPaid.includes(currentYear)
        const isPaid = newPaid.includes(currentYear)
        
        if (!wasPaid && isPaid) {
          return `${settlementName}: ${buildingType} - оплачено`
        } else if (wasPaid && !isPaid) {
          return `${settlementName}: ${buildingType} - оплата отменена`
        }
      }
    }
    
    // Получаем уровень здания из audited_changes (исторические данные)
    
    if (audited_changes && typeof audited_changes === 'object') {
      // Пробуем получить уровень из audited_changes.building_level
      if (audited_changes.building_level) {
        if (Array.isArray(audited_changes.building_level)) {
          // Массив [старый_уровень, новый_уровень]
          if (action === 'create') {
            // Для создания берем новый уровень
            level = audited_changes.building_level[1]
          } else if (action === 'update') {
            // Для обновления берем новый уровень (после улучшения)
            level = audited_changes.building_level[1]
          } else if (action === 'destroy') {
            // Для удаления берем старый уровень (до разрушения)
            level = audited_changes.building_level[0]
          }
        } else {
          // Если не массив, берем как есть
          level = audited_changes.building_level
        }
      }
      // Fallback на building_level_id если building_level недоступен
      else if (audited_changes.building_level_id) {
        // Если это массив [старый_id, новый_id], берем нужный
        if (Array.isArray(audited_changes.building_level_id)) {
          if (action === 'create') {
            // Для создания берем новый уровень
            level = audited_changes.building_level_id[1]
          } else if (action === 'update') {
            // Для обновления берем новый уровень (после улучшения)
            level = audited_changes.building_level_id[1]
          } else if (action === 'destroy') {
            // Для удаления берем старый уровень (до разрушения)
            level = audited_changes.building_level_id[0]
          }
        } else {
          // Если не массив, берем как есть
          level = audited_changes.building_level_id
        }
      }
    }
    
    // Если не удалось получить из audited_changes, используем текущий как fallback
    if (level === null) {
      level = building_level_level
    }
    
    // Получаем год
    const year = audited_changes?.year || auditable?.year || 'неизвестный год'
    
    // Определяем действие
    let actionText = 'изменено'
    if (action === 'create') {
      actionText = 'построено'
    } else if (action === 'update') {
      actionText = 'улучшено'
    } else if (action === 'destroy') {
      actionText = 'разрушено'
    }
    
    return `${settlementName}: ${buildingType} (ур.${level}) - ${actionText} (${year})`
  }

  function getActionCategory(audit) {
    const { auditable_type, action, auditable } = audit
    
    // Политические действия
    if (auditable_type === 'PoliticalAction') {
      const actionName = action.toLowerCase()
      
      // Действия купцов
      if (['sedition', 'charity', 'sabotage', 'contraband', 'open_gate', 'new_fisheries', 'people_support'].includes(actionName)) {
        return {
          category: 'Действия купцов',
          icon: 'mdi-store',
          color: '#4CAF50'
        }
      }
      
      // Все остальные политические действия
      return {
        category: 'Политические действия',
        icon: 'mdi-crown',
        color: '#FF9800'
      }
    }
    
    // Другие типы объектов
    if (auditable_type === 'Player') {
      return {
        category: 'Игрок',
        icon: 'mdi-account',
        color: '#795548'
      }
    }
    
    if (auditable_type === 'Settlement') {
      return {
        category: 'Владения',
        icon: 'mdi-city',
        color: '#3F51B5'
      }
    }
    
    if (auditable_type === 'Region') {
      return {
        category: 'Владения',
        icon: 'mdi-map',
        color: '#3F51B5'
      }
    }
    
    if (auditable_type === 'Army') {
      return {
        category: 'Армия',
        icon: 'mdi-shield-account',
        color: '#E91E63'
      }
    }
    
    if (auditable_type === 'Plant') {
      return {
        category: 'Производство',
        icon: 'mdi-factory',
        color: '#8BC34A'
      }
    }
    
    if (auditable_type === 'Building') {
      return {
        category: 'Строительство',
        icon: 'mdi-home-city',
        color: '#FF5722'
      }
    }
    
    if (auditable_type === 'Credit') {
      return {
        category: 'Финансы',
        icon: 'mdi-currency-usd',
        color: '#4CAF50'
      }
    }
    
    if (auditable_type === 'InfluenceItem') {
      return {
        category: 'Влияние',
        icon: 'mdi-account-star',
        color: '#FF6B35'
      }
    }
    
    if (auditable_type === 'PublicOrderItem') {
      return {
        category: 'Общественный порядок',
        icon: 'mdi-scale-balance',
        color: '#9C27B0'
      }
    }
    
    // По умолчанию
    return {
      category: 'Прочее',
      icon: 'mdi-help-circle',
      color: '#9E9E9E'
    }
  }

  onBeforeMount(async () => {
    updateNotifications()
  })
</script>

<template>
  <IconBtn class="cursor-pointer" @click="updateNotifications()">
    <VIcon icon="ri-notification-line" />
    <VMenu
      activator="parent"
      location="bottom end"
      offset="14px"
    >

      <v-card class="mx-auto" max-width="500">
        <v-toolbar color="pink">
          <v-btn icon="mdi-menu"></v-btn>

          <v-toolbar-title>Новые действия</v-toolbar-title>

          <v-spacer></v-spacer>

          <v-btn icon="mdi-magnify"></v-btn>

          <v-btn icon="mdi-checkbox-marked-circle"></v-btn>
        </v-toolbar>

        <div class="notifications-list">
          <div
            v-for="group in groupedAudits"
            :key="group.category.category"
            class="category-group"
          >
            <div class="category-header" @click="toggleGroupExpanded(group.category.category, $event)">
              <div class="category-title">
                <v-icon :icon="group.category.icon" size="small" class="category-header-icon" :style="{ color: group.category.color }"></v-icon>
                <span>{{ group.category.category }}</span>
                <span class="category-count">({{ group.items.length }})</span>
              </div>
              <v-icon 
                :class="['group-expand-icon', { 'expanded': isGroupExpanded(group.category.category) }]"
                size="small"
              >
                mdi-chevron-down
              </v-icon>
            </div>
            
            <div class="category-items" v-if="isGroupExpanded(group.category.category)">
              <div
                v-for="audit in group.items"
                :key="audit.id"
                class="notification-item"
                :class="{ 'expanded': isExpanded(audit.id) }"
                @click="toggleExpanded(audit.id, $event)"
              >
                <div class="notification-content">
                  <div class="notification-header">
                    <div class="notification-title">
                      <div class="action-title">
                        {{audit.id}}. {{ audit.auditable?.name || audit.auditable?.comment || audit.auditable_type }}
                      </div>
                    </div>
                    <button 
                      class="expand-btn"
                      @click="toggleExpanded(audit.id, $event)"
                    >
                      <v-icon 
                        :class="['expand-icon', { 'expanded': isExpanded(audit.id) }]"
                        size="small"
                      >
                        mdi-chevron-down
                      </v-icon>
                    </button>
                  </div>
                  
                  <div 
                    class="notification-subtitle"
                    :class="isExpanded(audit.id) ? 'expanded' : 'truncated'"
                  >
                    <div class="action-description">
                      <template v-if="getPoliticalActionDescription(audit)">
                        {{ getPoliticalActionDescription(audit) }}
                      </template>
                      <template v-else-if="getInfluenceItemDescription(audit)">
                        {{ getInfluenceItemDescription(audit) }}
                      </template>
                      <template v-else-if="getBuildingDescription(audit)">
                        {{ getBuildingDescription(audit) }}
                      </template>
                      <template v-else-if="getSettlementDescription(audit)">
                        {{ getSettlementDescription(audit) }}
                      </template>
                      <template v-else-if="getRegionDescription(audit)">
                        {{ getRegionDescription(audit) }}
                      </template>
                      <template v-else-if="getPublicOrderDescription(audit)">
                        {{ getPublicOrderDescription(audit) }}
                      </template>
                      <template v-else>
                        <strong>{{ audit.action }}:</strong> {{audit.audited_changes}}
                      </template>
                    </div>
                  </div>
                  
                  <div class="notification-meta">
                    <span class="user-name">
                      {{ audit.user?.name }}
                      <span v-if="audit.user?.job" class="user-job">({{ audit.user.job }})</span>
                    </span>
                    <span class="timestamp">{{ new Date(audit.created_at).toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card>
    </VMenu>
  </IconBtn>

</template>

<style scoped>
.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.category-group {
  margin-bottom: 16px;
}

.category-group:last-child {
  margin-bottom: 0;
}

.category-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 8px 16px;
  border-radius: 8px 8px 0 0;
  border-bottom: 2px solid #dee2e6;
  margin-bottom: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  user-select: none;
}

.category-header:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.category-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  color: #495057;
}

.category-header-icon {
  margin-right: 8px;
  font-size: 16px;
}

.category-count {
  margin-left: 8px;
  background-color: #6c757d;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.group-expand-icon {
  transition: transform 0.3s ease;
  color: #6c757d;
  margin-left: 8px;
}

.group-expand-icon.expanded {
  transform: rotate(180deg);
  color: #495057;
}

.category-items {
  background-color: white;
  border-radius: 0 0 8px 8px;
  border: 1px solid #dee2e6;
  border-top: none;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

.notification-item {
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f5f5f5;
}

.notification-item.expanded {
  background-color: #f8f9fa;
}

.notification-content {
  padding: 16px;
}

.notification-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.notification-title {
  flex: 1;
  margin-right: 12px;
  line-height: 1.4;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-icon {
  margin-right: 4px;
  color: white !important;
}

.category-text {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-title {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  line-height: 1.3;
}

.action-description {
  margin-bottom: 4px;
}

.category-description {
  font-style: italic;
  color: #666;
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border-left: 3px solid #ddd;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
}

.expand-btn:hover {
  background-color: #e0e0e0;
}

.expand-icon {
  transition: transform 0.3s ease;
  color: #666;
}

.expand-icon.expanded {
  transform: rotate(180deg);
  color: #1976d2;
}

.notification-subtitle {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.notification-subtitle.truncated {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.notification-subtitle.expanded {
  white-space: normal;
  word-wrap: break-word;
}

.notification-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.user-name {
  font-weight: 500;
  color: #666;
}

.user-job {
  font-weight: 400;
  color: #999;
  font-style: italic;
  margin-left: 4px;
}

.timestamp {
  color: #999;
}

/* Скроллбар */
.notifications-list::-webkit-scrollbar {
  width: 6px;
}

.notifications-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>