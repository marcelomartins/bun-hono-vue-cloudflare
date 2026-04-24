<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuth } from '@/modules/auth/auth'

const router = useRouter()
const { login, loading, errorMessage, session } = useAuth()

const form = reactive({
  email: '',
  password: '',
})

const submit = async () => {
  await login(form)

  if (session.value?.authenticated) {
    await router.push('/dashboard')
  }
}
</script>

<template>
  <form class="login-form" @submit.prevent="submit">
    <label>
      <span>Email</span>
      <input v-model="form.email" autocomplete="email" type="email" required />
    </label>

    <label>
      <span>Password</span>
      <input v-model="form.password" autocomplete="current-password" type="password" required />
    </label>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <BaseButton type="submit">{{ loading ? 'Signing in...' : 'Sign in' }}</BaseButton>
  </form>
</template>

<style scoped>
.login-form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 8px;
  font-weight: 600;
}

input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.82);
}

.error {
  margin: 0;
  color: var(--danger);
}
</style>
