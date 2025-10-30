// EXAMPLE: Это шаблонный файл для создания своего плагина
import { componentRegistry } from '@/registry'
import { GAME_CONFIG } from '@/config/game'

export default function VassalsAndRobbersPlugin(app) {
  // Проверяем, активен ли этот плагин
  if (!GAME_CONFIG.isActive('vassals-and-robbers')) {
    console.log('[Vassals and Robbers] Plugin not active, skipping...')
    return
  }

  console.log('[Vassals and Robbers] Initializing plugin...')

  // TODO: Регистрация компонентов плагина
  // Пример:
  // import CustomEconomicsView from './views/CustomEconomicsView.vue'
  // componentRegistry.register('EconomicsView', CustomEconomicsView)

  // TODO: Регистрация stores плагина
  // import { useVassalsStore } from './stores/vassals'
  // app.provide('vassalsStore', useVassalsStore())

  // TODO: Регистрация глобальных свойств
  // app.config.globalProperties.$vassalsApi = vassalsApi

  console.log('[Vassals and Robbers] Plugin initialized')
}

