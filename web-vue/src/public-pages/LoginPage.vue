<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { apiFetch } from "../api/client";
import { authErrorText, navigate } from "./auth-feedback";
import TurnstileWidget from "./components/TurnstileWidget.vue";
import { usePublicHead } from "./head";

usePublicHead("Entrar — BHVC Starter Kit");

const email = ref("");
const password = ref("");
const feedback = ref("");
const pending = ref(false);
const turnstileToken = ref<string | null>(null);
const turnstile = useTemplateRef<InstanceType<typeof TurnstileWidget>>("turnstile");

async function submit(): Promise<void> {
  if (pending.value) return;
  pending.value = true;
  feedback.value = "";
  try {
    await apiFetch<void>("/auth/login", {
      body: {
        email: email.value,
        password: password.value,
        ...(turnstileToken.value === null ? {} : { turnstileToken: turnstileToken.value })
      },
      authenticated: false
    });
    navigate("/dashboard");
  } catch (error) {
    feedback.value = authErrorText(error);
    turnstile.value?.reset();
    pending.value = false;
  }
}
</script>

<template>
  <section class="auth-card card">
    <h1 class="section-title">Entrar</h1>
    <p class="section-copy">Acesse a área protegida com sua conta.</p>

    <form class="auth-form" @submit.prevent="submit">
      <label class="field">
        <span>E-mail</span>
        <input v-model="email" type="email" name="email" autocomplete="email" required />
      </label>

      <label class="field">
        <span>Senha</span>
        <input
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
          required
        />
      </label>

      <TurnstileWidget ref="turnstile" action="login" @token="turnstileToken = $event" />

      <p v-if="feedback" class="form-error" role="alert">{{ feedback }}</p>

      <button class="button primary" type="submit" :disabled="pending">
        {{ pending ? "Entrando…" : "Entrar" }}
      </button>
    </form>

    <p class="auth-switch">
      Ainda não tem conta?
      <RouterLink to="/register">Criar conta</RouterLink>
    </p>
  </section>
</template>
