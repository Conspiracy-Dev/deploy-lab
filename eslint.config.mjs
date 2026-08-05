import withNuxt from './.nuxt/eslint.config.mjs'
import sonarjs from 'eslint-plugin-sonarjs'

export default withNuxt({
  name: 'deploylab/complexity',
  files: ['**/*.{ts,vue}'],
  plugins: {
    sonarjs,
  },
  rules: {
    complexity: ['error', { max: 8 }],
    'sonarjs/cognitive-complexity': ['error', 15],
  },
})
