<script setup lang="ts">
import SiteHeader from '../components/SiteHeader.vue'
</script>

<template>
  <div>
    <SiteHeader />

    <main class="shell public-layout">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.public-layout {
  display: grid;
  gap: 24px;
  padding-bottom: 48px;
}
</style>