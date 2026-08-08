<script setup lang="ts">
import closeIcon from '~/assets/icons/ui/menu-close.svg'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    label: string
    modelValue?: boolean
  }>(),
  {
    disabled: false,
    modelValue: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    class="ui-menu-toggle"
    :aria-label="label"
    :aria-pressed="modelValue"
    :disabled="disabled"
    type="button"
    @click="toggle"
  >
    <img v-if="modelValue" :src="closeIcon" alt="" aria-hidden="true" />
    <span v-else class="ui-menu-toggle__burger" aria-hidden="true">
      <span />
      <span />
    </span>
  </button>
</template>

<style scoped>
.ui-menu-toggle {
  display: inline-grid;
  place-items: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
}

.ui-menu-toggle img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

.ui-menu-toggle__burger {
  display: grid;
  gap: 0.375rem;
  inline-size: 1.5rem;
}

.ui-menu-toggle__burger span {
  block-size: 0.1875rem;
  background: currentcolor;
}

.ui-menu-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ui-menu-toggle:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
