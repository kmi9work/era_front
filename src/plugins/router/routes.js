export const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        // Дашборд — отношения выбранных государств со всеми остальными (ТЗ № 2, § 2)
        path: 'dashboard',
        component: () => import('@/pages/teams-dashboard.vue'),
      },
      {
        // Информация о стране — прежний экран «Информация» в разрезе текущего государства (§ 3)
        path: 'country',
        component: () => import('@/pages/country.vue'),
      },
      {
        path: 'economics',
        component: () => import('@/pages/economics.vue'),
      },
      {
        path: 'politics',
        component: () => import('@/pages/politics.vue'),
      },
      {
        path: 'armies',
        component: () => import('@/pages/armies.vue'),
      },
      {
        path: 'aux',
        component: () => import('@/pages/aux.vue'),
      },
      {
        path: 'general',
        component: () => import('@/pages/general.vue'),
      },
      {
        path: 'players',
        component: () => import('@/pages/players.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: 'merchant-results',
        component: () => import('@/pages/merchant-results.vue'),
      },
      {
        path: 'mobile-exchange',
        component: () => import('@/views/pages/economics/ExchangeMobile.vue'),
      },
    ],
  },
]
