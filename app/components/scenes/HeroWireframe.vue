<script setup lang="ts">
import HeroWireframeCanvas from '~/components/scenes/HeroWireframeCanvas.vue'

const sceneHost = useTemplateRef<HTMLElement>('sceneHost')
const { canRender } = useSceneLifecycle(sceneHost)
</script>

<template>
  <div ref="sceneHost" class="hero-wireframe" aria-hidden="true">
    <HeroWireframeCanvas v-if="canRender" />
  </div>
</template>

<style scoped>
.hero-wireframe {
  position: absolute;
  inset: 0;
}
</style>
