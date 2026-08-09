<template>
  <div class="home-hero-visual" aria-hidden="true">
    <NuxtImg
      alt=""
      densities="1"
      fetchpriority="high"
      format="avif"
      height="1736"
      loading="eager"
      :preload="{ fetchPriority: 'high' }"
      quality="8"
      sizes="1736px"
      src="/images/home/hero-abstract-shape.png"
      width="1736"
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
    inline-size: 56.25rem;
    inset: -12.5625rem auto auto 0;
    transform: rotate(90deg);
  }
}
</style>
