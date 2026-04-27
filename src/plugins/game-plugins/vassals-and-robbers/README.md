<!-- EXAMPLE: Это шаблонный файл для создания своего плагина -->
# Vassals and Robbers Frontend Plugin

Vue 3 плагин для функционала игры "Vassals and Robbers"

## Структура

```
vassals-and-robbers/
├── index.js            # Главный файл плагина
├── routes.js           # Маршруты плагина
├── components/         # Компоненты плагина
├── views/             # View компоненты (страницы)
├── stores/            # Pinia stores
├── composables/       # Vue composables
└── assets/            # Изображения, стили
```

## Использование

### Активация плагина

В файле `.env`:

```bash
VITE_ACTIVE_GAME=vassals-and-robbers
```

### Переопределение компонентов ядра

```javascript
// В index.js плагина
import { componentRegistry } from '@/registry'
import CustomEconomicsView from './views/CustomEconomicsView.vue'

// Переопределяем компонент из ядра
componentRegistry.register('EconomicsView', CustomEconomicsView)
```

### Добавление новых маршрутов

```javascript
// В routes.js плагина
export const vassalsAndRobbersRoutes = [
  {
    path: 'vassals',
    component: () => import('./views/VassalsView.vue'),
  },
]
```

Затем в `src/plugins/router/routes.js` импортируйте и добавьте:

```javascript
import { GAME_CONFIG } from '@/config/game'
import { vassalsAndRobbersRoutes } from '../game-plugins/vassals-and-robbers/routes'

// В children секции:
...(GAME_CONFIG.isActive('vassals-and-robbers') ? vassalsAndRobbersRoutes : []),
```

### Создание Pinia Store

```javascript
// stores/vassals.js
import { defineStore } from 'pinia'

export const useVassalsStore = defineStore('vassals', {
  state: () => ({
    vassals: [],
    loading: false,
  }),
  
  actions: {
    async fetchVassals() {
      this.loading = true
      // API calls
      this.loading = false
    },
  },
})
```

### Использование Composable

```javascript
// composables/useVassals.js
import { ref } from 'vue'
import axios from 'axios'

export function useVassals() {
  const vassals = ref([])
  const loading = ref(false)
  
  async function fetchVassals() {
    loading.value = true
    const { data } = await axios.get('/api/vassals')
    vassals.value = data
    loading.value = false
  }
  
  return {
    vassals,
    loading,
    fetchVassals,
  }
}
```

## TODO

- [ ] Создать view компоненты
- [ ] Создать Pinia stores
- [ ] Создать composables
- [ ] Добавить маршруты
- [ ] Переопределить компоненты ядра (если нужно)

