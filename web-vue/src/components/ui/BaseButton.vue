<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'ghost'
  type?: 'button' | 'submit' | 'reset'
}>()
</script>

<template>
  <button class="button" :class="variant ?? 'primary'" :type="type ?? 'button'">
    <slot />
  </button>
</template>

<style scoped>
.button {
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 180ms ease, opacity 180ms ease, background-color 180ms ease;
}

.button:hover {
  transform: translateY(-1px);
}

.primary {
  background: var(--accent);
  color: white;
}

.ghost {
  background: rgba(21, 32, 43, 0.04);
  color: #15202b;
}
</style>
