<script setup lang="ts">
import { ref } from 'vue'
import { homeAnchorIds, homeContent, homeNavigationItems } from './home.config'

const isMenuOpen = ref(false)
</script>

<template>
  <header class="home-header">
    <UiContainer class="home-header__inner">
      <a class="home-header__brand" href="#home" aria-label="Deploy Lab home">
        {{ homeContent.brand }}
      </a>

      <nav class="home-header__desktop-nav" aria-label="Primary">
        <ul>
          <li v-for="item in homeNavigationItems" :key="item.href">
            <a :href="item.href">{{ item.label }}</a>
          </li>
        </ul>
      </nav>

      <a class="home-header__action" :href="`#${homeAnchorIds.contact}`">
        {{ homeContent.hero.actionLabel }}
      </a>

      <UiMenuToggle
        v-model="isMenuOpen"
        class="home-header__menu-toggle"
        :label="isMenuOpen ? 'Close navigation' : homeContent.mobileMenuLabel"
      />
    </UiContainer>
    <HomeMobileNavigation v-model="isMenuOpen" :items="homeNavigationItems" />
  </header>
</template>

<style scoped>
.home-header {
  position: absolute;
  z-index: 2;
  inset: 0 0 auto;
  min-block-size: var(--header-height);
  background: var(--color-header-surface);
  backdrop-filter: blur(0.75rem);
}

.home-header__inner {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  min-block-size: var(--header-height);
}

.home-header__brand {
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: var(--font-size-uptitle);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
  text-decoration: none;
}

.home-header__desktop-nav,
.home-header__action {
  display: none;
}

@media (width >= 64rem) {
  .home-header {
    min-block-size: 5rem;
  }

  .home-header__inner {
    grid-template-columns: auto 1fr auto;
    min-block-size: 5rem;
  }

  .home-header__desktop-nav {
    display: block;
    justify-self: center;
  }

  .home-header__desktop-nav ul {
    display: flex;
    gap: 2.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .home-header__desktop-nav a {
    font-size: 0.875rem;
    line-height: var(--line-height-body);
    text-decoration: none;
  }

  .home-header__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: 2.625rem;
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--color-control-border);
    background: var(--color-control-surface);
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: var(--font-weight-heading);
    line-height: var(--line-height-body);
    text-decoration: none;
  }

  .home-header__menu-toggle {
    display: none !important;
  }
}
</style>
