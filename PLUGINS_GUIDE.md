# Руководство по плагинной архитектуре era_front

## Обзор

Плагинная архитектура позволяет создавать модульные игры, которые могут переопределять компоненты ядра и добавлять новый функционал без изменения базового кода.

## Структура

```
era_front/
├── src/
│   ├── registry/                          # Component Registry
│   │   ├── componentRegistry.js           # Регистр компонентов (БЕЗ EXAMPLE)
│   │   └── index.js                       # Экспорт registry (БЕЗ EXAMPLE)
│   ├── config/
│   │   └── game.js                        # Конфигурация игры (БЕЗ EXAMPLE)
│   └── plugins/
│       └── game-plugins/                  # Директория для плагинов игр
│           ├── README.md                  # Общая документация (С EXAMPLE)
│           └── vassals-and-robbers/       # Пример плагина (С EXAMPLE)
│               ├── index.js               # Главный файл плагина
│               ├── routes.js              # Маршруты плагина
│               ├── components/            # Компоненты
│               ├── views/                 # View компоненты
│               ├── stores/                # Pinia stores
│               ├── composables/           # Composables
│               ├── assets/                # Assets
│               └── README.md              # Документация плагина
├── vite.config.js                         # Обновлён с @game-plugins алиасом
└── PLUGINS_GUIDE.md                       # Это руководство
```

## Компоненты системы

### 1. Component Registry

**Файл:** `src/registry/componentRegistry.js` (БЕЗ EXAMPLE)

Централизованный регистр компонентов, который позволяет:
- Регистрировать компоненты ядра
- Переопределять их в плагинах
- Проверять, был ли компонент переопределён

**Использование:**

```javascript
import { componentRegistry } from '@/registry'

// Регистрация компонента ядра
componentRegistry.register('EconomicsView', () => import('@/pages/economics.vue'), true)

// Переопределение в плагине
componentRegistry.register('EconomicsView', () => import('./views/CustomEconomics.vue'))

// Получение компонента
const component = componentRegistry.get('EconomicsView')

// Проверка переопределения
const isOverridden = componentRegistry.isOverridden('EconomicsView') // true
```

### 2. Game Config

**Файл:** `src/config/game.js` (БЕЗ EXAMPLE)

Конфигурация активной игры и доступных игр.

**Использование:**

```javascript
import { GAME_CONFIG, useGameConfig } from '@/config/game'

// Проверка активной игры
if (GAME_CONFIG.isActive('vassals-and-robbers')) {
  // Логика для этой игры
}

// В компоненте (через composable)
const { activeGame, isGameActive } = useGameConfig()

console.log(activeGame) // 'base-game' или 'vassals-and-robbers'
console.log(isGameActive('vassals-and-robbers')) // true/false
```

### 3. Plugins Registration

**Файл:** `src/@core/utils/plugins.js` (ОБНОВЛЁН, БЕЗ EXAMPLE)

Автоматически загружает:
1. Обычные плагины из `src/plugins/`
2. Игровые плагины из `src/plugins/game-plugins/*/index.js`

## Создание плагина

### Шаг 1: Создайте структуру

```bash
cd era_front/src/plugins/game-plugins
mkdir -p my-game/{components,views,stores,composables,assets}
```

### Шаг 2: Создайте index.js

```javascript
// EXAMPLE: Это шаблонный файл для создания своего плагина
import { componentRegistry } from '@/registry'
import { GAME_CONFIG } from '@/config/game'

export default function MyGamePlugin(app) {
  if (!GAME_CONFIG.isActive('my-game')) {
    console.log('[My Game] Plugin not active, skipping...')
    return
  }

  console.log('[My Game] Initializing plugin...')

  // Переопределение компонентов
  // import CustomView from './views/CustomView.vue'
  // componentRegistry.register('SomeView', CustomView)

  console.log('[My Game] Plugin initialized')
}
```

### Шаг 3: Добавьте маршруты (routes.js)

```javascript
// EXAMPLE: Это шаблонный файл для создания своего плагина
export const myGameRoutes = [
  {
    path: 'my-feature',
    component: () => import('./views/MyFeatureView.vue'),
  },
]
```

### Шаг 4: Обновите конфигурацию

В `src/config/game.js` добавьте свою игру:

```javascript
availableGames: {
  'base-game': { name: 'Era of Change', description: 'Базовая игра' },
  'my-game': { name: 'My Game', description: 'Моя игра' },
},
```

### Шаг 5: Активируйте плагин

В `.env`:

```bash
VITE_ACTIVE_GAME=my-game
```

## Использование плагина

### Переопределение существующих компонентов

```javascript
// В index.js плагина
import { componentRegistry } from '@/registry'
import CustomEconomicsView from './views/CustomEconomicsView.vue'

// Переопределяем страницу Economics
componentRegistry.register('EconomicsView', CustomEconomicsView)
```

