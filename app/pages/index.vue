<script setup lang="ts">
import { normalizeSiteUrl } from '#shared/utils/site-url'
import { homeAnchorIds, homeContent } from '~/components/home/home.config'

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
  <div class="home-page">
    <HomeHeader />
    <main>
      <section :id="homeAnchorIds.home" class="home-hero" aria-labelledby="home-title">
        <HomeHeroVisual />
        <UiContainer class="home-hero__content">
          <div class="home-hero__copy">
            <UiTypography id="home-title" variant="h1">
              {{ homeContent.hero.title }}
            </UiTypography>
            <UiTypography muted variant="body" class="home-hero__description">
              {{ homeContent.hero.description }}
            </UiTypography>
            <a class="home-hero__action" :href="`#${homeAnchorIds.contact}`">
              {{ homeContent.hero.actionLabel }}
            </a>
          </div>
        </UiContainer>
      </section>
    </main>
    <HomeFooter />
  </div>
</template>

<style scoped>
.home-page {
  min-block-size: 100dvh;
  background: var(--color-canvas);
}

.home-hero {
  position: relative;
  isolation: isolate;
  display: grid;
  align-items: center;
  min-block-size: 52.75rem;
  overflow: hidden;
}

.home-hero__content {
  position: relative;
  z-index: 1;
}

.home-hero__copy {
  display: grid;
  gap: 1.25rem;
  max-inline-size: 46.375rem;
}

.home-hero__description {
  max-inline-size: 30rem;
}

.home-hero__action {
  justify-self: start;
  margin-top: 2.5rem;
  padding: 0.75rem 2rem;
  border: 1px solid var(--color-control-border);
  background: var(--color-control-surface);
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: var(--font-size-body-mobile);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
  text-decoration: none;
}

@media (width >= 64rem) {
  .home-hero {
    min-block-size: 50rem;
  }

  .home-hero__copy {
    gap: 1.25rem;
  }

  .home-hero__action {
    margin-top: 1.25rem;
  }
}
</style>
