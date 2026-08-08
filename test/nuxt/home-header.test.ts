import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import HomeHeader from '~/components/home/HomeHeader.vue'

describe('HomeHeader', () => {
  it('renders the approved primary navigation and contact anchor', async () => {
    const wrapper = await mountSuspended(HomeHeader)

    expect(wrapper.get('header').element.tagName).toBe('HEADER')
    expect(wrapper.get('nav[aria-label="Primary"]').element.tagName).toBe('NAV')
    expect(wrapper.get('a[href="#projects"]').text()).toBe('Selected Projects')
    expect(wrapper.get('a[href="#contact"]').text()).toBe('Start a Project')
  })
})
