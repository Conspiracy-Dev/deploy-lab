<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    disabled?: boolean
    modelValue?: string
    multiline?: boolean
    rows?: number
  }>(),
  {
    disabled: false,
    modelValue: '',
    multiline: false,
    rows: 4,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement | HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    v-if="multiline"
    v-bind="$attrs"
    class="ui-input"
    :disabled="disabled"
    :rows="rows"
    :value="modelValue"
    @input="updateValue"
  >
  </textarea>
  <input
    v-else
    v-bind="$attrs"
    class="ui-input"
    :disabled="disabled"
    :value="modelValue"
    @input="updateValue"
  />
</template>

<style scoped>
.ui-input {
  display: block;
  width: 100%;
  max-width: 35.625rem;
  padding: 1rem 1.25rem;
  border: 0;
  border-bottom: 1px solid var(--color-control-border);
  border-radius: 0;
  background: rgb(0 0 0 / 20%);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--font-size-body-desktop);
  font-weight: var(--font-weight-body);
  line-height: var(--line-height-body);
}

.ui-input::placeholder {
  color: var(--color-text);
  opacity: 0.5;
}

.ui-input:focus {
  background: rgb(255 255 255 / 20%);
}

.ui-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

textarea.ui-input {
  min-height: calc(var(--font-size-body-desktop) + 2rem);
  resize: vertical;
}

@media (width < 64rem) {
  .ui-input {
    font-size: var(--font-size-body-mobile);
  }
}
</style>
