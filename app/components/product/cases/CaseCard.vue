<script setup lang="ts">
import externalArrow from '~/assets/icons/cases/external-arrow.svg'
import type { CaseCardData } from './case-card.config'

defineProps<CaseCardData>()
</script>

<template>
  <article class="case-card">
    <div class="case-card__content">
      <div class="case-card__copy">
        <UiTypography as="h3" variant="h3">{{ title }}</UiTypography>
        <UiTypography as="p" class="case-card__description" variant="body">
          {{ description }}
        </UiTypography>
        <ul class="case-card__tags" aria-label="Services provided">
          <li v-for="tag in tags" :key="tag">{{ tag }}</li>
        </ul>
      </div>

      <a
        class="case-card__destination"
        :href="destination.href"
        :rel="destination.external ? 'noopener noreferrer' : undefined"
        :target="destination.external ? '_blank' : undefined"
      >
        {{ destination.label }}
        <img :src="externalArrow" alt="" aria-hidden="true" />
      </a>
    </div>

    <div class="case-card__image">
      <NuxtImg
        :alt="image.alt"
        decoding="async"
        densities="1"
        format="webp"
        :height="image.height"
        loading="lazy"
        quality="70"
        sizes="(min-width: 1024px) 482px, 310px"
        :src="image.src"
        :style="{
          '--case-card-desktop-image-height': image.desktopCrop?.height,
          '--case-card-desktop-image-left': image.desktopCrop?.left,
          '--case-card-desktop-image-top': image.desktopCrop?.top,
          '--case-card-desktop-image-width': image.desktopCrop?.width,
          '--case-card-mobile-image-height': image.mobileCrop?.height,
          '--case-card-mobile-image-left': image.mobileCrop?.left,
          '--case-card-mobile-image-top': image.mobileCrop?.top,
          '--case-card-mobile-image-width': image.mobileCrop?.width,
        }"
        :width="image.width"
      />
    </div>
  </article>
</template>

<style scoped>
.case-card {
  display: grid;
  inline-size: min(100%, 51.25rem);
  min-block-size: 27.5rem;
  overflow: clip;
  background: var(--color-canvas);
  color: var(--color-text);
}

.case-card__content {
  display: grid;
  gap: 1.25rem;
}

.case-card__copy {
  display: grid;
  gap: 1.25rem;
}

.case-card__description {
  opacity: 0.8;
}

.case-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.case-card__tags li {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-text);
  border-radius: 3.75rem;
  font-family: var(--font-case-meta);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: normal;
  white-space: nowrap;
}

.case-card__destination {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  inline-size: fit-content;
  color: inherit;
  font-family: var(--font-case-meta);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.125rem;
  text-decoration: underline;
  text-underline-position: from-font;
}

.case-card__destination img {
  inline-size: 1.25rem;
  block-size: 1.25rem;
}

.case-card__image {
  position: relative;
  aspect-ratio: 679 / 507;
  overflow: hidden;
}

.case-card__image > img {
  position: absolute;
  inset-block-start: var(--case-card-mobile-image-top, 0);
  inset-inline-start: var(--case-card-mobile-image-left, 0);
  display: block;
  inline-size: var(--case-card-mobile-image-width, 100%);
  block-size: var(--case-card-mobile-image-height, 100%);
  max-inline-size: none;
}

@media (width < 64rem) {
  .case-card {
    gap: 2.5rem;
    padding: 2.5rem 1.25rem 0;
  }
}

@media (width >= 64rem) {
  .case-card {
    position: relative;
    block-size: 27.5rem;
  }

  .case-card__content {
    position: absolute;
    inset: 0;
  }

  .case-card__copy {
    position: absolute;
    inset-block-start: 2.5rem;
    inset-inline-start: 2.5rem;
    inline-size: 21.125rem;
  }

  .case-card__description {
    opacity: 0.7;
  }

  .case-card__destination {
    position: absolute;
    inset-block-end: 2.5rem;
    inset-inline-start: 2.5rem;
  }

  .case-card__image {
    position: absolute;
    inset-block-start: 2.5rem;
    inset-inline-start: 26.75rem;
    inline-size: 30.125rem;
    block-size: 22.5rem;
    aspect-ratio: auto;
  }

  .case-card__image > img {
    inset-block-start: var(--case-card-desktop-image-top, 0);
    inset-inline-start: var(--case-card-desktop-image-left, 0);
    inline-size: var(--case-card-desktop-image-width, 100%);
    block-size: var(--case-card-desktop-image-height, 100%);
  }
}
</style>
