import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import HomeProcess from '~/components/home/HomeProcess.vue'
import HomeProjects from '~/components/home/HomeProjects.vue'

describe('Epic 3 home sections', () => {
  it('projects landmark renders all case cards as a manual collection', async () => {
    const wrapper = await mountSuspended(HomeProjects)

    expect(wrapper.get('section').attributes('id')).toBe('projects')
    expect(wrapper.findAll('.home-projects__list > li')).toHaveLength(6)
    expect(wrapper.get('.home-projects__list').attributes('tabindex')).toBe('0')
    expect(wrapper.get('img[alt="QuantumReady project preview"]')).toBeDefined()
  })

  it('process landmark renders seven ordered stages and decorative Figma art', async () => {
    const wrapper = await mountSuspended(HomeProcess)

    expect(wrapper.get('section').attributes('id')).toBe('process')
    expect(wrapper.findAll('.home-process__list > li')).toHaveLength(7)
    expect(wrapper.get('ol').text()).toContain('1.Product Discovery')
    expect(wrapper.findAll('img[alt=""]')).toHaveLength(2)
  })
})
