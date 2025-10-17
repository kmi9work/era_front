<script setup>
  import { ref, onBeforeMount, computed } from 'vue'
  import axios from 'axios'

  const audits = ref([]);
  const not_read = ref([2])
  const expandedItems = ref(new Set())
  const expandedGroups = ref(new Set())
  const viewedAudits = ref(new Set())

  const groupedAudits = computed(() => {
    const groups = {}
    
    audits.value.forEach(audit => {
      const category = getActionCategory(audit)
      const categoryKey = category.category
      
      if (!groups[categoryKey]) {
        groups[categoryKey] = {
          category: category,
          items: [],
          unviewedItems: []
        }
      }
      
      groups[categoryKey].items.push(audit)
      
      // Добавляем в непросмотренные, если событие не просмотрено
      if (!audit.is_viewed) {
        groups[categoryKey].unviewedItems.push(audit)
      }
    })
    
    // Сортируем группы по алфавиту названий категорий
    return Object.values(groups).sort((a, b) => a.category.category.localeCompare(b.category.category))
  })

  // Подсчитываем общее количество непросмотренных событий
  const totalUnviewedCount = computed(() => {
    return audits.value.filter(audit => !audit.is_viewed).length
  })

  async function updateNotifications(){
    await axios.get(`${import.meta.env.VITE_PROXY}/audits.json`)
      .then(async (response) => {
        audits.value = response.data;
        // Не сбрасываем состояние групп при обновлении данных
      })
  }

  function toggleExpanded(itemId, event) {
    // Останавливаем всплытие события
    event.stopPropagation()
    event.preventDefault()
    
    if (expandedItems.value.has(itemId)) {
      expandedItems.value.delete(itemId)
    } else {
      expandedItems.value.add(itemId)
      // Отмечаем событие как просмотренное при клике на него
      markAuditAsViewed(itemId)
    }
  }

  function isExpanded(itemId) {
    return expandedItems.value.has(itemId)
  }

  function toggleGroupExpanded(categoryName, event) {
    event.stopPropagation()
    
    // Проверяем, что клик был именно на заголовке группы, а не на элементе события
    if (event.target.closest('.notification-item')) {
      return
    }
    
    if (expandedGroups.value.has(categoryName)) {
      expandedGroups.value.delete(categoryName)
    } else {
      expandedGroups.value.add(categoryName)
    }
  }

  function isGroupExpanded(categoryName) {
    return expandedGroups.value.has(categoryName)
  }

  async function markAuditAsViewed(auditId) {
    // Проверяем, не просмотрено ли уже событие
    const audit = audits.value.find(a => a.id === auditId)
    if (audit && audit.is_viewed) {
      console.log(`Событие ${auditId} уже просмотрено, запрос не отправляется`)
      return // Событие уже просмотрено, не отправляем запрос
    }
    
    try {
      await axios.post(`${import.meta.env.VITE_PROXY}/audits/mark_as_viewed`, {
        audit_id: auditId
      })
      
      // Обновляем локальное состояние для конкретного события
      if (audit) {
        audit.is_viewed = true
        // Принудительно обновляем реактивность
        audits.value = [...audits.value]
      }
    } catch (error) {
      console.error('Ошибка при отметке события как просмотренное:', error)
    }
  }

  async function markAllAsViewed() {
    // Находим все непросмотренные события
    const unviewedAudits = audits.value.filter(audit => !audit.is_viewed)
    
    if (unviewedAudits.length === 0) {
      console.log('Все события уже просмотрены')
      return
    }
    
    try {
      // Отправляем запрос на новый endpoint для отметки всех событий
      const response = await axios.post(`${import.meta.env.VITE_PROXY}/audits/mark_all_as_viewed`)
      
      // Обновляем локальное состояние для всех непросмотренных событий
      unviewedAudits.forEach(audit => {
        audit.is_viewed = true
      })
      
      // Принудительно обновляем реактивность
      audits.value = [...audits.value]
      
    } catch (error) {
      console.error('Ошибка при отметке всех событий как просмотренных:', error)
    }
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
    const actionYear = year || 'неизвестный год'
    
    // Получаем название действия из новых полей
    const actionName = action_name || auditable?.action_name || auditable?.political_action_type?.name || action || 'Неизвестное действие'
    
    return `${jobName}: ${actionName.toLowerCase()} - ${successText} (${actionYear})`
  }

  function getInfluenceItemDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, player_name, value, comment, year } = audit
    
    if (auditable_type !== 'InfluenceItem') return null
    
    // Получаем имя игрока (бэкенд уже предоставляет player_name)
    const playerName = player_name || 'Неизвестный игрок'
    
    // Получаем значение влияния (бэкенд уже предоставляет value)
    const influenceValue = value
    if (influenceValue === undefined) return null
    
    // Формируем сжатое описание изменения влияния
    const changeText = influenceValue > 0 ? `+${influenceValue}` : `${influenceValue}`
    
    // Получаем комментарий (бэкенд уже предоставляет comment)
    const actionComment = comment || 'Без комментария'
    
    // Получаем год
    const actionYear = year || 'неизвестный год'
    
    // Определяем действие
    let actionText = 'изменено'
    if (action === 'create') {
      actionText = 'добавлено'
    } else if (action === 'destroy') {
      actionText = 'удалено'
    }
    
    return `${playerName}: влияние ${changeText} - "${actionComment}" (${actionText}) (${actionYear})`
  }

  function getSettlementDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, old_player_name, new_player_name, year } = audit
    
    if (auditable_type !== 'Settlement') return null
    
    // Получаем название поселения
    const settlementName = auditable?.name || 'Неизвестное поселение'
    
    // Получаем год из бэкенда
    const actionYear = year || 'неизвестный год'
    
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
    const actionYear = year || 'неизвестный год'
    
    // Формируем описание изменения
    const changeText = value > 0 ? `+${value}` : `${value}`
    
    return `ОП в ${regionName} ${changeText} (${comment}) (${actionYear})`
  }

  function getTechnologyDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, year, technology_name } = audit
    
    if (auditable_type !== 'TechnologyItem') return null
    
    // Получаем данные из audited_changes
    const value = audited_changes?.value || auditable?.value
    const comment = audited_changes?.comment || auditable?.comment || ''
    
    // Получаем год из бэкенда
    const actionYear = year || 'неизвестный год'
    
    // Получаем название технологии из бэкенда
    const technologyName = technology_name || auditable?.technology?.name || 'Неизвестная технология'
    
    // Определяем действие
    if (action === 'create') {
      const status = value === 1 ? 'открыта' : 'закрыта'
      return `${technologyName} - ${status} (${actionYear})`
    } else if (action === 'update') {
      const oldValue = audited_changes?.value?.[0]
      const newValue = audited_changes?.value?.[1]
      
      if (oldValue === 0 && newValue === 1) {
        return `${technologyName} - открыта (${actionYear})`
      } else if (oldValue === 1 && newValue === 0) {
        return `${technologyName} - закрыта (${actionYear})`
      } else {
        return `${technologyName} - изменена (${actionYear})`
      }
    } else if (action === 'destroy') {
      return `${technologyName} - удалена (${actionYear})`
    }
    
    return `${technologyName} - изменена (${actionYear})`
  }

  function getBattleDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, year, attacker_name, defender_name, winner_name, loser_name, damage, attacker_owner_name, defender_owner_name, winner_owner_name, attacker_army_name, defender_army_name, winner_army_name } = audit
    
    if (auditable_type !== 'Battle') return null
    
    // Получаем год из бэкенда
    const actionYear = year || 'неизвестный год'
    
    // Получаем данные о сражении, приоритет сохранённым названиям армий
    const attacker = attacker_army_name || attacker_owner_name || attacker_name || auditable?.attacker_army_name || auditable?.attacker_owner_name || auditable?.attacker_name || 'Неизвестный'
    const defender = defender_army_name || defender_owner_name || defender_name || auditable?.defender_army_name || auditable?.defender_owner_name || auditable?.defender_name || 'Неизвестный'
    const winner = winner_army_name || winner_owner_name || winner_name || auditable?.winner_army_name || auditable?.winner_owner_name || auditable?.winner_name || 'Неизвестный'
    const loser = loser_name || auditable?.loser_name || 'Неизвестный'
    const battleDamage = damage || auditable?.damage || 0
    
    // Определяем действие
    if (action === 'create') {
      return `${attacker} победил ${defender} (урон: ${battleDamage}) (${actionYear})`
    } else if (action === 'update') {
      return `${attacker} vs ${defender} - изменено (${actionYear})`
    } else if (action === 'destroy') {
      return `Сражение ${attacker} vs ${defender} - удалено (${actionYear})`
    }
    
    return `${attacker} vs ${defender} - сражение (${actionYear})`
  }

  function getArmyDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, year, troop_type_name, army_name, army_owner_name, settlement_name, debug_audited_changes } = audit
    
    if (auditable_type !== 'Army' && auditable_type !== 'Troop') return null
    
    // Получаем год из бэкенда
    const actionYear = year || 'неизвестный год'
    
    // Обработка отрядов
    if (auditable_type === 'Troop') {
      const troopType = troop_type_name || auditable?.troop_type?.name || 'Неизвестный тип'
      const armyName = army_name || auditable?.army?.name || 'Неизвестная армия'
      const armyOwner = army_owner_name || auditable?.army?.owner?.name || 'Неизвестный владелец'
      
      if (action === 'create') {
        return `Добавлен отряд ${troopType} в армию ${armyName} (${armyOwner}) (${actionYear})`
      } else if (action === 'update') {
        // Проверяем, изменился ли параметр paid
        if (audited_changes?.params && Array.isArray(audited_changes.params) && audited_changes.params.length === 2) {
          const oldParams = audited_changes.params[0] || {}
          const newParams = audited_changes.params[1] || {}
          const oldPaid = oldParams.paid || []
          const newPaid = newParams.paid || []
          const currentYear = parseInt(actionYear)
          
          if (oldPaid.includes(currentYear) && !newPaid.includes(currentYear)) {
            return `Отряд ${troopType} в армии ${armyName} - неоплачен (${actionYear})`
          } else if (!oldPaid.includes(currentYear) && newPaid.includes(currentYear)) {
            return `Отряд ${troopType} в армии ${armyName} - оплачен (${actionYear})`
          }
        }
        return `Отряд ${troopType} в армии ${armyName} - изменено (${actionYear})`
      } else if (action === 'destroy') {
        return `Отряд ${troopType} в армии ${armyName} - удален (${actionYear})`
      }
      
      return `Отряд ${troopType} в армии ${armyName} (${actionYear})`
    }
    
    // Обработка армий
    if (auditable_type === 'Army') {
      const armyName = army_name || auditable?.name || 'Неизвестная армия'
      const armyOwner = army_owner_name || auditable?.owner?.name || 'Неизвестный владелец'
      const settlementName = settlement_name || auditable?.settlement?.name || 'неизвестное поселение'
      
      if (action === 'create') {
        return `Создана армия ${armyName} (${armyOwner}) (${actionYear})`
      } else if (action === 'update') {
        // Проверяем, что именно изменилось
        if (audited_changes?.name) {
          const oldName = audited_changes.name[0] || 'Без названия'
          const newName = audited_changes.name[1] || 'Без названия'
          return `Армия переименована с "${oldName}" на "${newName}" (${armyOwner}) (${actionYear})`
        } else if (audited_changes?.hidden !== undefined) {
          const wasHidden = audited_changes.hidden[0]
          const isHidden = audited_changes.hidden[1]
          if (wasHidden && !isHidden) {
            return `Армия ${armyName} разведана (${armyOwner}) (${actionYear})`
          } else if (!wasHidden && isHidden) {
            return `Армия ${armyName} скрыта (${armyOwner}) (${actionYear})`
          }
        } else if (audited_changes?.settlement_id) {
          const oldSettlementId = audited_changes.settlement_id[0]
          const newSettlementId = audited_changes.settlement_id[1]
          if (oldSettlementId && newSettlementId) {
            return `Армия ${armyName} перемещена в ${settlementName} (${armyOwner}) (${actionYear})`
          } else if (newSettlementId) {
            return `Армия ${armyName} прибыла в ${settlementName} (${armyOwner}) (${actionYear})`
          } else if (oldSettlementId) {
            return `Армия ${armyName} покинула поселение (${armyOwner}) (${actionYear})`
          }
        } else if (audited_changes?.owner_id || audited_changes?.owner_type) {
          return `Армия ${armyName} передана другому владельцу (${actionYear})`
        }
        return `Армия ${armyName} - изменено (${armyOwner}) (${actionYear})`
      } else if (action === 'destroy') {
        return `Армия ${armyName} (${armyOwner}) - уничтожена (${actionYear})`
      }
      
      return `Армия ${armyName} (${armyOwner}) (${actionYear})`
    }
    
    return null
  }

  function getRegionDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, old_country_name, new_country_name, year } = audit
    
    if (auditable_type !== 'Region') return null
    
    // Получаем название региона
    const regionName = auditable?.name || 'Неизвестный регион'
    
    // Получаем год из бэкенда
    const actionYear = year || 'неизвестный год'
    
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
    
    // Получаем год из аудита
    const year = audit.year || 'неизвестный год'
    
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

  function getGameParameterDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, year, comment } = audit
    
    if (auditable_type !== 'GameParameter') return null
    
    // Если есть комментарий из audit_comment, используем его
    if (comment) {
      return comment
    }
    
    // Получаем год из бэкенда
    const actionYear = year || 'неизвестный год'
    
    // Проверяем, что изменилось
    if (audited_changes?.value) {
      // Изменение года
      const [oldYear, newYear] = audited_changes.value
      return `Год изменен с ${oldYear} на ${newYear}`
    } else if (audited_changes?.params) {
      // Изменение параметров (оплата госрасходов)
      const [oldParams, newParams] = audited_changes.params
      
      if (oldParams && newParams) {
        const oldPaid = oldParams.state_expenses
        const newPaid = newParams.state_expenses
        
        if (oldPaid === false && newPaid === true) {
          return `Оплачены госрасходы за ${actionYear} год`
        } else if (oldPaid === true && newPaid === false) {
          return `Отменена оплата госрасходов за ${actionYear} год`
        }
      }
    }
    
    return `Параметр игры изменен (${actionYear})`
  }

  function getJobDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, year, comment } = audit
    
    if (auditable_type !== 'Job') return null
    
    // Если есть комментарий, используем его
    if (comment) {
      return comment
    }
    
    // Получаем год из бэкенда
    const actionYear = year || 'неизвестный год'
    
    // Получаем название должности
    const jobName = auditable?.name || 'Неизвестная должность'
    
    return `${jobName} изменен (${actionYear})`
  }

  function getRelationItemDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, country_name, relation_value, relation_comment, relation_year } = audit
    
    if (auditable_type !== 'RelationItem') return null
    
    // Получаем данные из бэкенда или auditable
    const countryName = country_name || auditable?.country?.name || 'Неизвестная страна'
    const value = relation_value || auditable?.value || 0
    const comment = relation_comment || auditable?.comment || ''
    const actionYear = relation_year || 'неизвестный год'
    
    // Определяем направление изменения
    let direction = ''
    if (value > 0) {
      direction = `улучшились на +${value}`
    } else if (value < 0) {
      direction = `ухудшились на ${value}`
    } else {
      direction = 'не изменились'
    }
    
    // Формируем описание
    let description = `Отношения с ${countryName} ${direction}`
    if (comment) {
      description += ` (${comment})`
    }
    description += ` (${actionYear})`
    
    return description
  }

  function getCountryDescription(audit) {
    const { auditable, action, audited_changes, auditable_type, country_name, embargo_changed, old_embargo, new_embargo } = audit
    
    if (auditable_type !== 'Country') return null
    
    const countryName = country_name || auditable?.name || 'Неизвестная страна'
    
    // Проверяем изменения эмбарго
    if (embargo_changed) {
      if (old_embargo === 0 && new_embargo === 1) {
        return `${countryName} - введено эмбарго против Руси`
      } else if (old_embargo === 1 && new_embargo === 0) {
        return `${countryName} - снято эмбарго против Руси`
      } else {
        return `${countryName} - изменено эмбарго`
      }
    }
    
    // Если нет изменений эмбарго, показываем общее изменение
    return `${countryName} - изменена`
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
        category: 'Армии',
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
    
    if (auditable_type === 'TechnologyItem') {
      return {
        category: 'Технологии',
        icon: 'mdi-cog',
        color: '#607D8B'
      }
    }
    
    if (auditable_type === 'Battle') {
      return {
        category: 'Сражения',
        icon: 'mdi-sword-cross',
        color: '#D32F2F'
      }
    }
    
    if (auditable_type === 'Troop') {
      return {
        category: 'Армии',
        icon: 'mdi-shield-account',
        color: '#E91E63'
      }
    }
    
    // Параметры игры
    if (auditable_type === 'GameParameter') {
      return {
        category: 'Игра',
        icon: 'mdi-cog',
        color: '#607D8B'
      }
    }
    
    // Должности
    if (auditable_type === 'Job') {
      return {
        category: 'Должности',
        icon: 'mdi-account-tie',
        color: '#9C27B0'
      }
    }
    
    // Отношения между странами
    if (auditable_type === 'RelationItem') {
      return {
        category: 'Дипломатия',
        icon: 'mdi-handshake',
        color: '#2196F3'
      }
    }
    
    // Изменения стран (эмбарго)
    if (auditable_type === 'Country') {
      return {
        category: 'Дипломатия',
        icon: 'mdi-flag',
        color: '#2196F3'
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

  // Экспортируем totalUnviewedCount и updateNotifications для использования в родительском компоненте
  defineExpose({
    totalUnviewedCount,
    updateNotifications
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

      <v-card class="mx-auto notifications-card" max-width="600">
        <v-toolbar color="pink" class="notifications-toolbar">
          <v-toolbar-title class="notifications-title">Новые действия</v-toolbar-title>

          <v-spacer></v-spacer>

          <v-btn 
            icon="mdi-check-all" 
            @click="markAllAsViewed"
            :disabled="totalUnviewedCount === 0"
            title="Прочитать все события"
            size="small"
          ></v-btn>
        </v-toolbar>

        <div class="notifications-list">
          <!-- Кнопка "Прочитать все" -->
          <div v-if="totalUnviewedCount > 0" class="mark-all-container">
            <v-btn 
              color="primary" 
              variant="outlined" 
              size="small"
              @click="markAllAsViewed"
              prepend-icon="mdi-check-all"
              class="mark-all-btn"
            >
              Прочитать все ({{ totalUnviewedCount }})
            </v-btn>
          </div>
          
          <div
            v-for="group in groupedAudits"
            :key="group.category.category"
            class="category-group"
          >
            <div class="category-header" @click.stop="toggleGroupExpanded(group.category.category, $event)">
              <div class="category-title">
                <v-icon :icon="group.category.icon" size="small" class="category-header-icon" :style="{ color: group.category.color }"></v-icon>
                <span>{{ group.category.category }}</span>
                <span v-if="group.unviewedItems.length > 0" class="category-count">({{ group.unviewedItems.length }})</span>
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
                :class="{ 
                  'expanded': isExpanded(audit.id),
                  'unviewed': !audit.is_viewed
                }"
                @click.stop="toggleExpanded(audit.id, $event)"
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
                      :class="{ 'viewed': audit.is_viewed }"
                      @click.stop="toggleExpanded(audit.id, $event)"
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
                      <template v-else-if="getTechnologyDescription(audit)">
                        {{ getTechnologyDescription(audit) }}
                      </template>
                      <template v-else-if="getBattleDescription(audit)">
                        {{ getBattleDescription(audit) }}
                      </template>
                      <template v-else-if="getArmyDescription(audit)">
                        {{ getArmyDescription(audit) }}
                      </template>
                      <template v-else-if="getGameParameterDescription(audit)">
                        {{ getGameParameterDescription(audit) }}
                      </template>
                      <template v-else-if="getJobDescription(audit)">
                        {{ getJobDescription(audit) }}
                      </template>
                      <template v-else-if="getRelationItemDescription(audit)">
                        {{ getRelationItemDescription(audit) }}
                      </template>
                      <template v-else-if="getCountryDescription(audit)">
                        {{ getCountryDescription(audit) }}
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
                    <span v-if="audit.player && audit.auditable_type !== 'Army'" class="player-name">
                      Игрок: {{ audit.player.name }}
                      <span v-if="audit.player.jobs" class="player-jobs">({{ audit.player.jobs }})</span>
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

.notification-item.unviewed {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  font-weight: 500;
}

.notification-item.unviewed:hover {
  background-color: #ffeaa7;
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

.expand-btn.viewed {
  opacity: 0.6;
}

.expand-btn.viewed:hover {
  background-color: #f0f0f0;
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

.player-name {
  display: block;
  color: #2196F3;
  font-size: 0.9em;
  margin-top: 2px;
  font-weight: 500;
}

.player-jobs {
  color: #1976D2;
  font-size: 0.85em;
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

/* Стили для кнопки "Прочитать все" */
.mark-all-container {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  text-align: center;
}

.mark-all-btn {
  width: 100%;
  font-weight: 500;
}

/* Стили для карточки уведомлений */
.notifications-card {
  min-width: 400px;
  max-width: 600px;
}

/* Стили для заголовка уведомлений */
.notifications-toolbar {
  min-height: 48px !important;
  padding: 0 16px !important;
}

.notifications-title {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: black !important;
  flex: 1 !important;
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: unset !important;
  max-width: none !important;
  margin-right: 16px !important;
}
</style>