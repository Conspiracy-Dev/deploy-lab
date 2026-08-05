import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'

const UiKitProbe = defineComponent({
  setup() {
    return () => h('p', { 'data-testid': 'ui-kit-probe' }, 'UI kit test environment')
  },
})

describe('UI kit Nuxt test environment', () => {
  it('mounts a component inside the Nuxt runtime', async () => {
    const wrapper = await mountSuspended(UiKitProbe)

    expect(wrapper.get('[data-testid="ui-kit-probe"]').text()).toBe('UI kit test environment')
  })
})
