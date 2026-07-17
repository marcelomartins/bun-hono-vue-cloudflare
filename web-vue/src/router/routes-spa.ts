import { PROTECTED_ROUTE_PREFIXES } from '@bhvc/contracts'
import type { RouteRecordRaw } from 'vue-router'
import SpaLayout from '@/layouts/SpaLayout.vue'

const [dashboardPath, accountPath, settingsPath] = PROTECTED_ROUTE_PREFIXES

export const spaRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: SpaLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: dashboardPath.slice(1),
        name: 'dashboard',
        component: () => import('@/modules/dashboard/pages/DashboardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: accountPath.slice(1),
        name: 'account',
        component: () => import('@/modules/account/pages/AccountPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: settingsPath.slice(1),
        name: 'settings',
        component: () => import('@/modules/settings/pages/SettingsPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
]
