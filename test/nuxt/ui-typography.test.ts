import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import UiTypography from '~/components/ui/UiTypography.vue'

describe('UiTypography', () => {
  it.each([
    ['uptitle', 'P'],
    ['h1', 'H1'],
    ['h2', 'H2'],
    ['h3', 'H3'],
    ['h4', 'H4'],
    ['body', 'P'],
  ] as const)('renders the %s variant with its semantic default', async (variant, expectedTag) => {
    const wrapper = await mountSuspended(UiTypography, {
      props: { variant },
      slots: { default: `${variant} content` },
    })

    expect(wrapper.element.tagName).toBe(expectedTag)
    expect(wrapper.classes()).toContain(`ui-typography--${variant}`)
  })

  it('allows a consumer to override the rendered element', async () => {
    const wrapper = await mountSuspended(UiTypography, {
      props: { as: 'span', variant: 'h2' },
      slots: { default: 'Inline heading treatment' },
    })

    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('ui-typography--h2')
  })

  it('applies muted colour treatment only to body copy', async () => {
    const wrapper = await mountSuspended(UiTypography, {
      props: { muted: true, variant: 'body' },
      slots: { default: 'Muted body copy' },
    })

    expect(wrapper.classes()).toContain('ui-typography--muted')
  })

  it('keeps long text as regular text content', async () => {
    const longContent = 'Full-cycle web and mobile development '.repeat(40).trim()
    const wrapper = await mountSuspended(UiTypography, {
      props: { variant: 'body' },
      slots: { default: longContent },
    })

    expect(wrapper.text()).toBe(longContent)
  })
})
