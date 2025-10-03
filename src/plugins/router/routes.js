export const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: 'dashboard',
        component: () => import('@/pages/dashboard.vue'),
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
      }



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
    ],
  },
]
