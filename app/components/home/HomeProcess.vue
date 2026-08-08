<script setup lang="ts">
import { homeAnchorIds, homeContent, homeProcessItems } from './home.config'
</script>

<template>
  <section :id="homeAnchorIds.process" class="home-process" aria-labelledby="process-title">
    <UiContainer>
      <div class="home-process__intro">
        <UiTypography variant="uptitle">{{ homeContent.process.eyebrow }}</UiTypography>
        <UiTypography id="process-title" variant="h2">{{ homeContent.process.title }}</UiTypography>
        <UiTypography muted variant="body">{{ homeContent.process.description }}</UiTypography>
      </div>

      <div class="home-process__diagram">
        <picture class="home-process__grid" aria-hidden="true">
          <source media="(width >= 64rem)" srcset="/images/home/process-grid-desktop.svg" />
          <img alt="" height="500" src="/images/home/process-grid-mobile.svg" width="344" />
        </picture>
        <picture class="home-process__line" aria-hidden="true">
          <source media="(width >= 64rem)" srcset="/images/home/process-line-desktop.svg" />
          <img alt="" height="5" src="/images/home/process-line-mobile.svg" width="347" />
        </picture>
        <ol class="home-process__list">
          <li
            v-for="(item, index) in homeProcessItems"
            :key="item.title"
            :class="`home-process__item--${item.tone}`"
          >
            <UiTypography as="h3" variant="body">{{ index + 1 }}.{{ item.title }}</UiTypography>
          </li>
        </ol>
      </div>
    </UiContainer>
  </section>
</template>

<style scoped>
.home-process {
  padding-block: 5rem;
  overflow: hidden;
  background: var(--color-control-surface);
}

.home-process__intro {
  display: grid;
  gap: 0.625rem;
  max-inline-size: 41.6875rem;
}

.home-process__diagram {
  position: relative;
  block-size: 34.125rem;
  margin-top: 2.5rem;
}

.home-process__grid,
.home-process__line {
  position: absolute;
  pointer-events: none;
}

.home-process__grid {
  inset: 0 auto auto 50%;
  inline-size: 21.5rem;
  transform: translateX(-50%);
}

.home-process__grid img,
.home-process__line img {
  display: block;
  inline-size: 100%;
  block-size: auto;
}

.home-process__line {
  inset: 0 auto auto 0;
  inline-size: min(100%, 21.6875rem);
}

.home-process__list {
  position: absolute;
  inset: 3.875rem auto auto 0;
  display: grid;
  gap: 1rem;
  inline-size: min(18.5rem, 100%);
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-process__list > li {
  inline-size: fit-content;
  padding: 0.625rem 1.25rem;
  border: 1px solid var(--color-subtle-border);
}

.home-process__list .ui-typography {
  font-family: var(--font-display);
  font-weight: var(--font-weight-subheading);
  letter-spacing: var(--letter-spacing-heading);
}

.home-process__item--start {
  background: var(--color-process-start);
}

.home-process__item--middle {
  background: var(--color-process-middle);
}

.home-process__item--end {
  background: var(--color-process-end);
}

.home-process__list > li:nth-child(5) {
  inline-size: 100%;
}

@media (width >= 64rem) {
  .home-process__diagram {
    block-size: 34.125rem;
    margin-top: 3rem;
  }

  .home-process__grid {
    inset-inline-start: 0;
    inline-size: 80rem;
    transform: none;
  }

  .home-process__line {
    inline-size: 80.1875rem;
  }

  .home-process__list {
    inset-block-start: 2.5rem;
    display: block;
    inline-size: 100%;
  }

  .home-process__list > li {
    position: absolute;
    padding: 0.75rem 1.5rem;
  }

  .home-process__list > li:nth-child(1) {
    inset: 0 auto auto 1.625rem;
  }

  .home-process__list > li:nth-child(2) {
    inset: 4.375rem auto auto 7.125rem;
  }

  .home-process__list > li:nth-child(3) {
    inset: 8.75rem auto auto 16.8125rem;
  }

  .home-process__list > li:nth-child(4) {
    inset: 13.125rem auto auto 22.3125rem;
  }

  .home-process__list > li:nth-child(5) {
    inset: 17.5rem auto auto 29.9375rem;
    inline-size: fit-content;
  }

  .home-process__list > li:nth-child(6) {
    inset: 21.875rem auto auto 49.4375rem;
  }

  .home-process__list > li:nth-child(7) {
    inset: 26.25rem auto auto 57.75rem;
  }
}
</style>
