<template>
  <header class="site-header shell">
    <RouterLink class="brand" to="/">BHVC</RouterLink>

    <nav>
      <RouterLink to="/pricing">Pricing</RouterLink>
      <RouterLink to="/contact">Contact</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 28px 0 16px;
}

.brand {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--text-soft);
}

@media (max-width: 720px) {
  .site-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
