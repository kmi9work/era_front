# ТЗ № 2 (функциональность) на фронте: контракт реализации

Документ описывает общие соглашения этапа 2 в `era_front` (ветка `many_teams`).
Требования — `eraofchange/docs/many_teams/TZ-2-funkcionalnost.md`.
Бэкенд этапов 1–2 — `eraofchange/docs/many_teams/TZ-1-struktura-dannyh.md`.

## 1. Текущее государство

Единый источник — composable `@/composables/useCurrentCountry` (модульное состояние,
разделяется всеми компонентами; дублировать состояние в компонентах нельзя).

```js
import { useCurrentCountry } from '@/composables/useCurrentCountry'

const {
  currentCountry,     // ref<Object|null> — { id, name, short_name, flag_image_name, ... }
  currentCountryId,   // ref<Number|null>
  countries,          // ref<Array> — ВСЕ государства (признака «играбельное» нет)
  reloadToken,        // ref<Number> — ++ при смене государства
  isLoading,          // ref<Boolean>
  error,              // ref<String|null>
  loadCurrentCountry, // async () => country|null
  loadCountries,      // async () => array
  setCurrentCountry,  // async (id) => country|null  (GET /login_country/:id.json)
  reloadAll,          // () => void — принудительное перечитывание данных экранами
  withCountryParam,   // (url, id?) => url с country_id
} = useCurrentCountry()
```

Правила работы экрана:

1. На `onBeforeMount`/`onMounted`: `await loadCurrentCountry()` (при необходимости
   `await loadCountries()`), затем загрузка собственных данных.
2. Смена государства: `watch(reloadToken, () => { /* сброс кэшей и повторная загрузка */ })`.
   Экран не должен сохранять данные прошлого государства после смены.
3. В запросы, поддерживающие `country_id`, подставлять его явно:
   `` `${import.meta.env.VITE_PROXY}/players.json?country_id=${currentCountryId.value}` ``.
   Бэкенд по умолчанию тоже берёт текущее государство — явный параметр фиксирует контекст.
4. Никаких переключателей «режима» и признаков «одна команда / много команд»;
   блоки не скрываются по «играбельности» государства: играбельно любое.
5. `Country::RUS` и `id=1` в новом коде не использовать.

## 2. API (реализовано на бэкенде)

| Метод и адрес | Назначение |
|---|---|
| `GET /current_country.json` | текущее государство сессии |
| `GET /login_country/:id.json` | сменить текущее государство (404 — сессия не меняется) |
| `GET /countries.json`, `?foreign=1` | все / все, кроме текущего; в ответе `relations`, `relations_by_country`, `relation_items`, `relation_points` (пара с текущим), `alliances`, `embargo` |
| `GET /countries/relations_matrix.json?country_ids=1,2` | `{ country_ids, countries:[{id,name,short_name,flag_image_name}], rows:[{ partner:{...A}, country:{...B со всеми полями отношений пары A↔B} }] }`; пары между отмеченными не попадают |
| `PATCH /countries/:id/add_relation_item.json` | `{ value, comment, partner_country_id }` — правка пары |
| `DELETE /relation_items/:id.json` | удалить правку пары |
| `PATCH /countries/:id/improve_relations_via_trade.json?partner_country_id=` | улучшить через торговлю |
| `PATCH /countries/:id/set_embargo` | эмбарго страны |
| `PATCH /countries/:id/join_peace.json` | присоединить страну миром (к текущему государству) |
| `GET /players.json` | `?country_id=`, `?player_type_id=2` (знать) |
| `GET /players/:id/income_breakdown.json?country_id=` | разбивка дохода по владениям государства; `components.vassal_income` — доход от вассалов |
| `PATCH /players/:id.json` | `{ params: { income_taken } }` |
| `GET /regions.json` | `?foreign=0` — регионы текущего государства, `?foreign=1` — все прочие, `?country_id=` — явная страна |
| `GET /settlements.json` | `?country_id=`, `?all=1` |
| `GET /technologies.json?country_id=` | `is_open` и `technology_items` этого государства |
| `PATCH /technology_items/:id.json` | `{ value }` |
| `GET /jobs.json?nobles=1&country_id=` | должности с держателями (`players`) и `political_actions` этого государства |
| `PATCH /jobs/:id.json?job[player_ids][]=` | смена держателя в пределах государства (держатели других государств сохраняются) |
| `GET /armies.json` | `?foreign=0` — армии государства и его знати, `?foreign=1` — армии прочих государств, `?country_id=` |
| `GET /political_actions.json?country_id=&year=` | политдействия государства |
| `PATCH /game_parameters/pay_state_expenses.json?country_id=` | подтвердить расходы государства за текущий год |
| `PATCH /game_parameters/unpay_state_expenses.json?country_id=` | отменить подтверждение |
| `GET /game_parameters/get_vassalage_settings.json?country_id=` | `{ country_id, country, vassal_incomes: {вассал: сумма}, by_sovereign: {...} }` |
| `PATCH /game_parameters/update_vassalage_settings.json?country_id=` | `{ vassal_incomes: {вассал: сумма} }` — пишет только срез своего государства |
| `GET /vassals_and_robbers/checklists.json?country_id=` | чек-листы государства-сюзерена |
| `POST /vassals_and_robbers/checklists/:id/establish_vassalage.json?country_id=` | установить вассалитет пары |
| `POST /vassals_and_robbers/checklists/:id/remove_vassalage.json?country_id=` | снять вассалитет пары |
| `GET /game_parameters/screen_bundle?country_id=&year=` | `{ display, country_id, year, source: 'live'|'snapshot', merchants, nobles, show_cap_per_player, intelligence_data_status }` |
| `GET /game_parameters/show_sorted_results?country_id=&year=`, `show_noble_results?country_id=&year=`, `display_results?country_id=` | результаты государства (купцы/знать/подэкран) |
| `PATCH /game_parameters/change_results_display { request }`, `update_merchant_results_settings`, `clear_results { country_id }` | настройки экрана результатов |
| `GET /game_parameters/get_active_lingering_effects.json` | активные длящиеся эффекты (`effects[]` с `effect`, `targets`) |

