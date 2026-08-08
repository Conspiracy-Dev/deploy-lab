import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import HomeDesktopNavigation from '~/components/home/HomeDesktopNavigation.vue'
import HomeHeader from '~/components/home/HomeHeader.vue'
import HomeMobileNavigation from '~/components/home/HomeMobileNavigation.vue'
import { homeNavigationItems } from '~/components/home/home.config'

describe('HomeHeader', () => {
  it('renders the approved primary navigation and contact anchor', async () => {
    const wrapper = await mountSuspended(HomeHeader)

    expect(wrapper.get('header').element.tagName).toBe('HEADER')
    expect(wrapper.findComponent(HomeDesktopNavigation).exists()).toBe(true)
    expect(wrapper.findComponent(HomeMobileNavigation).exists()).toBe(true)
    expect(wrapper.get('a[href="#projects"]').text()).toBe('Selected Projects')
    expect(wrapper.get('a[href="#contact"]').text()).toBe('Start a Project')
  })

  it('keeps desktop and mobile navigation as separate typed compositions', async () => {
    const desktop = await mountSuspended(HomeDesktopNavigation, {
      props: { items: homeNavigationItems },
    })
    const mobile = await mountSuspended(HomeMobileNavigation, {
      props: { items: homeNavigationItems, modelValue: false },
    })

    expect(desktop.get('nav[aria-label="Primary"]').findAll('a')).toHaveLength(6)
    expect(mobile.get('nav[aria-label="Primary"]').findAll('a')).toHaveLength(6)
  })
})
