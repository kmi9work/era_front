/**
 * Плагин игры «Много команд» (many_teams) для era_front.
 *
 * Включается переменной окружения `VITE_ACTIVE_GAME=many-teams`.
 *
 * Плагин не правит экраны ядра, а подменяет компоненты маршрутов:
 *  - `/dashboard`  — дашборд отношений + подтверждение государств игроков (п. 7);
 *  - `/economics`  — экономика; во вкладку «Дашборд» добавлены эмбарго по
 *    гильдиям (п. 9) и разрешения гильдий на строительство и работу
 *    предприятий (п. 0-4).
 *
 * Кроме маршрутов плагин добавляет окна на экран «Служебное» (`/aux`): реестр
 * `aux_screens` — «Гильдии» (таймер + таблица всех гильдий игры: разрешение,
 * эмбарго, ресурсы на территории текущего государства) и «Результаты всех команд»
 * (два окна: общий зачёт по командам и личный зачёт).
 *
 * Компоненты новых политдействий (разведка, подрыв, разрешение гильдии,
 * снятие эмбарго)
 * регистрируются в registry под ключом `many_teams.action_components`; ядро
 * подмешивает их в свой диспетчер действий (одна точка расширения вместо копии).
 */
import { GAME_CONFIG } from '@/config/game'
import { componentRegistry } from '@/registry'
import { router } from '@/plugins/router'

import DashboardPage from './views/DashboardPage.vue'
import EconomicsPage from './views/EconomicsPage.vue'
import GuildsOverviewScreen from './views/GuildsOverviewScreen.vue'
import AllTeamsOverallScreen from './views/AllTeamsOverallScreen.vue'
import AllTeamsPersonalScreen from './views/AllTeamsPersonalScreen.vue'
import PairEmbargoButton from './components/PairEmbargoButton.vue'

import conductIntelligence from './views/actions/conduct_intelligence.vue'
import undermineStability from './views/actions/undermine_stability.vue'
import undermineRelations from './views/actions/undermine_relations.vue'
import setGuildPermission from './views/actions/set_guild_permission.vue'
import liftGuildEmbargoes from './views/actions/lift_guild_embargoes.vue'

/**
 * Ключ игры = `ACTIVE_GAME` движка. Написание через подчёркивание (`many_teams`)
 * тоже принимается. Справочник игр ядра пополняется из плагина: игра видна в
 * списке и в информации об активной игре без правки src/config/game.js.
 */
export const GAME_KEY = 'many-teams'

GAME_CONFIG.availableGames[GAME_KEY] = {
  name: 'Many Teams',
  description: 'Режим «много команд»: разрешения гильдий и эмбарго, две и более команд',
}

export const ACTION_COMPONENTS = {
  conduct_intelligence: conductIntelligence,
  undermine_stability: undermineStability,
  undermine_relations: undermineRelations,
  set_guild_permission: setGuildPermission,
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

  // Точка расширения ядра: в ячейке отношений кнопка «эмбарго» заменяется
  // модалкой выбора гильдии (PairRelationsCell, «Информация о стране» +
  // «Дашборд»). Без регистрации ядро рисует прежнюю кнопку-переключатель.
  componentRegistry.register('pair_relations_embargo', PairEmbargoButton)

  // Окна, добавленные игрой, на экране «Служебное»: ядро рисует карточку
  // выбора и передаёт экрану таймер пропсом. Без регистрации список окон
  // остаётся прежним (базовая игра).
  componentRegistry.register('aux_screens', [
    {
      id: 'guilds_overview',
      label: 'Гильдии',
      previewText: 'Таймер + все гильдии: разрешение, эмбарго, ресурсы',
      component: GuildsOverviewScreen,
    },
    {
      id: 'all_teams_overall',
      label: 'Результаты всех команд: общий зачёт',
      previewText: 'Таймер + команды: экономика (стоимость предприятий) и политика (очки влияния)',
      component: AllTeamsOverallScreen,
    },
    {
      id: 'all_teams_personal',
      label: 'Результаты всех команд: личный зачёт',
      previewText: 'Таймер + знать по влиянию и гильдии по капиталу на игрока',
      component: AllTeamsPersonalScreen,
    },
  ])

  overrideRoute('/dashboard', DashboardPage)
  overrideRoute('/economics', EconomicsPage)

  console.log('[many_teams] Plugin initialized')
}
