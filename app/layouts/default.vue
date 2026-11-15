<script setup lang="ts">
import { ref } from 'vue'

const cookieNoticeHeight = ref(0)
</script>

<template>
  <div class="app-shell" :style="{ '--cookie-notice-size': `${cookieNoticeHeight}px` }">
    <SiteCookieNotice @measure="cookieNoticeHeight = $event" />
    <slot />
  </div>
</template>

<style scoped>
.app-shell {
  --cookie-notice-bottom: calc(var(--space-shell-mobile) + env(safe-area-inset-bottom));

  min-height: 100dvh;
  overflow: clip;
}

/* Keep the footer reachable beyond the footprint of a fixed notice. */
.app-shell:has(> .site-cookie-notice) {
  padding-block-end: calc(var(--cookie-notice-size) + var(--cookie-notice-bottom));
}

@media (width < 64rem) {
  .app-shell:has(> .site-cookie-notice--home) {
    padding-block-end: 0;
  }
}

@media (width >= 64rem) {
  .app-shell {
    --cookie-notice-bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
  }
}
</style>
