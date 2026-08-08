<script setup lang="ts">
import { homeAnchorIds, homeContent, homeServiceItems } from './home.config'
</script>

<template>
  <section :id="homeAnchorIds.services" class="home-services" aria-labelledby="services-title">
    <div class="home-services__visual" aria-hidden="true">
      <NuxtImg
        alt=""
        densities="1"
        format="webp"
        height="1253"
        loading="lazy"
        quality="80"
        sizes="1536px"
        src="/images/home/services-wireframe.png"
        width="1348"
      />
    </div>
    <UiContainer class="home-services__content">
      <div class="home-services__intro">
        <UiTypography variant="uptitle">{{ homeContent.services.eyebrow }}</UiTypography>
        <UiTypography id="services-title" variant="h2">{{
          homeContent.services.title
        }}</UiTypography>
        <UiTypography muted variant="body">{{ homeContent.services.description }}</UiTypography>
      </div>

      <ul class="home-services__list">
        <li v-for="item in homeServiceItems" :key="item.title" class="home-services__item">
          <div class="home-services__item-heading">
            <img :src="item.icon" alt="" width="48" height="48" />
            <UiTypography as="h3" variant="h4">{{ item.title }}</UiTypography>
          </div>
          <UiTypography variant="body">{{ item.description }}</UiTypography>
        </li>
      </ul>
    </UiContainer>
  </section>
</template>

<style scoped>
.home-services {
  position: relative;
  padding-block: 5rem;
  overflow: hidden;
  background: var(--color-control-surface);
}

.home-services__visual {
  position: absolute;
  z-index: 0;
  inline-size: 95rem;
  max-inline-size: none;
  inset: 19rem auto auto -55rem;
  pointer-events: none;
}

.home-services__visual :deep(img) {
  display: block;
  inline-size: 100%;
  block-size: auto;
  opacity: 0.95;
}

.home-services__content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 2.5rem;
}

.home-services__intro {
  display: grid;
  gap: 0.625rem;
  max-inline-size: 25rem;
}

.home-services__list {
  margin: 0;
  padding: 0;
  border-block: 0.25rem solid var(--color-service-divider);
  list-style: none;
}

.home-services__item {
  display: grid;
  gap: 1.25rem;
  min-block-size: 12.5rem;
  padding: 2.5rem 1.25rem;
  border-bottom: 0.25rem solid var(--color-service-divider);
  background: var(--color-service-surface);
  backdrop-filter: blur(0.75rem);
}

.home-services__item:last-child {
  border-bottom: 0;
}

.home-services__item-heading {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.home-services__item-heading img {
  flex: 0 0 auto;
}

@media (width >= 64rem) {
  .home-services {
    padding-block: 5.5rem 10.5rem;
  }

  .home-services__visual {
    inline-size: 96rem;
    inset: 47rem auto auto calc(50% - 46.5rem);
  }

  .home-services__content {
    grid-template-columns: 25rem minmax(0, 1fr);
    gap: 9.375rem;
  }

  .home-services__intro {
    gap: 1.25rem;
  }

  .home-services__item {
    padding: 2.5rem;
  }
}
</style>
