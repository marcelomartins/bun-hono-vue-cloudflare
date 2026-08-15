<script setup lang="ts">
import { ref } from "vue";
import { apiFetch } from "../../api/client";
import { ApiError } from "../../api/errors";
import { errorMessage } from "../../i18n/pt-BR";

const currentPassword = ref("");
const newPassword = ref("");
const feedback = ref("");
const success = ref(false);
const pending = ref(false);

async function submit(): Promise<void> {
  if (pending.value) return;
  pending.value = true;
  feedback.value = "";
  success.value = false;
  try {
    await apiFetch<void>("/api/v1/me/password", {
      method: "PUT",
      body: { currentPassword: currentPassword.value, newPassword: newPassword.value }
    });
    currentPassword.value = "";
    newPassword.value = "";
    success.value = true;
  } catch (error) {
    feedback.value =
      error instanceof ApiError
        ? errorMessage(error.code, error.requestId)
        : errorMessage("INTERNAL_ERROR");
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <section class="page card">
    <h1 class="section-title">Configurações</h1>
    <p class="section-copy">
      Trocar a senha encerra as sessões abertas nos outros dispositivos. Esta sessão continua ativa.
    </p>

    <form class="settings-form" @submit.prevent="submit">
      <label class="field">
        <span>Senha atual</span>
        <input
          v-model="currentPassword"
          type="password"
          name="currentPassword"
          autocomplete="current-password"
          required
        />
      </label>

      <label class="field">
        <span>Nova senha</span>
        <input
          v-model="newPassword"
          type="password"
          name="newPassword"
          autocomplete="new-password"
          required
          minlength="8"
        />
      </label>

      <p v-if="feedback" class="form-error" role="alert">{{ feedback }}</p>
      <p v-else-if="success" class="form-success" role="status">Senha alterada.</p>

      <button class="button primary" type="submit" :disabled="pending">
        {{ pending ? "Alterando…" : "Alterar senha" }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: clamp(28px, 6vw, 48px);
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 420px;
  align-items: flex-start;
}

.settings-form .field {
  width: 100%;
}
</style>
