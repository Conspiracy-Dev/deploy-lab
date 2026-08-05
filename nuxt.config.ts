export default defineNuxtConfig({
  compatibilityDate: '2026-08-04',
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
    },
  },
  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/seo',
    'nuxt-security',
    '@nuxt/hints',
    '@nuxt/content',
    '@tresjs/nuxt',
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],
  css: ['~/assets/styles/tokens.css', '~/assets/styles/base.css'],
  runtimeConfig: {
    public: {
      siteUrl: '',
    },
  },
  site: {
    name: 'DeployLab',
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://deploylab.example',
  },
  image: {
    format: ['avif', 'webp'],
    quality: 80,
  },
  fonts: {
    families: [
      {
        name: 'Inter',
        provider: 'google',
        weights: [400, 500, 600, 700],
        subsets: ['latin', 'cyrillic'],
      },
      {
        name: 'IBM Plex Mono',
        provider: 'google',
        weights: [400, 500],
        subsets: ['latin', 'cyrillic'],
      },
    ],
  },
  icon: {
    fallbackToApi: false,
  },
  content: {
    experimental: {
      sqliteConnector: 'native',
    },
  },
  nitro: {
    prerender: {
      routes: ['/robots.txt', '/sitemap.xml'],
    },
  },
})
