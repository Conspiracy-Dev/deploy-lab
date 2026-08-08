import { mountSuspended } from '@nuxt/test-utils/runtime'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import HomeDesktopNavigation from '~/components/home/HomeDesktopNavigation.vue'
import HomeHeader from '~/components/home/HomeHeader.vue'
import SiteMobileNavigation from '~/components/site/SiteMobileNavigation.vue'
import { homeNavigationItems } from '~/components/home/home.config'

describe('HomeHeader', () => {
  it('renders the approved primary navigation and contact anchor', async () => {
    const wrapper = await mountSuspended(HomeHeader)

    expect(wrapper.get('header').element.tagName).toBe('HEADER')
    expect(wrapper.findComponent(HomeDesktopNavigation).exists()).toBe(true)
    expect(wrapper.findComponent(SiteMobileNavigation).exists()).toBe(true)
    expect(wrapper.get('a[href="#projects"]').text()).toBe('Selected Projects')
    expect(wrapper.get('a[href="#contact"]').text()).toBe('Start a Project')
  })

  it('keeps desktop and mobile navigation as separate typed compositions', async () => {
    const desktop = await mountSuspended(HomeDesktopNavigation, {
      props: { items: homeNavigationItems },
    })
    const mobile = await mountSuspended(SiteMobileNavigation, {
      props: { items: homeNavigationItems, modelValue: false },
    })

    expect(desktop.get('nav[aria-label="Primary"]').findAll('a')).toHaveLength(6)
    expect(mobile.get('nav[aria-label="Primary"]').findAll('a')).toHaveLength(6)
  })

  it('exposes an interactive close control inside the mobile dialog', async () => {
    const mobile = await mountSuspended(SiteMobileNavigation, {
      props: { items: homeNavigationItems, modelValue: false },
    })

    await mobile.get('button[aria-label="Close navigation"]').trigger('click')

    expect(mobile.emitted('update:modelValue')).toEqual([[false]])
  })

  it('keeps the Feedback export transparent outside its Figma artwork', () => {
    const feedbackWireframe = readFileSync(
      resolve(process.cwd(), 'public/images/home/feedback-wireframe.svg'),
      'utf8',
    )

    expect(feedbackWireframe).not.toContain('<rect width="956" height="799" fill="#555555"/>')
    expect(feedbackWireframe).toContain('#Design &gt; path:nth-of-type(-n + 2)')
  })
})
