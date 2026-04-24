<script setup lang="ts">
import type { AuthUser } from '@bhvc/contracts'
import { onMounted, ref } from 'vue'
import { requestJson } from '@/lib/http'
import { useSession } from '@/modules/auth/auth'

const { user } = useSession()

const apiUser = ref<AuthUser | null>(null)
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    apiUser.value = await requestJson<AuthUser>('/api/v1/me', 'Could not load the authenticated API example.')
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load the authenticated API example.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="page-stack">
    <div>
      <p class="pill">Dashboard</p>
      <h2 class="section-title">Protected routes and authenticated API calls are ready.</h2>
      <p class="section-copy">This page is served only after the Worker validates the session cookie.</p>
    </div>

    <div class="stats-grid">
      <article class="card stat-card">
        <span>Auth store user</span>
        <strong>{{ user?.email ?? 'No session user loaded' }}</strong>
      </article>

      <article class="card stat-card">
        <span>Authenticated API</span>
        <strong>{{ loading ? 'Loading /api/v1/me...' : apiUser?.email ?? 'Request failed' }}</strong>
      </article>
    </div>

    <article class="card detail-card">
      <p><strong>Session name:</strong> {{ user?.name ?? '-' }}</p>
      <p><strong>API name:</strong> {{ apiUser?.name ?? '-' }}</p>
      <p><strong>API endpoint:</strong> <code>GET /api/v1/me</code></p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </article>
  </section>
</template>

<style scoped>
.page-stack {
  display: grid;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  display: grid;
  gap: 8px;
  padding: 20px;
}

.stat-card strong {
  font-size: 1.25rem;
}

.detail-card {
  padding: 24px;
}

.detail-card p {
  margin: 0;
}

.error {
  color: var(--danger);
}
</style>
