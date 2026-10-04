import { resolve } from 'node:path'

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
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],
  css: ['~/assets/styles/tokens.css', '~/assets/styles/base.css'],
  runtimeConfig: {
    notionDataSourceId: '',
    notionToken: '',
    trustProxy: false,
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
    provider: 'google',
    families: [
      {
        name: 'IBM Plex Sans',
        provider: 'google',
        weights: [400],
        subsets: ['latin', 'cyrillic'],
      },
      {
        name: 'IBM Plex Mono',
        provider: 'google',
        weights: [500, 700],
        subsets: ['latin', 'cyrillic'],
      },
      {
        name: 'Manrope',
        provider: 'google',
        weights: [600],
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
  security: {
    // The dev server serves every test asset through Nitro. Keep response-header
    // coverage in E2E, but avoid exhausting the in-memory limiter during a suite.
    rateLimiter: process.env.NODE_ENV === 'development' ? false : {},
  },
  hooks: {
    'pages:extend'(pages) {
      if (process.env.NODE_ENV !== 'development') {
        return
      }

      pages.push({
        name: 'ui-kit-dev',
        path: '/__ui-kit',
        file: resolve('app/components/dev/UiKitFixture.vue'),
      })
    },
  },
  nitro: {
    routeRules: {
      '/contact-health': {
        security: { rateLimiter: false },
      },
      '/api/contact': {
        security: {
          allowedMethodsRestricter: {
            methods: ['POST'],
          },
          rateLimiter: false,
          requestSizeLimiter: {
            maxRequestSizeInBytes: 8_192,
          },
        },
      },
    },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/privacy-policy', '/robots.txt', '/sitemap.xml', '/404.html'],
      ignore: ['/api/contact', '/contact-health'],
    },
  },
})
