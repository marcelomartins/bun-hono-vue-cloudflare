<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuth } from '@/modules/auth/auth'

const router = useRouter()
const { register, loading, errorMessage, session } = useAuth()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const localError = ref('')

const hasMismatch = computed(() => {
  return form.confirmPassword.length > 0 && form.password !== form.confirmPassword
})

const submit = async () => {
  if (hasMismatch.value) {
    localError.value = 'Passwords do not match.'
    return
  }

  localError.value = ''

  await register({
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password,
  })

  if (session.value?.authenticated) {
    await router.push('/dashboard')
  }
}
</script>

<template>
  <form class="register-form" @submit.prevent="submit">
    <label>
      <span>Name</span>
      <input v-model="form.name" autocomplete="name" type="text" required />
    </label>

    <label>
      <span>Email</span>
      <input v-model="form.email" autocomplete="email" type="email" required />
    </label>

    <label>
      <span>Password</span>
      <input v-model="form.password" autocomplete="new-password" minlength="8" type="password" required />
    </label>

    <label>
      <span>Confirm password</span>
      <input
        v-model="form.confirmPassword"
        autocomplete="new-password"
        minlength="8"
        type="password"
        required
      />
    </label>

    <p v-if="localError || hasMismatch || errorMessage" class="error">
      {{ localError || (hasMismatch ? 'Passwords do not match.' : errorMessage) }}
    </p>

    <BaseButton type="submit">{{ loading ? 'Creating account...' : 'Create account' }}</BaseButton>
  </form>
</template>

<style scoped>
.register-form {
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
