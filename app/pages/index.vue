<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { normalizeSiteUrl } from '#shared/utils/site-url'

const HeroWireframe = defineAsyncComponent(() => import('~/components/scenes/HeroWireframe.vue'))

const runtimeConfig = useRuntimeConfig()
const siteUrl = normalizeSiteUrl(runtimeConfig.public.siteUrl)

useSeoMeta({
  title: 'DeployLab — full-cycle web and mobile development',
  description:
    'DeployLab builds thoughtful web and mobile products with clear engineering foundations.',
  ogTitle: 'DeployLab — full-cycle web and mobile development',
  ogDescription:
    'DeployLab builds thoughtful web and mobile products with clear engineering foundations.',
  ogType: 'website',
})

useSchemaOrg([
  defineOrganization({
    name: 'DeployLab',
    ...(siteUrl ? { url: siteUrl } : {}),
  }),
])
</script>

<template>
  <UiContainer as="main">
    <section class="hero">
      <div class="hero__copy">
        <UiTypography variant="uptitle" class="hero__brand">DeployLab</UiTypography>
        <UiTypography variant="h1" class="hero__title">
          Full-cycle web and mobile development.
        </UiTypography>
        <UiTypography variant="body" muted class="hero__description">
          The technical foundation is ready for a distinctive, accessible, and fast product site.
        </UiTypography>
      </div>
      <div class="hero__scene" data-testid="hero-scene">
        <svg class="hero__fallback" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
          <path d="M34 220C84 28 276 60 342 155S287 374 135 339 10 278 34 220Z" />
          <path d="M58 224C103 64 260 80 317 163S267 344 141 316 36 276 58 224Z" />
          <path d="M83 226C122 95 243 104 294 170S250 315 145 291 64 274 83 226Z" />
          <path d="M109 228C143 125 226 129 271 177S233 286 149 267 92 271 109 228Z" />
        </svg>
        <ClientOnly>
          <HeroWireframe />
        </ClientOnly>
      </div>
    </section>
  </UiContainer>
</template>

<style scoped>
.hero {
  display: grid;
  align-items: center;
  min-height: 100dvh;
  gap: var(--space-8);
  padding-block: var(--space-16);
}

.hero__copy {
  position: relative;
  z-index: 1;
  max-width: 42rem;
}

.hero__brand {
  margin: 0 0 var(--space-8);
}

.hero__title {
  margin: 0;
  text-wrap: balance;
}

.hero__description {
  max-width: 36rem;
  margin: var(--space-8) 0 0;
}

.hero__scene {
  position: relative;
  isolation: isolate;
  min-height: min(52vw, 36rem);
}

.hero__fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: var(--color-wireframe);
  stroke-width: 1.35;
}

@media (prefers-reduced-motion: reduce) {
  .hero__fallback {
    opacity: 0.75;
  }
}

@media (width >= 64rem) {
  .hero {
    grid-template-columns: minmax(0, 0.9fr) minmax(28rem, 1.1fr);
  }

  .hero__scene {
    min-height: min(54vw, 42rem);
  }
}
</style>
