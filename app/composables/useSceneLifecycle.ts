import type { Ref } from 'vue'
import {
  useDocumentVisibility,
  useIntersectionObserver,
  usePreferredReducedMotion,
} from '@vueuse/core'

export function useSceneLifecycle(target: Readonly<Ref<HTMLElement | null>>) {
  const isVisible = ref(false)
  const documentVisibility = useDocumentVisibility()
  const motionPreference = usePreferredReducedMotion()

  useIntersectionObserver(
    target,
    ([entry]) => {
      isVisible.value = entry?.isIntersecting ?? false
    },
    { threshold: 0.1 },
  )

  const prefersReducedMotion = computed(() => motionPreference.value === 'reduce')
  const canRender = computed(
    () => isVisible.value && documentVisibility.value === 'visible' && !prefersReducedMotion.value,
  )

  return {
    canRender,
    prefersReducedMotion,
  }
}
