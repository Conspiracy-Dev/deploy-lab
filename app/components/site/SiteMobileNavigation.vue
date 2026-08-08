<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { siteContent, type SiteNavigationItem } from './site.config'

const props = withDefaults(
  defineProps<{
    brandHref?: string
    items: readonly SiteNavigationItem[]
    modelValue: boolean
  }>(),
  {
    brandHref: '/',
  },
)

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
    class="site-mobile-navigation"
    @close="restoreFocus"
    @cancel="closeMenu"
  >
    <div class="site-mobile-navigation__header">
      <a
        class="site-mobile-navigation__brand"
        :href="brandHref"
        aria-label="Deploy Lab home"
        @click="closeMenu"
      >
        {{ siteContent.brand }}
      </a>
      <UiMenuToggle :model-value="true" label="Close navigation" @update:model-value="closeMenu" />
    </div>

    <nav aria-label="Primary">
      <ul class="site-mobile-navigation__list">
        <li v-for="item in items" :key="item.href">
          <a :href="item.href" @click="closeMenu">{{ item.label }}</a>
        </li>
      </ul>
    </nav>
  </dialog>
</template>

<style scoped>
.site-mobile-navigation {
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

.site-mobile-navigation::backdrop {
  background: transparent;
}

.site-mobile-navigation__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-block-size: var(--site-mobile-header-height, var(--header-height));
  padding-inline: var(--layout-gutter);
  background: var(--color-header-surface);
  backdrop-filter: blur(0.75rem);
}

.site-mobile-navigation__brand {
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: var(--font-size-uptitle);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
  text-decoration: none;
}

.site-mobile-navigation__list {
  display: grid;
  gap: var(--space-6);
  margin: var(--space-12) 0 0;
  padding: 0 var(--layout-gutter);
  list-style: none;
}

.site-mobile-navigation__list a {
  font-family: var(--font-display);
  font-size: var(--font-size-h3-mobile);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-heading);
  text-decoration: none;
}

@media (width >= 64rem) {
  .site-mobile-navigation {
    display: none;
  }
}
</style>
