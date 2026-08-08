<script setup lang="ts">
import { homeContent } from './home.config'
</script>

<template>
  <footer class="home-footer">
    <UiContainer class="home-footer__inner">
      <p class="home-footer__brand">{{ homeContent.brand }}</p>
      <div class="home-footer__meta">
        <a :href="homeContent.privacyHref">Privacy Policy</a>
        <p>{{ homeContent.footerYear }}</p>
      </div>
    </UiContainer>
  </footer>
</template>

<style scoped>
.home-footer {
  border-top: 1px solid var(--color-subtle-border);
  background: var(--color-footer-surface);
}

.home-footer__inner {
  display: grid;
  gap: 0.625rem;
  padding-block: 2.5rem;
}

.home-footer__brand {
  margin: 0;
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: var(--font-size-uptitle);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
}

.home-footer__meta {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: var(--font-size-body-mobile);
  line-height: var(--line-height-body);
}

.home-footer__meta p {
  margin: 0;
}

@media (width >= 64rem) {
  .home-footer__inner {
    grid-template-columns: 1fr auto auto;
    align-items: center;
    min-block-size: 6.6875rem;
    padding-block: 0;
  }

  .home-footer__meta {
    display: contents;
    font-size: var(--font-size-body-mobile);
  }
}
</style>
