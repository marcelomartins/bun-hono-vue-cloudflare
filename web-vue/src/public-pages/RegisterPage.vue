<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { apiFetch } from "../api/client";
import { authErrorText, navigate } from "./auth-feedback";
import TurnstileWidget from "./components/TurnstileWidget.vue";
import { usePublicHead } from "./head";

usePublicHead("Criar conta — BHVC Starter Kit");

const name = ref("");
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
    await apiFetch("/auth/register", {
      body: {
        name: name.value,
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
    <h1 class="section-title">Criar conta</h1>
    <p class="section-copy">Cadastre-se para acessar a área protegida.</p>

    <form class="auth-form" @submit.prevent="submit">
      <label class="field">
        <span>Nome</span>
        <input v-model="name" type="text" name="name" autocomplete="name" required minlength="2" />
      </label>

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
          autocomplete="new-password"
          required
          minlength="8"
        />
      </label>

      <TurnstileWidget ref="turnstile" action="register" @token="turnstileToken = $event" />

      <p v-if="feedback" class="form-error" role="alert">{{ feedback }}</p>

      <button class="button primary" type="submit" :disabled="pending">
        {{ pending ? "Criando conta…" : "Criar conta" }}
      </button>
    </form>

    <p class="auth-switch">
      Já tem conta?
      <RouterLink to="/login">Entrar</RouterLink>
    </p>
  </section>
</template>
