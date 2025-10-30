<!-- EXAMPLE: Это шаблонный файл для создания своей плагинной системы -->
# Game Plugins

Директория для игровых плагинов era_front приложения.

## Создание нового плагина

1. Создайте директорию с именем плагина (kebab-case)
2. Создайте структуру файлов:

```
your-game-plugin/
├── index.js            # Главный файл плагина
├── routes.js           # Маршруты плагина
├── components/         # Компоненты
├── views/             # Страницы
├── stores/            # Pinia stores
├── composables/       # Composables
├── assets/            # Assets
└── README.md          # Документация
```

3. Экспортируйте default функцию в `index.js`:

```javascript
import { GAME_CONFIG } from '@/config/game'

export default function YourGamePlugin(app) {
  if (!GAME_CONFIG.isActive('your-game')) {
    return
  }
  
  console.log('[Your Game] Initializing...')
  // Ваша логика
}
```

4. Плагин автоматически загрузится благодаря glob import

## Переопределение компонентов

Используйте Component Registry для переопределения компонентов ядра:

```javascript
import { componentRegistry } from '@/registry'
import MyCustomComponent from './components/MyCustomComponent.vue'

componentRegistry.register('CoreComponentName', MyCustomComponent)
```

## Активация плагина

В `.env`:

```bash
VITE_ACTIVE_GAME=your-game-name
```

## Существующие плагины

- `vassals-and-robbers` - Плагин игры "Vassals and Robbers"

