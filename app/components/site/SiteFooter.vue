<script setup lang="ts">
import { siteContent } from './site.config'
</script>

<template>
  <footer class="site-footer">
    <UiContainer class="site-footer__inner">
      <p class="site-footer__brand">{{ siteContent.brand }}</p>
      <div class="site-footer__meta">
        <a :href="siteContent.privacyHref">Privacy Policy</a>
        <p>{{ siteContent.footerYear }}</p>
      </div>
    </UiContainer>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--color-subtle-border);
  background: var(--color-footer-surface);
}

.site-footer__inner {
  display: grid;
  gap: 0.625rem;
  min-block-size: 8.25rem;
  padding-block: 2.5rem;
}

.site-footer__brand {
  margin: 0;
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: var(--font-size-uptitle);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
}

.site-footer__meta {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: var(--font-size-body-mobile);
  line-height: var(--line-height-body);
}

.site-footer__meta p {
  margin: 0;
}

@media (width >= 64rem) {
  .site-footer__inner {
    grid-template-columns: 1fr auto auto;
    align-items: center;
    min-block-size: 6.6875rem;
    padding-block: 0;
  }

  .site-footer__meta {
    display: contents;
    font-size: var(--font-size-body-mobile);
  }
}
</style>
