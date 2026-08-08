import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import HomePhilosophy from '~/components/home/HomePhilosophy.vue'
import HomeServices from '~/components/home/HomeServices.vue'

describe('Epic 2 home sections', () => {
  it('renders Philosophy as an anchored section with three semantic list items', async () => {
    const wrapper = await mountSuspended(HomePhilosophy)

    expect(wrapper.get('section#philosophy').attributes('aria-labelledby')).toBe('philosophy-title')
    expect(wrapper.findAll('.home-philosophy__list > li')).toHaveLength(3)
    expect(wrapper.findAll('.home-philosophy__artwork img')).toHaveLength(3)
  })

  it('renders Services as an anchored section with six local Figma icon assets', async () => {
    const wrapper = await mountSuspended(HomeServices)

    expect(wrapper.get('section#services').attributes('aria-labelledby')).toBe('services-title')
    expect(wrapper.findAll('.home-services__list > li')).toHaveLength(6)
    expect(wrapper.findAll('.home-services__item-heading img')).toHaveLength(6)
    expect(wrapper.findAll('.home-services__item-heading img')[0]?.attributes('src')).toContain(
      '/icons/home/service-web-development.svg',
    )
  })
})
