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

    <div class="case-card__image" :style="{ '--case-card-image-position': image.focalPosition }">
      <img v-if="image.src" :alt="image.alt" :src="image.src" />
      <div
        v-else
        class="case-card__placeholder"
        aria-hidden="true"
        data-testid="case-card-placeholder"
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

.case-card__image > img,
.case-card__placeholder {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: var(--case-card-image-position, center);
}

.case-card__placeholder {
  background:
    linear-gradient(135deg, transparent 48%, rgb(255 255 255 / 18%) 48% 52%, transparent 52%),
    linear-gradient(45deg, transparent 48%, rgb(255 255 255 / 10%) 48% 52%, transparent 52%),
    rgb(0 0 0 / 20%);
  background-size: 2rem 2rem;
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
}
</style>
