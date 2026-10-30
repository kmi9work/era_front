import { computed } from 'vue'

// Конфигурация игр
const GAME_CONFIG = {
  activeGame: import.meta.env.VITE_ACTIVE_GAME || 'base-game',
  availableGames: {
    'base-game': {
      name: 'Базовая игра',
      key: 'base-game'
    },
    'vassals-and-robbers': {
      name: 'Вассалы и Разбойники',
      key: 'vassals-and-robbers'
    },
    'artel': {
      name: 'Артель',
      key: 'artel'
    }
  }
}

// Игры, в которых отношения государств не влияют на цены и не показываются
// в «Помощнике купцов» (calc.igroteh.su). В many_teams цены на «Рынке» берутся
// по уровню отношений «0» — это делает бэкенд (движок many_teams перекрывает
// Resource.show_prices и Resource.calculate_cost), а сами отношения ведутся
// парами государств в матрице «Дашборда», а не «отношениями с Русью».
// Написание через подчёркивание принимается так же, как в плагинах.
export const GAMES_WITHOUT_RELATIONS = ['many-teams', 'many_teams']

export function useGameConfig() {
  /**
   * Проверяет, активна ли указанная игра
   * @param {string} gameName - Название игры (ключ)
   * @returns {boolean}
   */
  const isGameActive = (gameName) => {
    return GAME_CONFIG.activeGame === gameName
  }

  /**
   * Показывать ли отношения в интерфейсе помощника купцов.
   * false для игр из GAMES_WITHOUT_RELATIONS (many_teams): цены постоянные,
   * уровень отношений «0», и отображать отношения нечего.
   * @returns {boolean}
   */
  const relationsVisible = computed(() => !GAMES_WITHOUT_RELATIONS.includes(GAME_CONFIG.activeGame))

  /**
   * Получает информацию об активной игре
   * @returns {object|null}
   */
  const getActiveGameInfo = () => {
    return GAME_CONFIG.availableGames[GAME_CONFIG.activeGame] || null
  }

  /**
   * Получает название активной игры
   * @returns {string}
   */
  const activeGame = computed(() => GAME_CONFIG.activeGame)

  return {
    isGameActive,
    relationsVisible,
    activeGame,
    getActiveGameInfo
  }
}
