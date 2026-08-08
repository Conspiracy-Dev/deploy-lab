<script setup lang="ts">
import { homeAnchorIds, homeContent, homePhilosophyItems } from './home.config'
</script>

<template>
  <section
    :id="homeAnchorIds.philosophy"
    class="home-philosophy"
    aria-labelledby="philosophy-title"
  >
    <UiContainer>
      <div class="home-philosophy__intro">
        <UiTypography variant="uptitle">{{ homeContent.philosophy.eyebrow }}</UiTypography>
        <UiTypography id="philosophy-title" variant="h2">
          {{ homeContent.philosophy.title }}
        </UiTypography>
        <UiTypography muted variant="body">
          {{ homeContent.philosophy.description }}
        </UiTypography>
      </div>

      <ul class="home-philosophy__list">
        <li v-for="item in homePhilosophyItems" :key="item.artwork" class="home-philosophy__item">
          <div class="home-philosophy__artwork" aria-hidden="true">
            <NuxtImg
              alt=""
              densities="1"
              format="webp"
              height="4096"
              loading="lazy"
              quality="80"
              sizes="540px"
              :src="item.artwork"
              width="4096"
              :class="{ 'home-philosophy__artwork-image--rotated': item.rotate }"
            />
          </div>
          <UiTypography variant="body">{{ item.description }}</UiTypography>
        </li>
      </ul>
    </UiContainer>
  </section>
</template>

<style scoped>
.home-philosophy {
  padding-block: 5rem;
  background: var(--color-control-surface);
}

.home-philosophy__intro {
  display: grid;
  gap: 0.625rem;
  max-inline-size: 41.6875rem;
}

.home-philosophy__list {
  display: grid;
  gap: 1.25rem;
  margin: 2.5rem 0 0;
  padding: 0;
  list-style: none;
}

.home-philosophy__item {
  position: relative;
  display: flex;
  align-items: end;
  min-block-size: 25rem;
  padding: 1.25rem;
  overflow: hidden;
  background: var(--color-surface);
}

.home-philosophy__item .ui-typography {
  position: relative;
  z-index: 1;
  max-inline-size: 18.0625rem;
}

.home-philosophy__artwork {
  position: absolute;
  inline-size: 26.25rem;
  block-size: 26.25rem;
  inset: -7.5rem auto auto 3.125rem;
  pointer-events: none;
}

.home-philosophy__artwork :deep(img) {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: contain;
}

.home-philosophy__artwork-image--rotated {
  transform: rotate(180deg);
}

@media (width >= 64rem) {
  .home-philosophy {
    padding-block: 5.5rem 6.5625rem;
  }

  .home-philosophy__intro {
    gap: 1.25rem;
  }

  .home-philosophy__list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2.5rem;
    margin-top: 4.375rem;
  }

  .home-philosophy__item {
    min-block-size: 31.25rem;
  }

  .home-philosophy__artwork {
    inline-size: 33.75rem;
    block-size: 33.75rem;
    inset: -9.4375rem auto auto 0;
  }
}
</style>
