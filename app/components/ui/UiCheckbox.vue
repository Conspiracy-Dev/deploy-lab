<script setup lang="ts">
import checkedIcon from '~/assets/icons/ui/checkbox-checked.svg'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    disabled?: boolean
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

const checkedBackgroundImage = `url("${checkedIcon}")`

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <input
    v-bind="$attrs"
    class="ui-checkbox"
    :checked="modelValue"
    :disabled="disabled"
    :style="{ backgroundImage: modelValue ? checkedBackgroundImage : undefined }"
    type="checkbox"
    @change="updateValue"
  />
</template>

<style scoped>
.ui-checkbox {
  display: inline-block;
  inline-size: 1.25rem;
  block-size: 1.25rem;
  margin: 0;
  border: 0;
  border-bottom: 1px solid var(--color-control-border);
  border-radius: 0;
  appearance: none;
  background: var(--color-checkbox-surface);
}

.ui-checkbox:checked {
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.ui-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
