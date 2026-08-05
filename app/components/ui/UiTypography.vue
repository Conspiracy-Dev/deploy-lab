<script setup lang="ts">
import { computed } from 'vue'

type TypographyElement = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
type TypographyVariant = 'body' | 'h1' | 'h2' | 'h3' | 'h4' | 'uptitle'

const defaultElements: Record<TypographyVariant, TypographyElement> = {
  uptitle: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'p',
}

const props = withDefaults(
  defineProps<{
    as?: TypographyElement
    muted?: boolean
    variant?: TypographyVariant
  }>(),
  {
    as: undefined,
    muted: false,
    variant: 'body',
  },
)

const element = computed(() => props.as ?? defaultElements[props.variant])
</script>

<template>
  <component
    :is="element"
    class="ui-typography"
    :class="[`ui-typography--${variant}`, { 'ui-typography--muted': muted && variant === 'body' }]"
  >
    <slot />
  </component>
</template>

<style scoped>
.ui-typography {
  margin: 0;
}

.ui-typography--uptitle,
.ui-typography--h1,
.ui-typography--h2,
.ui-typography--h3,
.ui-typography--h4 {
  font-family: var(--font-display);
  line-height: var(--line-height-heading);
}

.ui-typography--uptitle {
  color: var(--color-accent);
  font-size: var(--font-size-uptitle);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
}

.ui-typography--h1,
.ui-typography--h2,
.ui-typography--h3 {
  font-weight: var(--font-weight-heading);
  letter-spacing: var(--letter-spacing-heading);
}

.ui-typography--h1 {
  font-size: var(--font-size-h1-mobile);
}

.ui-typography--h2 {
  font-size: var(--font-size-h2-mobile);
}

.ui-typography--h3 {
  font-size: var(--font-size-h3-mobile);
}

.ui-typography--h4 {
  font-size: var(--font-size-h4-mobile);
  font-weight: var(--font-weight-subheading);
  letter-spacing: var(--letter-spacing-heading);
}

.ui-typography--body {
  font-family: var(--font-body);
  font-size: var(--font-size-body-mobile);
  font-weight: var(--font-weight-body);
  line-height: var(--line-height-body);
}

.ui-typography--body.ui-typography--muted {
  color: var(--color-text-muted);
}

@media (width >= 64rem) {
  .ui-typography--h1 {
    font-size: var(--font-size-h1-desktop);
  }

  .ui-typography--h2 {
    font-size: var(--font-size-h2-desktop);
  }

  .ui-typography--h3 {
    font-size: var(--font-size-h3-desktop);
  }

  .ui-typography--h4 {
    font-size: var(--font-size-h4-desktop);
  }

  .ui-typography--body {
    font-size: var(--font-size-body-desktop);
  }
}
</style>
