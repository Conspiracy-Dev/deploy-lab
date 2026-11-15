<script setup lang="ts">
const socialImage = '/images/social/deploylab-v1.png'
const socialImageAlt = '[Deploy Lab] — Full-cycle web and mobile development'

useSeoMeta({
  ogImage: socialImage,
  ogImageAlt: socialImageAlt,
  ogImageType: 'image/png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterImage: socialImage,
  twitterImageAlt: socialImageAlt,
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
