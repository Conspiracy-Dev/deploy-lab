import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import HomeContact from '~/components/home/HomeContact.vue'
import HomeFeedback from '~/components/home/HomeFeedback.vue'

describe('Epic 4 home sections', () => {
  it('renders semantic testimonials as a focusable manual collection', async () => {
    const wrapper = await mountSuspended(HomeFeedback)

    expect(wrapper.get('section').attributes('id')).toBe('feedback')
    expect(wrapper.findAll('.home-feedback__list > li')).toHaveLength(3)
    expect(wrapper.get('.home-feedback__list').attributes('tabindex')).toBe('0')
    expect(wrapper.get('blockquote').text()).toContain('Over the years')
    expect(wrapper.get('.home-feedback__card p').text()).toBe('John Lilic')
    expect(wrapper.get('img[alt=""]').attributes('src')).toBe('/images/home/feedback-wireframe.svg')
  })

  it('renders an accessible visual-only contact form without a success state', async () => {
    const wrapper = await mountSuspended(HomeContact)

    expect(wrapper.get('section').attributes('id')).toBe('contact')
    expect(wrapper.get('input[name="name"]').attributes('placeholder')).toBe('Name')
    expect(wrapper.get('input[name="email"]').attributes('type')).toBe('email')
    expect(wrapper.get('textarea[name="message"]')).toBeDefined()
    expect(wrapper.get('input[name="consent"]').attributes('type')).toBe('checkbox')
    expect(wrapper.get('a[href="/privacy-policy"]').text()).toBe('Privacy Policy')
    expect(wrapper.get('button').attributes('type')).toBe('button')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })
})
