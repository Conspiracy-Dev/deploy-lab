<script setup lang="ts">
type ContainerElement = 'article' | 'div' | 'main' | 'section'

withDefaults(
  defineProps<{
    as?: ContainerElement
  }>(),
  {
    as: 'div',
  },
)
</script>

<template>
  <component :is="as" class="ui-container">
    <slot />
  </component>
</template>

<style scoped>
.ui-container {
  width: min(100% - (2 * var(--layout-gutter)), var(--content-width));
  margin-inline: auto;
}
</style>
