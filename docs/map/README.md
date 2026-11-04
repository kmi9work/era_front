# Карта: редактор координат (era_front)

Полное ТЗ — в репозитории бэкенда: `eraofchange/docs/map/TZ-karta.md` (ветка `map`).
Здесь только то, что касается этого репозитория.

## Что делаем

Таб «Карта» в существующей странице «Политика» (`src/pages/politics.vue`): картинка
`/images/map/map-base.png` с маркерами поселений, перетаскивание маркера сохраняет
нормализованные координаты `map_x`, `map_y` (0..1) через
`PATCH /settlements/:id.json?settlement[map_x]=&settlement[map_y]=`.

## Файлы

- `src/views/pages/politics/MapEditor.vue` — новый компонент (карта, маркеры, список непривязанных);
- `src/pages/politics.vue` — четвёртый таб и рендер компонента.

## Контракт

- `GET /settlements.json?all=1` — в элементах есть `map_x`, `map_y` (число или `null`), `fortress_level`;
- `PATCH /settlements/:id.json` — `settlement[map_x]`, `settlement[map_y]`; пустая строка снимает город с карты;
- картинка карты — статика бэкенда по адресу `/images/map/map-base.png` (хвост `/backend` от адреса API отрезается, как в `src/utils`/`useCurrentCountry`).

## Проверка

`npx vite build --outDir dist-check --emptyOutDir` + `node <skill_dir>/scripts/check-vue-component-imports.mjs src components.d.ts`
(подробности — в скилле `era-platform`), затем браузерная проверка: таб открывается,
маркер перетаскивается, после перезагрузки страницы координаты на месте.
