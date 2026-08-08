<script setup lang="ts">
import { homeAnchorIds, homeContent, homeFeedbackItems } from './home.config'
</script>

<template>
  <section :id="homeAnchorIds.feedback" class="home-feedback" aria-labelledby="feedback-title">
    <img
      alt=""
      aria-hidden="true"
      class="home-feedback__wireframe"
      height="797"
      src="/images/home/feedback-wireframe.svg"
      width="1039"
    />

    <UiContainer class="home-feedback__content">
      <div class="home-feedback__intro">
        <UiTypography variant="uptitle">{{ homeContent.feedback.eyebrow }}</UiTypography>
        <UiTypography id="feedback-title" variant="h2"> Client<br />Feedback </UiTypography>
      </div>
    </UiContainer>

    <ul class="home-feedback__list" aria-label="Client feedback" tabindex="0">
      <li v-for="item in homeFeedbackItems" :key="item.author">
        <article class="home-feedback__card">
          <blockquote>{{ item.quote }}</blockquote>
          <p>{{ item.author }}</p>
        </article>
      </li>
    </ul>

    <UiContainer class="home-feedback__pagination-container">
      <div class="home-feedback__pagination" aria-hidden="true">
        <span class="home-feedback__pagination-dot home-feedback__pagination-dot--active" />
        <span class="home-feedback__pagination-dot" />
        <span class="home-feedback__pagination-dot" />
      </div>
    </UiContainer>
  </section>
</template>

<style scoped>
.home-feedback {
  position: relative;
  isolation: isolate;
  padding-block: 5rem;
  overflow: hidden;
  background: var(--color-control-surface);
}

.home-feedback__wireframe {
  position: absolute;
  z-index: -1;
  inset: -9.9375rem auto auto 2.9375rem;
  inline-size: 64.9063rem;
  max-inline-size: none;
  pointer-events: none;
}

.home-feedback__intro {
  display: grid;
  gap: 0.625rem;
}

.home-feedback__list {
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

.home-feedback__list::-webkit-scrollbar {
  display: none;
}

.home-feedback__list:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.home-feedback__list > li {
  flex: 0 0 min(21.875rem, calc(100vw - 2.5rem));
  scroll-snap-align: start;
}

.home-feedback__card {
  display: grid;
  align-content: start;
  gap: 1.25rem;
  min-block-size: 15.4375rem;
  padding: 2.5rem 1.25rem;
  border-bottom: 4px solid var(--color-service-divider);
  background: var(--color-service-surface);
  backdrop-filter: blur(0.75rem);
}

.home-feedback__card blockquote,
.home-feedback__card p {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--font-size-body-mobile);
  font-weight: var(--font-weight-body);
  line-height: var(--line-height-body);
}

.home-feedback__card blockquote {
  color: var(--color-text-muted);
}

.home-feedback__card p {
  color: rgb(255 255 255 / 50%);
}

.home-feedback__pagination-container {
  margin-top: 1.25rem;
}

.home-feedback__pagination {
  display: flex;
  gap: 0.3125rem;
}

.home-feedback__pagination-dot {
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: 50%;
  background: rgb(255 255 255 / 40%);
}

.home-feedback__pagination-dot--active {
  background: var(--color-text);
}

@media (width >= 64rem) {
  .home-feedback {
    min-block-size: 47.75rem;
    padding-block: 7.9375rem 9.125rem;
  }

  .home-feedback__wireframe {
    inset: -5.125rem auto auto calc(50% - 12.875rem);
  }

  .home-feedback__intro {
    margin-inline: var(--layout-gutter);
  }

  .home-feedback__list {
    gap: 1.25rem;
    margin-top: 2.6875rem;
    padding-inline-start: max(4.25rem, var(--layout-gutter));
  }

  .home-feedback__list > li {
    flex-basis: 28.625rem;
  }

  .home-feedback__card {
    min-block-size: 14.0625rem;
    padding: 2.5rem;
  }

  .home-feedback__list > li:first-child .home-feedback__card {
    min-block-size: 17.3125rem;
  }

  .home-feedback__list > li:last-child .home-feedback__card {
    min-block-size: 15.6875rem;
  }

  .home-feedback__card blockquote {
    font-size: var(--font-size-body-desktop);
  }

  .home-feedback__pagination-container {
    margin-top: 1rem;
    margin-inline: max(4.375rem, var(--layout-gutter));
  }
}
</style>