## 3. Общие компоненты

- `@/components/PairRelationsCell.vue` — действия пары «A ↔ B» в одной ячейке: число
  отношений с меню ручных правок, ±1, союзы (бейдж + диалог), эмбарго, «улучшить через
  торговлю», подсказка о действующем эффекте. Props: `country` (страна B — pair-scoped
  объект из `relations_matrix`), `partnerCountry` (страна A), `effects`,
  `withRelationItemsMenu` (по умолчанию `true` — меню правок внутри ячейки; в строке
  «Информации о стране» передаётся `false`, там меню живёт в столбце «Страна»),
  `withComment` (иконка-подсказка; в строке `false` — причина блокировки показана
  предупреждением над таблицей, как было до many_teams).
  Emit: `reload`.
- `@/components/RelationsRow.vue` — строка «Страна / Отношения» для «Информации о стране»
  (вид таблицы прежний, до many_teams). Props: `country`, `partnerCountry`, `effects`.
  Emit: `reload`. Столбец «Страна» — государство строки и меню ручных правок пары,
  столбец «Отношения» — `PairRelationsCell` (`:with-relation-items-menu="false"`
  `:with-comment="false"`); собственной копии кнопочной логики в строке нет.
- `@/composables/usePairEffects.js` — `partnerId`, `pairEffects`, `hasNoRelationImprovement`,
  `nonNegativeRelations`, `commentText` для пары «A ↔ B»; общий для ячейки и строки.
- `@/components/AlliancesDialog.vue` — принимает `partnerCountryId` (государство A пары);
  по умолчанию — текущее государство.
- `@/layouts/components/CountryProfile.vue` — бейдж текущего государства в шапке.

## 4. Структура разделов

| Раздел | Маршрут | Файл страницы |
|---|---|---|
| Дашборд | `/dashboard` | `src/pages/teams-dashboard.vue` |
| Информация о стране | `/country` | `src/pages/country.vue` |

Редирект `/` → `/dashboard`. Экран «Информация» переименован в «Информация о стране».

Дашборд — матрица отношений: строки — зарубежные государства (все, кроме отмеченных),
столбцы — отмеченные государства, «за которые идёт игра» (в заголовке флаг и название,
в ячейке — `PairRelationsCell` с отношениями пары). Первый столбец закреплён при
горизонтальной прокрутке, таблица при нехватке ширины прокручивается, а не сжимает
ячейки. Выбор государств — настройка вида в `localStorage` (`dashboard_countries`).

## 5. Соглашения кода

- `import axios from 'axios'` — явно (axios не в auto-import); `@/composables/*` — явно.
- Ответы бэкенда: старые поля не переименовывать и не удалять, только добавлять.
- Проверка перед сдачей: `npx eslint <изменённые файлы> -c .eslintrc.cjs --ext .vue,.js`.
- Когда мастера работают за одну страну, поведение и вид экранов обязаны совпадать
  с прежними: различия допустимы только в добавленных элементах (бейдж государства,
  название вкладки, новые поля).
