import { defineConfig, presetUno, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  theme: {
    breakpoints: {
      sm: '40rem',
      md: '48rem',
      lg: '64rem',
      xl: '80rem',
    },
  },
  shortcuts: {
    'page-shell': 'mx-auto w-full max-w-[80rem] px-5 sm:px-8 lg:px-12',
  },
})
