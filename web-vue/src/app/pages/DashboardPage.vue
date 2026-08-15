<script setup lang="ts">
import { useCurrentUser } from "../../shared/user";

const { user } = useCurrentUser();
</script>

<template>
  <section class="page card">
    <p class="pill">Área protegida</p>
    <h1 class="section-title">Visão geral</h1>
    <p class="section-copy">
      Esta rota só é servida depois que o Worker valida a sessão. Substitua este conteúdo pelo
      painel do seu produto.
    </p>
    <p v-if="user" class="section-copy">
      Sessão ativa para <strong>{{ user.name }}</strong> ({{ user.email }}).
    </p>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: clamp(28px, 6vw, 48px);
}
</style>
