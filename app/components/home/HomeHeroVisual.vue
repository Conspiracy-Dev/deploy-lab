<template>
  <div class="home-hero-visual" aria-hidden="true">
    <NuxtImg
      alt=""
      fetchpriority="high"
      format="webp"
      height="2800"
      preload
      quality="80"
      src="/images/home/hero-abstract-shape.png"
      width="2800"
    />
  </div>
</template>

<style scoped>
.home-hero-visual {
  position: absolute;
  z-index: 0;
  overflow: hidden;
  inset: 0;
  pointer-events: none;
}

.home-hero-visual img {
  position: absolute;
  inline-size: max(106rem, 190vw);
  max-inline-size: none;
  block-size: auto;
  inset: -25rem auto auto 12%;
  transform: rotate(35.17deg);
  transform-origin: center;
}

@media (width < 64rem) {
  .home-hero-visual img {
    inline-size: 115rem;
    inset: 3rem auto auto -42rem;
  }
}
</style>
