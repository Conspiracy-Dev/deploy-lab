import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    news: defineCollection({
      type: 'page',
      source: 'news/**/*.md',
      schema: z.object({
        title: z.string().min(1),
        description: z.string().min(1).max(160),
        publishedAt: z.date(),
        image: z.string().startsWith('/').optional(),
        draft: z.boolean().default(false),
      }),
    }),
  },
})
