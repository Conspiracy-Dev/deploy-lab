<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean
    type?: 'button' | 'reset' | 'submit'
  }>(),
  {
    disabled: false,
    type: 'button',
  },
)
</script>

<template>
  <button class="ui-button" :disabled="disabled" :type="type">
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 2rem;
  border: 1px solid var(--color-control-border);
  background: var(--color-control-surface);
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: var(--font-size-uptitle);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
  white-space: nowrap;
}

.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ui-button:not(:disabled):hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
