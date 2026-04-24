<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoginForm from './components/LoginForm.vue'
import RegisterForm from './components/RegisterForm.vue'

const activeForm = ref<'login' | 'register'>('login')
</script>

<template>
  <section class="hero card">
    <div class="hero-copy">
      <p class="pill">BHVC starter</p>
      <h1 class="section-title">A simple Bun, Hono, Vue, and Cloudflare starter kit.</h1>
      <p class="section-copy">
        Use the public pages, register a user, and test protected routes backed by a Cloudflare Worker.
      </p>
    </div>

    <div class="login-panel card">
      <div class="panel-header">
        <div>
          <h2>{{ activeForm === 'login' ? 'Sign in' : 'Create account' }}</h2>
          <p>
            {{
              activeForm === 'login'
                ? 'Use an existing account to access the protected SPA shell.'
                : 'Register a new account and sign in automatically.'
            }}
          </p>
        </div>

        <div class="panel-actions">
          <BaseButton :variant="activeForm === 'login' ? 'primary' : 'ghost'" @click="activeForm = 'login'">
            Sign in
          </BaseButton>
          <BaseButton :variant="activeForm === 'register' ? 'primary' : 'ghost'" @click="activeForm = 'register'">
            Register
          </BaseButton>
        </div>
      </div>

      <LoginForm v-if="activeForm === 'login'" />
      <RegisterForm v-else />
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  gap: 24px;
  padding: 28px;
}

.hero-copy {
  display: grid;
  gap: 18px;
  align-content: center;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.login-panel {
  display: grid;
  gap: 18px;
  padding: 24px;
}

.login-panel h2,
.login-panel p {
  margin-top: 0;
}

.panel-header {
  display: grid;
  gap: 16px;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 920px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
