<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuth } from '@/modules/auth/auth'

const router = useRouter()
const { logout, session } = useAuth()

const handleLogout = () => {
  logout()
  void router.push('/')
}
</script>

<template>
  <div class="shell spa-shell">
    <aside class="card side-nav">
      <p class="pill">Protected SPA</p>
      <h1>{{ session?.user?.name ?? 'BHVC' }}</h1>

      <nav>
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/account">Account</RouterLink>
        <RouterLink to="/settings">Settings</RouterLink>
      </nav>

      <BaseButton variant="ghost" @click="handleLogout">Sign out</BaseButton>
    </aside>

    <main class="card content-panel">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.spa-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  padding: 32px 0 48px;
}

.side-nav,
.content-panel {
  padding: 24px;
}

.side-nav {
  display: grid;
  gap: 16px;
  align-content: start;
}

.side-nav h1 {
  margin: 0;
  font-size: 1.5rem;
}

nav {
  display: grid;
  gap: 10px;
}

@media (max-width: 920px) {
  .spa-shell {
    grid-template-columns: 1fr;
  }
}
</style>