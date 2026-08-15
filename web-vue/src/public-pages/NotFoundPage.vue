<script setup lang="ts">
import { usePublicHead } from "./head";

usePublicHead("Página não encontrada — BHVC Starter Kit");
</script>

<template>
  <section class="page card">
    <p class="pill">404</p>
    <h1 class="section-title">Página não encontrada</h1>
    <p class="section-copy">O endereço que você acessou não existe ou foi movido.</p>
    <RouterLink class="button primary" to="/">Voltar para o início</RouterLink>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: clamp(28px, 6vw, 64px);
  margin-top: 12px;
}
</style>
