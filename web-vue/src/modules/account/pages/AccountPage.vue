<script setup lang="ts">
import { useSession } from '@/modules/auth/auth'

const { user } = useSession()
</script>

<template>
  <section class="page-stack">
    <div>
      <p class="pill">Account</p>
      <h2 class="section-title">{{ user?.name ?? 'Account' }}</h2>
      <p class="section-copy">This page reads the authenticated user from the shared auth store.</p>
    </div>

    <div class="card detail-card">
      <p><strong>Email:</strong> {{ user?.email ?? '-' }}</p>
      <p><strong>ID:</strong> {{ user?.id ?? '-' }}</p>
    </div>
  </section>
</template>

<style scoped>
.page-stack {
  display: grid;
  gap: 20px;
}

.detail-card {
  padding: 24px;
}
</style>
