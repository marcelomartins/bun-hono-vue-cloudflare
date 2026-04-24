import type { LoginRequest, RegisterRequest, SessionResponse } from '@bhvc/contracts'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { defineStore } from 'pinia'
import { requestJson } from '@/lib/http'

type AuthState = {
  session: SessionResponse | null
  loading: boolean
  ready: boolean
  errorMessage: string
}

const loggedOutSession: SessionResponse = {
  authenticated: false,
  user: null,
}

const requestAuth = <T>(path: string, errorMessage: string, init?: RequestInit) => {
  return requestJson<T>(`/auth${path}`, errorMessage, init)
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    session: null,
    loading: false,
    ready: false,
    errorMessage: '',
  }),
  getters: {
    isAuthenticated: (state) => state.session?.authenticated === true,
  },
  actions: {
    async fetchSession() {
      this.loading = true

      try {
        this.session = await requestAuth<SessionResponse>('/session', 'Could not load the current session.')
        this.errorMessage = ''
      } catch (error) {
        this.session = loggedOutSession
        this.errorMessage = error instanceof Error ? error.message : 'Could not load the current session.'
      } finally {
        this.loading = false
        this.ready = true
      }
    },
    async login(payload: LoginRequest) {
      this.loading = true

      try {
        this.session = await requestAuth<SessionResponse>('/login', 'Could not sign in.', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        this.errorMessage = ''
      } catch (error) {
        this.session = loggedOutSession
        this.errorMessage = error instanceof Error ? error.message : 'Could not sign in.'
      } finally {
        this.loading = false
        this.ready = true
      }
    },
    async register(payload: RegisterRequest) {
      this.loading = true

      try {
        this.session = await requestAuth<SessionResponse>('/register', 'Could not create the account.', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        this.errorMessage = ''
      } catch (error) {
        this.session = loggedOutSession
        this.errorMessage = error instanceof Error ? error.message : 'Could not create the account.'
      } finally {
        this.loading = false
        this.ready = true
      }
    },
    logout() {
      this.session = loggedOutSession
      this.loading = false
      this.ready = true
      this.errorMessage = ''

      void requestAuth<{ ok: true }>('/logout', 'Could not sign out.', {
        method: 'POST',
      }).catch(() => {})
    },
  },
})

export const useAuth = () => {
  const authStore = useAuthStore()
  const { errorMessage, loading, ready, session } = storeToRefs(authStore)

  return {
    errorMessage,
    loading,
    ready,
    session,
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    fetchSession: authStore.fetchSession,
  }
}

export const useSession = () => {
  const authStore = useAuthStore()

  return {
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => authStore.session?.user ?? null),
  }
}
