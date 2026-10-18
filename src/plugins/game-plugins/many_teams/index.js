/**
 * Плагин игры «Много команд» (many_teams) для era_front.
 *
 * Включается переменной окружения `VITE_ACTIVE_GAME=many-teams`.
 *
 * Плагин не правит экраны ядра, а подменяет компоненты маршрутов:
 *  - `/dashboard`  — дашборд отношений + подтверждение государств игроков (п. 7);
 *  - `/economics`  — экономика; во вкладку «Дашборд» добавлены эмбарго по
 *    гильдиям (п. 9) и разрешения на добычу (п. 4, п. 5).
 *
 * Компоненты новых политдействий (разведка, подрыв, добыча, снятие эмбарго)
 * регистрируются в registry под ключом `many_teams.action_components`; ядро
 * подмешивает их в свой диспетчер действий (одна точка расширения вместо копии).
 */
import { GAME_CONFIG } from '@/config/game'
import { componentRegistry } from '@/registry'
import { router } from '@/plugins/router'

import DashboardPage from './views/DashboardPage.vue'
import EconomicsPage from './views/EconomicsPage.vue'

import conductIntelligence from './views/actions/conduct_intelligence.vue'
import undermineStability from './views/actions/undermine_stability.vue'
import undermineRelations from './views/actions/undermine_relations.vue'
import setGuildExtraction from './views/actions/set_guild_extraction.vue'
import liftGuildEmbargoes from './views/actions/lift_guild_embargoes.vue'

/**
 * Ключ игры = `ACTIVE_GAME` движка. Написание через подчёркивание (`many_teams`)
 * тоже принимается. Справочник игр ядра пополняется из плагина: игра видна в
 * списке и в информации об активной игре без правки src/config/game.js.
 */
export const GAME_KEY = 'many-teams'

GAME_CONFIG.availableGames[GAME_KEY] = {
  name: 'Many Teams',
  description: 'Режим «много команд»: добыча и эмбарго гильдий, две и более команд',
}

export const ACTION_COMPONENTS = {
  conduct_intelligence: conductIntelligence,
  undermine_stability: undermineStability,
  undermine_relations: undermineRelations,
  set_guild_extraction: setGuildExtraction,
  lift_guild_embargoes: liftGuildEmbargoes,
}

/**
 * Подмена компонента существующего маршрута ядра.
 *
 * Router создаётся при импорте `@/plugins/router`, поэтому к моменту загрузки
 * игровых плагинов записи маршрутов уже зарегистрированы — меняем компонент
 * записи (`record.components.default`), не создавая второй маршрут.
 */
export function overrideRoute(path, component) {
  const record = router.getRoutes().find(route => route.path === path || route.path === `${path}/`)

  if (!record || !record.components) {
    console.warn(`[many_teams] маршрут ${path} не найден — плагин не подменил экран`)
    return false
  }

  record.components.default = component
  return true
}

export default function ManyTeamsPlugin() {
  if (!GAME_CONFIG.isActive(GAME_KEY) && !GAME_CONFIG.isActive('many_teams')) {
    return
  }

  console.log('[many_teams] Initializing plugin...')

  componentRegistry.register('many_teams.action_components', ACTION_COMPONENTS)

  overrideRoute('/dashboard', DashboardPage)
  overrideRoute('/economics', EconomicsPage)

  console.log('[many_teams] Plugin initialized')
}
