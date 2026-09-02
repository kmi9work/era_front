import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import vuetify from 'vite-plugin-vuetify'
import svgLoader from 'vite-svg-loader'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),

    // Docs: https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin
    vuetify({
      styles: {
        configFile: 'src/assets/styles/variables/_vuetify.scss',
      },
    }),
    Components({
      dirs: ['src/@core/components', 'src/components'],
      dts: true,
      resolvers: [
        componentName => {
          // Auto import `VueApexCharts`
          if (componentName === 'VueApexCharts')
            return { name: 'default', from: 'vue3-apexcharts', as: 'VueApexCharts' }
        },
      ],
    }),

    // Docs: https://github.com/antfu/unplugin-auto-import#unplugin-auto-import
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core', '@vueuse/math', 'pinia'],
      vueTemplate: true,

      // ℹ️ Disabled to avoid confusion & accidental usage
      ignore: ['useCookies', 'useStorage'],
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
      },
    }),
    svgLoader(),

    // PWA только для merchant_mobile_helper.html («ЭП: Кошелёк ресурсов»).
    // vite-plugin-pwa у multi-page сборки инжектит <link rel="manifest"> во ВСЕ HTML-входы
    // (index.html/noble_helper.html) независимо от injectRegister, поэтому manifest здесь
    // отключён (manifest: false) — сам файл public/manifest.webmanifest написан вручную
    // и подключён только из merchant_mobile_helper.html. injectRegister тоже отключён —
    // регистрация SW делается вручную в src/mobile-entry.js.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST',
        // index.html и noble_helper.html — документы других приложений на этом же домене,
        // их нельзя отдавать из кэша SW, зарегистрированного со страницы кошелька.
        globIgnores: ['index.html', 'noble_helper.html'],
      },
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/@core', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/@layouts', import.meta.url)),
      '@images': fileURLToPath(new URL('./src/assets/images/', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/assets/styles/', import.meta.url)),
      '@configured-variables': fileURLToPath(new URL('./src/assets/styles/variables/_template.scss', import.meta.url)),
      '@game-plugins': fileURLToPath(new URL('./src/plugins/game-plugins', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        mobile: fileURLToPath(new URL('./merchant_mobile_helper.html', import.meta.url)),
        noble: fileURLToPath(new URL('./noble_helper.html', import.meta.url)),
      },
    },
  },
  optimizeDeps: {
    exclude: ['vuetify'],
    entries: [
      './index.html',
      './merchant_mobile_helper.html',
      './noble_helper.html',
      './src/**/*.vue',
    ],
  },
  server: {
    host: process.env.DEV_IP || '0.0.0.0',
    port: parseInt(process.env.FRONTEND_PORT) || 5173,
    strictPort: false,
  },
})
