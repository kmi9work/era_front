import { computed } from 'vue'

/**
 * Действующие эффекты пары государств «A ↔ B» (ТЗ № 2, § 2.3).
 *
 * Общий модуль для матрицы Дашборда (`components/PairRelationsCell.vue`) и строки
 * «Информации о стране» (`components/RelationsRow.vue`): проверка «эффект относится
 * к государству A пары» и текст комментария не должны существовать в двух копиях.
 *
 * @param partnerCountryRef ref на государство A (страна, «за которую идёт игра»)
 * @param effectsRef       ref на массив активных длящихся эффектов
 *                         (`GET /game_parameters/get_active_lingering_effects.json`)
 */
export function usePairEffects(partnerCountryRef, effectsRef) {
  const partnerId = computed(() => partnerCountryRef.value?.id ?? null)

  // Эффект относится к этой паре, если цель указана и совпадает с государством A,
  // либо цель не указана вовсе (прежнее поведение «эффект общий»)
  function effectMatchesPartner(effect) {
    const targets = effect?.targets
    if (!Array.isArray(targets) || targets.length === 0) return true

    const a = partnerCountryRef.value
    return targets.some((target) => {
      if (target === null || target === undefined) return false
      if (typeof target === 'object') {
        const ids = [target.country_id, target.id, target.partner_country_id]
          .filter(value => value !== undefined && value !== null)
          .map(Number)
        const names = [target.name, target.country_name, target.target]
          .filter(value => typeof value === 'string')
        return ids.includes(Number(a?.id)) || (a?.name ? names.includes(a.name) : false)
      }
      return String(target) === String(a?.id) || String(target) === String(a?.name)
    })
  }

  const pairEffects = computed(() => (effectsRef.value || []).filter(effectMatchesPartner))

  const hasNoRelationImprovement = computed(() =>
    pairEffects.value.some(effect => effect.effect === 'no_relation_improvement'))

  const nonNegativeRelations = computed(() =>
    pairEffects.value.some(effect => effect.effect === 'non_negative_relations'))

  // Комментарий пары: причина, по которой улучшение недоступно
  const commentText = computed(() => {
    if (hasNoRelationImprovement.value) {
      return 'Улучшение через торговлю заблокировано эффектом «Поддержать экспорт»'
    }
    if (nonNegativeRelations.value) {
      return 'Отношения не опускаются ниже нейтральных (эффект «Передача армии»)'
    }
    return ''
  })

  return {
    partnerId,
    pairEffects,
    hasNoRelationImprovement,
    nonNegativeRelations,
    commentText,
  }
}
