import type { RouteRecordRaw } from 'vue-router'
import SpaLayout from '@/layouts/SpaLayout.vue'

export const spaRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: SpaLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/pages/DashboardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'account',
        name: 'account',
        component: () => import('@/modules/account/pages/AccountPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/modules/settings/pages/SettingsPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
]