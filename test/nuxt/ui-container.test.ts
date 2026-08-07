import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import UiContainer from '~/components/ui/UiContainer.vue'

describe('UiContainer', () => {
  it('renders slot content in the requested semantic wrapper', async () => {
    const wrapper = await mountSuspended(UiContainer, {
      props: { as: 'main' },
      slots: {
        default: () => h('p', { 'data-testid': 'container-content' }, 'Container content'),
      },
    })

    expect(wrapper.element.tagName).toBe('MAIN')
    expect(wrapper.classes()).toContain('ui-container')
    expect(wrapper.get('[data-testid="container-content"]').text()).toBe('Container content')
  })

  it('keeps long slot content in the document flow', async () => {
    const longContent = 'DeployLab '.repeat(80).trim()
    const wrapper = await mountSuspended(UiContainer, {
      slots: {
        default: () => h('p', longContent),
      },
    })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.text()).toBe(longContent)
  })
})
