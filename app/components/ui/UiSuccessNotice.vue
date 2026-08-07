<script setup lang="ts">
import successIcon from '~/assets/icons/ui/success-multiple-filled.svg'

defineProps<{
  description: string
  title: string
}>()
</script>

<template>
  <section class="ui-success-notice" role="status">
    <img :src="successIcon" alt="" aria-hidden="true" />
    <div class="ui-success-notice__content">
      <UiTypography as="p" variant="h3">{{ title }}</UiTypography>
      <UiTypography as="p" variant="body">{{ description }}</UiTypography>
    </div>
  </section>
</template>

<style scoped>
.ui-success-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  padding: 3.75rem;
  background: var(--color-canvas);
  color: var(--color-text);
  text-align: center;
}

.ui-success-notice > img {
  inline-size: 8rem;
  block-size: 8rem;
}

.ui-success-notice__content {
  display: flex;
  flex-direction: column;
  inline-size: min(100%, 31.625rem);
  gap: 1.25rem;
}
</style>
