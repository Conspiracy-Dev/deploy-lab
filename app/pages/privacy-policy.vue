<script setup lang="ts">
const { data: policy } = await useAsyncData('privacy-policy', () =>
  queryCollection('legal').path('/privacy-policy').first(),
)

if (!policy.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Privacy Policy not found',
  })
}

const policyDocument = policy.value

useSeoMeta({
  title: 'Privacy Policy',
  description: policyDocument.description,
  ogTitle: 'Privacy Policy | DeployLab',
  ogDescription: policyDocument.description,
  ogType: 'website',
})
</script>

<template>
  <div class="privacy-policy-page">
    <PrivacyHeader />
    <main>
      <section class="privacy-policy-page__title" aria-labelledby="privacy-policy-title">
        <UiContainer>
          <UiTypography id="privacy-policy-title" variant="h1">
            {{ policyDocument.title }}
          </UiTypography>
        </UiContainer>
      </section>

      <section class="privacy-policy-page__content" aria-label="Privacy Policy content">
        <UiContainer>
          <article class="privacy-policy-page__article">
            <p class="privacy-policy-page__updated">
              <strong>Last updated: {{ policyDocument.lastUpdated }}</strong>
            </p>
            <ContentRenderer :value="policyDocument" />
          </article>
        </UiContainer>
      </section>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.privacy-policy-page {
  min-block-size: 100dvh;
  background: var(--color-canvas);
}

/* Figma 153:52 (desktop) and 153:123 (mobile); real copy determines page height. */
.privacy-policy-page__title {
  padding-block: 2.5rem;
}

.privacy-policy-page__content {
  padding-block: 5rem;
  background: var(--color-black);
}

.privacy-policy-page__article {
  max-inline-size: 52.5rem;
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: var(--font-size-body-mobile);
  line-height: normal;
}

.privacy-policy-page__updated {
  margin: 0 0 2.5rem;
  color: var(--color-text);
}

.privacy-policy-page__article :deep(p) {
  margin: 0;
}

.privacy-policy-page__article :deep(p + p) {
  margin-top: var(--space-4);
}

.privacy-policy-page__article :deep(h2),
.privacy-policy-page__article :deep(h3) {
  margin: 2.5rem 0 1.25rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-weight: var(--font-weight-heading);
  letter-spacing: var(--letter-spacing-heading);
  line-height: var(--line-height-heading);
}

.privacy-policy-page__article :deep(h2) {
  font-size: var(--font-size-h2-mobile);
}

.privacy-policy-page__article :deep(h3) {
  font-size: var(--font-size-h3-mobile);
}

.privacy-policy-page__article :deep(ul) {
  display: grid;
  gap: var(--space-2);
  margin: var(--space-4) 0;
  padding-inline-start: 1.25rem;
}

.privacy-policy-page__article :deep(a) {
  overflow-wrap: anywhere;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.15em;
}

.privacy-policy-page__article :deep(:is(h2, h3) a) {
  text-decoration: none;
}

.privacy-policy-page__article :deep(strong) {
  color: var(--color-text);
  font-weight: var(--font-weight-heading);
}

@media (width >= 64rem) {
  .privacy-policy-page__title {
    padding-block: 3.75rem;
  }

  .privacy-policy-page__article {
    font-size: var(--font-size-body-desktop);
  }

  .privacy-policy-page__article :deep(h2) {
    font-size: var(--font-size-h2-desktop);
  }

  .privacy-policy-page__article :deep(h3) {
    font-size: var(--font-size-h3-desktop);
  }
}
</style>
