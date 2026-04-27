export const GAME_CONFIG = {
  // Активная игра из переменной окружения
  activeGame: import.meta.env.VITE_ACTIVE_GAME || 'base-game',
  
  // Доступные игры
  availableGames: {
    'base-game': {
      name: 'Era of Change',
      description: 'Базовая игра',
    },
    'vassals-and-robbers': {
      name: 'Vassals and Robbers',
      description: 'Игра с вассалами и разбойниками',
    },
  },
  
  // Проверка активной игры
  isActive(gameName) {
    return this.activeGame === gameName
  },
  
  // Информация об активной игре
  getActiveGameInfo() {
    return this.availableGames[this.activeGame] || null
  },
}

// Vue composable для использования в компонентах
export function useGameConfig() {
  return {
    gameConfig: GAME_CONFIG,
    isGameActive: (gameName) => GAME_CONFIG.isActive(gameName),
    activeGame: GAME_CONFIG.activeGame,
    activeGameInfo: GAME_CONFIG.getActiveGameInfo(),
  }
}

