<script setup lang="ts">
import { usePublicHead } from "./head";

usePublicHead(
  "BHVC Starter Kit",
  "Starter full-stack com Bun, Hono, Vue e Cloudflare: páginas públicas pré-renderizadas e SPA protegida pelo Worker."
);
</script>

<template>
  <section class="hero card">
    <p class="pill">BHVC starter</p>
    <h1 class="section-title">Um starter kit simples com Bun, Hono, Vue e Cloudflare.</h1>
    <p class="section-copy">
      Páginas públicas pré-renderizadas com SSG, rotas protegidas servidas pelo Worker após
      autenticação e contratos TypeScript compartilhados entre frontend e backend.
    </p>
    <div class="hero-actions">
      <RouterLink class="button primary" to="/register">Criar uma conta</RouterLink>
      <RouterLink class="button ghost" to="/login">Já tenho conta</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  padding: clamp(28px, 6vw, 64px);
  margin-top: 12px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
