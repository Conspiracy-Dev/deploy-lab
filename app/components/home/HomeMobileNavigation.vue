<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { homeAnchorIds, homeContent, type HomeNavigationItem } from './home.config'

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
    <div class="home-mobile-navigation__header">
      <a
        class="home-mobile-navigation__brand"
        :href="`#${homeAnchorIds.home}`"
        aria-label="Deploy Lab home"
        @click="closeMenu"
      >
        {{ homeContent.brand }}
      </a>
      <UiMenuToggle :model-value="true" label="Close navigation" @update:model-value="closeMenu" />
    </div>

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
  inset: 0;
  inline-size: 100%;
  max-inline-size: none;
  block-size: 100dvh;
  margin: 0;
  padding: 0;
  border: 0;
  background: var(--color-overlay-backdrop);
  color: var(--color-text);
}

.home-mobile-navigation::backdrop {
  background: transparent;
}

.home-mobile-navigation__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-block-size: var(--header-height);
  padding-inline: var(--layout-gutter);
  background: var(--color-header-surface);
  backdrop-filter: blur(0.75rem);
}

.home-mobile-navigation__brand {
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: var(--font-size-uptitle);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
  text-decoration: none;
}

.home-mobile-navigation__list {
  display: grid;
  gap: var(--space-6);
  margin: var(--space-12) 0 0;
  padding: 0 var(--layout-gutter);
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
