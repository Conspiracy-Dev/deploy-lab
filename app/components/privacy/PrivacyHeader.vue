<script setup lang="ts">
import { ref } from 'vue'
import { homeNavigationItems } from '~/components/home/home.config'
import { siteContent, type SiteNavigationItem } from '~/components/site/site.config'

const isMenuOpen = ref(false)

const privacyNavigationItems = Object.freeze(
  homeNavigationItems.map((item): SiteNavigationItem => ({
    href: item.href === '#home' ? '/' : `/${item.href}`,
    label: item.label,
  })),
)
</script>

<template>
  <header class="privacy-header">
    <UiContainer class="privacy-header__inner">
      <a class="privacy-header__brand" href="/" aria-label="Deploy Lab home">
        {{ siteContent.brand }}
      </a>

      <UiMenuToggle
        v-model="isMenuOpen"
        class="privacy-header__menu-toggle"
        :label="isMenuOpen ? 'Close navigation' : siteContent.mobileMenuLabel"
      />
    </UiContainer>
    <SiteMobileNavigation v-model="isMenuOpen" :items="privacyNavigationItems" />
  </header>
</template>

<style scoped>
/* Privacy Policy headers: Figma 153:52 and 153:123. */
.privacy-header,
.privacy-header__inner {
  min-block-size: 5rem;
}

.privacy-header {
  position: relative;
  z-index: 1;
  --site-mobile-header-height: 5rem;

  background: var(--color-header-surface);
  backdrop-filter: blur(0.75rem);
}

.privacy-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.privacy-header__brand {
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: var(--font-size-uptitle);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
  text-decoration: none;
}

@media (width >= 64rem) {
  .privacy-header__menu-toggle {
    display: none !important;
  }
}
</style>
