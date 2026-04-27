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
    activeGame,
    getActiveGameInfo
  }
}
