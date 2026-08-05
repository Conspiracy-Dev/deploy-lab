<script setup lang="ts">
import type { Mesh } from 'three'
import { HERO_WIREFRAME } from './hero-wireframe.config'

const knot = shallowRef<Mesh | null>(null)

function animate({ elapsed }: { elapsed: number }) {
  if (!knot.value) {
    return
  }

  knot.value.rotation.x = elapsed * HERO_WIREFRAME.animation.rotationXPerSecond
  knot.value.rotation.y = elapsed * HERO_WIREFRAME.animation.rotationYPerSecond
}
</script>

<template>
  <TresCanvas
    :alpha="HERO_WIREFRAME.canvas.alpha"
    :dpr="HERO_WIREFRAME.canvas.dpr"
    :clear-alpha="HERO_WIREFRAME.canvas.clearAlpha"
    :clear-color="HERO_WIREFRAME.canvas.clearColor"
    :fps-limit="HERO_WIREFRAME.canvas.fpsLimit"
    :power-preference="HERO_WIREFRAME.canvas.powerPreference"
    @loop="animate"
  >
    <TresPerspectiveCamera :position-z="HERO_WIREFRAME.cameraPositionZ" />
    <TresMesh ref="knot">
      <TresTorusKnotGeometry :args="HERO_WIREFRAME.torusKnotArgs" />
      <TresMeshBasicMaterial
        :color="HERO_WIREFRAME.material.color"
        :wireframe="HERO_WIREFRAME.material.wireframe"
      />
    </TresMesh>
  </TresCanvas>
</template>

<style scoped>
:deep(canvas) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
