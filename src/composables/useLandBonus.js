/**
 * Влияние должностей за присоединённую землю (решение заказчика).
 *
 * Цифры дублируют серверные константы `Job::POSOL_BONUS` / `Job::GRAND_PRINCE_BONUS`
 * (`eraofchange/app/models/job.rb`): они нужны для текста вопросов мастеру
 * («начислить 7», «снять 5»). Менять их — вместе с бэкендом.
 */
export const POSOL_LAND_BONUS = 7
export const GRAND_PRINCE_LAND_BONUS = 5

/** Название государства для текста: короткое имя, иначе полное. */
export function countryLabel(country, fallback = 'государства') {
  return country?.short_name || country?.name || fallback
}

/**
 * Вопросы мастеру о влиянии за землю.
 *
 * @param {Object}   options
 * @param {Object}   options.source        государство, у которого земля уходит (может быть null)
 * @param {Object}   options.target        государство-получатель
 * @param {String}   options.landLabel     как назвать землю в тексте (напр. «земли «Тверь»»)
 * @param {Number}   options.regionsCount  сколько земель переходит (для «присоединить страну миром»)
 * @returns {Array}  вопросы для LandBonusDialog
 *
 * Снятие спрашиваем только когда земля действительно меняет государство: у прежнего
 * государства бонус снимается, у получателя добавляется (п. 1 доработок).
 */
export function landBonusQuestions({ source, target, landLabel = 'земли', regionsCount = 1 }) {
  const questions = []
  const count = Math.max(1, Number(regionsCount) || 1)
  const land = landLabel || 'земли'

  const sourceId = source?.id ?? null
  const targetId = target?.id ?? null
  const moving = sourceId === null || targetId === null || Number(sourceId) !== Number(targetId)

  if (moving && sourceId !== null) {
    questions.push({
      key: 'remove_posol',
      title: 'Посольский дьяк: снятие бонуса',
      question: `Снять ${POSOL_LAND_BONUS} влияния у Посольского дьяка (${countryLabel(source)}) за утрату ${land}?`,
      hint: count > 1 ? `Снимется за каждую из ${count} земель: ${count} × ${POSOL_LAND_BONUS} = ${count * POSOL_LAND_BONUS}.` : '',
      rejectText: 'Мастерское действие',
      acceptText: `Снять ${count * POSOL_LAND_BONUS}`,
      acceptColor: 'error'
    })
    questions.push({
      key: 'remove_grand_prince',
      title: 'Князь: снятие бонуса',
      question: `Снять ${GRAND_PRINCE_LAND_BONUS} влияния у Князя (${countryLabel(source)}) за утрату ${land}?`,
      hint: count > 1 ? `Снимется за каждую из ${count} земель: ${count} × ${GRAND_PRINCE_LAND_BONUS} = ${count * GRAND_PRINCE_LAND_BONUS}.` : '',
      rejectText: 'Мастерское действие',
      acceptText: `Снять ${count * GRAND_PRINCE_LAND_BONUS}`,
      acceptColor: 'error'
    })
  }

  if (moving) {
    questions.push({
      key: 'posol',
      title: 'Посольский дьяк: бонус за землю',
      question: `Начислить ${POSOL_LAND_BONUS} влияния Посольскому дьяку (${countryLabel(target, 'получателя')}) за присоединение ${land}?`,
      hint: count > 1 ? `Начислится за каждую из ${count} земель: ${count} × ${POSOL_LAND_BONUS} = ${count * POSOL_LAND_BONUS}.` : '',
      rejectText: 'Мастерское действие',
      acceptText: `Начислить ${count * POSOL_LAND_BONUS}`
    })
    questions.push({
      key: 'grand_prince',
      title: 'Князь: бонус за землю',
      question: `Начислить ${GRAND_PRINCE_LAND_BONUS} влияния Князю (${countryLabel(target, 'получателя')}) за присоединение ${land}?`,
      hint: count > 1 ? `Начислится за каждую из ${count} земель: ${count} × ${GRAND_PRINCE_LAND_BONUS} = ${count * GRAND_PRINCE_LAND_BONUS}.` : '',
      rejectText: 'Мастерское действие',
      acceptText: `Начислить ${count * GRAND_PRINCE_LAND_BONUS}`
    })
  }

  return questions
}

/**
 * Флаги запроса из ответов диалога. Отсутствие флага = «мастерское действие»:
 * сервер влияние не меняет.
 */
export function landBonusParams(answers) {
  const a = answers || {}
  return {
    posol_bonus: a.posol ? 1 : 0,
    grand_prince_bonus: a.grand_prince ? 1 : 0,
    remove_posol_bonus: a.remove_posol ? 1 : 0,
    remove_grand_prince_bonus: a.remove_grand_prince ? 1 : 0
  }
}

/** Текст отчёта мастеру: кому и сколько начислено/снято. */
export function awardedText(awarded) {
  const rows = Array.isArray(awarded) ? awarded : []
  if (rows.length === 0) return ''
  return rows
    .map(row => `${row.name}${row.country_name ? ` (${row.country_name})` : ''}: ${row.value > 0 ? '+' : ''}${row.value}`)
    .join(', ')
}
