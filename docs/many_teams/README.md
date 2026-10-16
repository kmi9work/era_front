# Ветка `many_teams` — фронтовая часть

Канонические ТЗ (оба этапа) лежат в бэкенд-репозитории:

- `../eraofchange/docs/many_teams/TZ-1-struktura-dannyh.md` — этап 1: структура данных (схема, миграции, модели, контракт API, seeds, текущее государство).
- `../eraofchange/docs/many_teams/TZ-2-funkcionalnost.md` — этап 2: экраны и поведение (Дашборд, Информация о стране, Политика, Сражения, Движки, Расходы государства, Годовые результаты, Служебное), включая § 11 «Список файлов этапа 2».

Копии здесь нет намеренно: два экземпляра ТЗ разъедутся. Правки — только в бэкенд-репозитории, в ветке `many_teams`.

## Что меняется в этом репозитории (кратко)

Новые файлы:

- `src/layouts/components/CountryProfile.vue` — переключатель текущего государства в шапке (по образцу `UserProfile.vue`, API — `GET /login_country/:id.json`, `GET /current_country.json`);
- `src/composables/useCurrentCountry.js` — единый источник текущего государства и перечитывания данных (`currentCountry`, `playableCountries`, `setCurrentCountry`, `reloadAll`);
- `src/pages/teams-dashboard.vue` — раздел «Дашборд»: чекбоксы государств + одна таблица отношений выбранных государств со всеми остальными (пары «друг с другом» не показываются), со всеми текущими кнопками.

Изменяемые файлы: `src/layouts/components/{NavItems,DefaultLayoutWithVerticalNav,Notifications}.vue`, `src/plugins/router/routes.js`, `src/pages/dashboard.vue` (переезжает в «Информация о стране», маршрут `/country`), `src/views/dashboard/{Relations,Nobles,Technologies,PublicOrder,Checklists}.vue`, `src/composables/useChecklists.js`, `src/views/pages/politics/{Ownerships,PoliticalActions,Armies,ArmyForm}.vue`, `src/pages/players.vue`, `src/views/pages/aux/{Settings,ChecklistCard,ArtelScreen,CaravanRobbery,ScreenManagement}.vue`.

Экраны расходов и годовых результатов: `src/views/pages/general/{YearlyStats,DetailedYearlyStats}.vue`, `src/pages/merchant-results.vue`, `src/views/pages/aux/{NobleResultsScreen,MerchantResultsScreen,MerchantResults}.vue`, `src/stores/end_game_results.js`.

Источник данных на фронте — параметры API, введённые на этапе 1: `?country_id=`, `?foreign=0|1` (относительно текущего государства), `?playable=1`, `relations_by_country` в ответе страны, `technology_items` с `country_id`.

## Правило приёмки

Отдельного «режима на несколько команд» нет: приложение всегда работает в разрезе текущего государства. Любая задача проверяется на двух стендах: `rake game:teams` (играбельное государство одно — поведение обязано совпадать с текущим) и `TEAMS="Русь,Литва" rake game:teams` (государств несколько — данные обязаны быть разделены).