### Добавление новых маршрутов

```javascript
// В routes.js плагина
export const vassalsRoutes = [
  {
    path: 'vassals',
    component: () => import('./views/VassalsView.vue'),
  },
]
```

Затем в `src/plugins/router/routes.js`:

```javascript
import { GAME_CONFIG } from '@/config/game'
import { vassalsRoutes } from '../game-plugins/vassals-and-robbers/routes'

export const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    children: [
      // Существующие маршруты
      { path: 'dashboard', component: () => import('@/pages/dashboard.vue') },
      
      // Добавляем маршруты плагина
      ...(GAME_CONFIG.isActive('vassals-and-robbers') ? vassalsRoutes : []),
    ],
  },
]
```

### Создание Pinia Store

```javascript
// stores/vassals.js
import { defineStore } from 'pinia'
import axios from 'axios'

export const useVassalsStore = defineStore('vassals', {
  state: () => ({
    vassals: [],
    loading: false,
  }),
  
  getters: {
    loyalVassals: (state) => state.vassals.filter(v => v.loyalty >= 70),
  },
  
  actions: {
    async fetchVassals() {
      this.loading = true
      try {
        const { data } = await axios.get('/api/vassals_and_robbers/vassals')
        this.vassals = data
      } finally {
        this.loading = false
      }
    },
  },
})
```

Использование в компоненте:

```vue
<script setup>
import { useVassalsStore } from '@game-plugins/vassals-and-robbers/stores/vassals'

const vassalsStore = useVassalsStore()

onMounted(() => {
  vassalsStore.fetchVassals()
})
</script>

<template>
  <div>
    <div v-if="vassalsStore.loading">Loading...</div>
    <div v-for="vassal in vassalsStore.vassals" :key="vassal.id">
      {{ vassal.name }} - Loyalty: {{ vassal.loyalty }}
    </div>
  </div>
</template>
```

### Создание Composable

```javascript
// composables/useVassals.js
import { ref } from 'vue'
import axios from 'axios'

export function useVassals() {
  const vassals = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  async function fetchVassals() {
    loading.value = true
    error.value = null
    try {
      const { data } = await axios.get('/api/vassals_and_robbers/vassals')
      vassals.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }
  
  return {
    vassals,
    loading,
    error,
    fetchVassals,
  }
}
```

Использование:

```vue
<script setup>
import { useVassals } from '@game-plugins/vassals-and-robbers/composables/useVassals'

const { vassals, loading, fetchVassals } = useVassals()

onMounted(() => {
  fetchVassals()
})
</script>
```

## Переменные окружения

Создайте файл `.env` в корне проекта:

```bash
# Активная игра
VITE_ACTIVE_GAME=vassals-and-robbers

# Backend URL
VITE_API_BASE_URL=http://localhost:3000

# Frontend Port
FRONTEND_PORT=5173
```

## Алиасы импортов

Доступны следующие алиасы:

```javascript
'@'                     // src/
'@core'                 // src/@core/
'@layouts'              // src/@layouts/
'@images'               // src/assets/images/
'@styles'               // src/assets/styles/
'@game-plugins'         // src/plugins/game-plugins/
```

Примеры:

```javascript
import { componentRegistry } from '@/registry'
import { useVassalsStore } from '@game-plugins/vassals-and-robbers/stores/vassals'
import CustomView from '@game-plugins/my-game/views/CustomView.vue'
```

## Запуск приложения

```bash
# С базовой игрой
VITE_ACTIVE_GAME=base-game npm run dev

# С плагином Vassals and Robbers
VITE_ACTIVE_GAME=vassals-and-robbers npm run dev
```

## Преимущества

✅ **Чистое разделение кода** - каждая игра в своей директории  
✅ **Переопределение компонентов** - через Component Registry  
✅ **Автоматическая загрузка** - плагины загружаются автоматически  
✅ **Условная активация** - через переменные окружения  
✅ **Изоляция** - маршруты, stores, composables отдельно  
✅ **Переиспользование** - можно использовать компоненты ядра  

## Структура файлов

**Инфраструктурные файлы (БЕЗ EXAMPLE):**
- `src/registry/componentRegistry.js`
- `src/registry/index.js`
- `src/config/game.js`
- `src/@core/utils/plugins.js` (обновлён)
- `vite.config.js` (обновлён)

**Файлы плагинов (С EXAMPLE):**
- `src/plugins/game-plugins/vassals-and-robbers/index.js`
- `src/plugins/game-plugins/vassals-and-robbers/routes.js`
- `src/plugins/game-plugins/vassals-and-robbers/README.md`
- `src/plugins/game-plugins/README.md`

## Примеры

См. готовый плагин-шаблон в `src/plugins/game-plugins/vassals-and-robbers/`

