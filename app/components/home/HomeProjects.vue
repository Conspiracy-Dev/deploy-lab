<script setup lang="ts">
import CaseCard from '~/components/product/cases/CaseCard.vue'
import { caseCardFixtures } from '~/components/product/cases/case-card.config'
import { homeAnchorIds, homeContent } from './home.config'
</script>

<template>
  <section :id="homeAnchorIds.projects" class="home-projects" aria-labelledby="projects-title">
    <UiContainer>
      <div class="home-projects__intro">
        <UiTypography variant="uptitle">{{ homeContent.projects.eyebrow }}</UiTypography>
        <UiTypography id="projects-title" variant="h2">{{
          homeContent.projects.title
        }}</UiTypography>
        <UiTypography muted variant="body">{{ homeContent.projects.description }}</UiTypography>
      </div>
    </UiContainer>

    <ul class="home-projects__list" aria-label="Selected projects" tabindex="0">
      <li v-for="caseCard in caseCardFixtures" :key="caseCard.title">
        <CaseCard v-bind="caseCard" />
      </li>
    </ul>

    <UiContainer>
      <div class="home-projects__pagination" aria-hidden="true">
        <span class="home-projects__pagination-dot home-projects__pagination-dot--active"></span>
        <span class="home-projects__pagination-dot"></span>
        <span class="home-projects__pagination-dot"></span>
      </div>
    </UiContainer>
  </section>
</template>

<style scoped>
.home-projects {
  padding-block: 5rem;
  overflow: hidden;
  background: var(--color-control-surface);
}

.home-projects__intro {
  display: grid;
  gap: 0.625rem;
  max-inline-size: 41.6875rem;
}

.home-projects__list {
  display: flex;
  gap: 0.5rem;
  margin: 2.5rem 0 0;
  padding: 0 var(--layout-gutter);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-padding-inline: var(--layout-gutter);
  scroll-snap-type: inline mandatory;
  scrollbar-width: none;
  list-style: none;
}

.home-projects__list::-webkit-scrollbar {
  display: none;
}

.home-projects__list:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.home-projects__list > li {
  flex: 0 0 min(21.875rem, calc(100vw - 2.5rem));
  scroll-snap-align: start;
}

.home-projects__pagination {
  display: flex;
  gap: 0.375rem;
  margin-top: 1.25rem;
}

.home-projects__pagination-dot {
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: 50%;
  background: rgb(255 255 255 / 40%);
}

.home-projects__pagination-dot--active {
  background: var(--color-text);
}

@media (width >= 64rem) {
  .home-projects {
    padding-block: 5rem;
  }

  .home-projects__intro {
    margin-inline: var(--layout-gutter);
  }

  .home-projects__list {
    gap: 1.25rem;
    margin-top: 3rem;
  }

  .home-projects__list > li {
    flex-basis: 51.25rem;
  }

  .home-projects__pagination {
    margin-inline: var(--layout-gutter);
  }
}
</style>
