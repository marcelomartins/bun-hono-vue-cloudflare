import { createPinia } from 'pinia'
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { useAuthStore } from './modules/auth/auth'
import { routes } from './router'
import './assets/main.css'

const publicPaths = ['/', '/pricing', '/contact']

export const createApp = ViteSSG(
  App,
  { routes },
  ({ app, router }) => {
    app.use(createPinia())

    router.beforeEach(async (to) => {
      if (!to.meta.requiresAuth) {
        return true
      }

      const authStore = useAuthStore()

      if (!authStore.ready) {
        await authStore.fetchSession()
      }

      if (!authStore.isAuthenticated) {
        return '/'
      }

      return true
    })
  },
)

export const includedRoutes = () => publicPaths
