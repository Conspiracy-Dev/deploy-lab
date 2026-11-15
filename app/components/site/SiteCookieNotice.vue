<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { siteContent } from './site.config'

const NOTICE_COOKIE_NAME = 'deploylab-cookie-notice'
const DISMISSAL_COOKIE = `${NOTICE_COOKIE_NAME}=dismissed`

const emit = defineEmits<{ measure: [height: number] }>()
const route = useRoute()
const isHome = computed(() => route.name === 'index')
const state = ref<'pending' | 'visible' | 'dismissed'>('pending')
const notice = ref<HTMLElement | null>(null)
const isVisible = computed(
  () => state.value === 'visible' && (isHome.value || route.name === 'privacy-policy'),
)
const { height } = useElementSize(notice, undefined, { box: 'border-box' })
watch(height, (value) => emit('measure', value))
let tabs: BroadcastChannel | undefined

function hideNotice() {
  state.value = 'dismissed'

  if (notice.value?.contains(document.activeElement)) {
    document.querySelector('main')?.focus({ preventScroll: true })
  }
}

function hasDismissalCookie() {
  return document.cookie.split(';').some((cookie) => cookie.trim() === DISMISSAL_COOKIE)
}

function syncNotice() {
  try {
    if (hasDismissalCookie()) {
      hideNotice()
    }
  } catch {
    // The notice can still be dismissed for the current page when cookies are blocked.
  }

  if (state.value === 'pending') {
    state.value = 'visible'
  }
}

function dismissNotice() {
  hideNotice()

  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${DISMISSAL_COOKIE}; Path=/; SameSite=Lax${secure}`
    if (hasDismissalCookie()) {
      tabs?.postMessage(DISMISSAL_COOKIE)
    }
  } catch {
    // The in-memory dismissal also works in browsers that restrict cookie writes.
  }
}

function receiveDismissal(event: MessageEvent<unknown>) {
  // The sending tab has already verified the write. The cookie can propagate
  // to this tab's document after the message.
  if (event.data === DISMISSAL_COOKIE) {
    hideNotice()
  }
}

function rectanglesOverlap(first: DOMRect, second: DOMRect) {
  return (
    Math.max(first.left, second.left) < Math.min(first.right, second.right) &&
    Math.max(first.top, second.top) < Math.min(first.bottom, second.bottom)
  )
}

function keepFocusVisible(event: FocusEvent) {
  const element = event.target
  const panel = notice.value
  if (!isVisible.value || !(element instanceof HTMLElement) || !panel || panel.contains(element)) {
    return
  }
  if (element.closest('dialog:modal') || getComputedStyle(panel).position !== 'fixed') {
    return
  }

  if (rectanglesOverlap(element.getBoundingClientRect(), panel.getBoundingClientRect())) {
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
  }
}

onMounted(() => {
  // The prerendered pages contain the same markup for every visitor.
  syncNotice()
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      tabs = new BroadcastChannel(NOTICE_COOKIE_NAME)
      tabs.addEventListener('message', receiveDismissal)
    }
  } catch {
    // Tabs still re-read the cookie when the visitor returns to them.
  }
  window.addEventListener('focus', syncNotice)
  document.addEventListener('visibilitychange', syncNotice)
  document.addEventListener('focusin', keepFocusVisible)
})

onBeforeUnmount(() => {
  tabs?.close()
  window.removeEventListener('focus', syncNotice)
  document.removeEventListener('visibilitychange', syncNotice)
  document.removeEventListener('focusin', keepFocusVisible)
})
</script>

<template>
  <aside
    v-if="isVisible"
    ref="notice"
    class="site-cookie-notice"
    :class="{ 'site-cookie-notice--home': isHome }"
    aria-labelledby="cookie-notice-title"
  >
    <div class="site-cookie-notice__copy">
      <UiTypography id="cookie-notice-title" as="h2" variant="h4">How we use cookies</UiTypography>
      <UiTypography class="site-cookie-notice__description">
        We use a cookie to personalize your experience. Learn more in our
        <a :href="siteContent.privacyHref">Privacy Policy</a>.
      </UiTypography>
    </div>
    <UiButton class="site-cookie-notice__action" @click="dismissNotice">OK</UiButton>
  </aside>
</template>

<style scoped>
/* Figma 2048:181 and 2048:159. */
.site-cookie-notice {
  position: fixed;
  z-index: 2;
  inset-block-end: var(--cookie-notice-bottom);
  inset-inline-start: max(var(--layout-gutter), calc((100% - var(--content-width)) / 2));
  display: grid;
  gap: var(--space-3);
  inline-size: min(var(--cookie-notice-max-width), calc(100% - 2 * var(--layout-gutter)));
  max-block-size: calc(100dvh - var(--cookie-notice-bottom));
  padding: var(--space-4);
  overflow: auto;
  border: 1px solid var(--color-control-border);
  background: var(--color-footer-surface);
  color: var(--color-text);
}

.site-cookie-notice__copy {
  display: grid;
  gap: var(--space-2);
  min-inline-size: 0;
}

.site-cookie-notice .site-cookie-notice__description {
  line-height: var(--cookie-notice-copy-line-height);
}

.site-cookie-notice__description a {
  color: var(--color-accent);
  white-space: nowrap;
}

.site-cookie-notice__action {
  min-block-size: var(--cookie-notice-button-height);
}

@media (width < 64rem) {
  /* Figma 2048:165 places the notice in the hero artwork, above the page copy. */
  .site-cookie-notice--home {
    position: absolute;
    inset-block: calc(var(--header-height) + var(--space-8)) auto;
    max-block-size: none;
    overflow: visible;
  }
}

@media (width >= 64rem) {
  .site-cookie-notice {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-6);
    align-items: center;
    padding: var(--space-6);
  }
}
</style>
