import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PrivacyHeader from '~/components/privacy/PrivacyHeader.vue'
import SiteFooter from '~/components/site/SiteFooter.vue'
import SiteMobileNavigation from '~/components/site/SiteMobileNavigation.vue'

describe('shared site shell', () => {
  it('gives Privacy Policy a home brand and route-aware mobile destinations', async () => {
    const wrapper = await mountSuspended(PrivacyHeader)
    const mobileNavigation = wrapper.getComponent(SiteMobileNavigation)

    expect(wrapper.get('a[aria-label="Deploy Lab home"]').attributes('href')).toBe('/')
    expect(mobileNavigation.get('nav a[href="/"]').text()).toBe('Home')
    expect(mobileNavigation.get('nav a[href="/#philosophy"]').text()).toBe('Philosophy')
  })

  it('renders the shared approved footer contract', async () => {
    const wrapper = await mountSuspended(SiteFooter)

    expect(wrapper.get('footer').element.tagName).toBe('FOOTER')
    expect(wrapper.get('a[href="/privacy-policy"]').text()).toBe('Privacy Policy')
    expect(wrapper.text()).toContain('2025')
  })
})
