<script setup lang="ts">
import { usePublicHead } from "./head";

usePublicHead("Planos — BHVC Starter Kit");
</script>

<template>
  <section class="page card">
    <h1 class="section-title">Planos</h1>
    <p class="section-copy">
      Página pública de exemplo, pré-renderizada com SSG. Substitua este conteúdo pelos planos do
      seu produto.
    </p>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: clamp(28px, 6vw, 64px);
  margin-top: 12px;
}
</style>
