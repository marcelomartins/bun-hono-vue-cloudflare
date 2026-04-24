import type { RouteRecordRaw } from 'vue-router'
import ContactPage from '@/public-pages/ContactPage.vue'
import HomePage from '@/public-pages/HomePage.vue'
import PricingPage from '@/public-pages/PricingPage.vue'
import PublicLayout from '@/public-pages/layouts/PublicLayout.vue'

export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomePage,
      },
      {
        path: 'pricing',
        name: 'pricing',
        component: PricingPage,
      },
      {
        path: 'contact',
        name: 'contact',
        component: ContactPage,
      },
    ],
  },
]
