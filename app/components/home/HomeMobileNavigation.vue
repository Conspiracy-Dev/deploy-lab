<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { HomeNavigationItem } from './home.config'

const props = defineProps<{
  items: readonly HomeNavigationItem[]
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const opener = ref<HTMLElement | null>(null)

function closeMenu() {
  emit('update:modelValue', false)
}

function restoreFocus() {
  opener.value?.focus()
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    await nextTick()

    if (!dialog.value) {
      return
    }

    if (isOpen && !dialog.value.open) {
      opener.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.value.showModal()
    }

    if (!isOpen && dialog.value.open) {
      dialog.value.close()
    }
  },
)
</script>

<template>
  <dialog
    ref="dialog"
    aria-label="Primary navigation"
    class="home-mobile-navigation"
    @close="restoreFocus"
    @cancel="closeMenu"
  >
    <nav aria-label="Primary">
      <ul class="home-mobile-navigation__list">
        <li v-for="item in items" :key="item.href">
          <a :href="item.href" @click="closeMenu">{{ item.label }}</a>
        </li>
      </ul>
    </nav>
  </dialog>
</template>

<style scoped>
.home-mobile-navigation {
  position: fixed;
  inset: var(--header-height) 0 0;
  inline-size: 100%;
  max-inline-size: none;
  block-size: calc(100dvh - var(--header-height));
  margin: 0;
  padding: var(--space-12) var(--layout-gutter);
  border: 0;
  background: var(--color-overlay-backdrop);
  color: var(--color-text);
}

.home-mobile-navigation::backdrop {
  background: transparent;
}

.home-mobile-navigation__list {
  display: grid;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-mobile-navigation__list a {
  font-family: var(--font-display);
  font-size: var(--font-size-h3-mobile);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-heading);
  text-decoration: none;
}

@media (width >= 64rem) {
  .home-mobile-navigation {
    display: none;
  }
}
</style>
