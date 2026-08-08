<script setup lang="ts">
import type { HomeNavigationItem } from './home.config'

defineProps<{
  items: readonly HomeNavigationItem[]
}>()
</script>

<template>
  <nav class="home-desktop-navigation" aria-label="Primary">
    <ul>
      <li v-for="item in items" :key="item.href">
        <a :href="item.href">{{ item.label }}</a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.home-desktop-navigation {
  display: none;
}

@media (width >= 64rem) {
  .home-desktop-navigation {
    display: block;
    justify-self: center;
  }

  .home-desktop-navigation ul {
    display: flex;
    gap: 2.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .home-desktop-navigation a {
    font-size: 0.875rem;
    line-height: var(--line-height-body);
    text-decoration: none;
  }
}
</style>
