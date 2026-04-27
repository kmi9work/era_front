/**
 * This is helper function to register plugins like a nuxt
 * To register a plugin just export a const function `defineVuePlugin` that takes `app` as argument and call `app.use`
 * For Scanning plugins it will include all files in `src/plugins` and `src/plugins/**\/index.ts`
 *
 *
 * @param {App} app Vue app instance
 * @returns void
 *
 * @example
 * ```ts
 * // File: src/plugins/vuetify/index.ts
 *
 * import type { App } from 'vue'
 * import { createVuetify } from 'vuetify'
 *
 * const vuetify = createVuetify({ ... })
 *
 * export default function (app: App) {
 *   app.use(vuetify)
 * }
 * ```
 *
 * All you have to do is use this helper function in `main.ts` file like below:
 * ```ts
 * // File: src/main.ts
 * import { registerPlugins } from '@core/utils/plugins'
 * import { createApp } from 'vue'
 * import App from '@/App.vue'
 *
 * // Create vue app
 * const app = createApp(App)
 *
 * // Register plugins
 * registerPlugins(app) // [!code focus]
 *
 * // Mount vue app
 * app.mount('#app')
 * ```
 */
export const registerPlugins = app => {
  // Регистрируем обычные плагины
  const imports = import.meta.glob(['../../plugins/*.{ts,js}', '../../plugins/*/index.{ts,js}'], { eager: true })
  const importPaths = Object.keys(imports).sort()

  importPaths.forEach(path => {
    const pluginImportModule = imports[path]

    pluginImportModule.default?.(app)
  })

  // Регистрируем игровые плагины
  const gamePluginImports = import.meta.glob(['../../plugins/game-plugins/*/index.{ts,js}'], { eager: true })
  const gamePluginPaths = Object.keys(gamePluginImports).sort()

  gamePluginPaths.forEach(path => {
    const pluginImportModule = gamePluginImports[path]

    pluginImportModule.default?.(app)
  })
}
