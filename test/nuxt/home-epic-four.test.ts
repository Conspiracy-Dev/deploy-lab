import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomeContact from '~/components/home/HomeContact.vue'
import HomeFeedback from '~/components/home/HomeFeedback.vue'

const { contactFetch } = vi.hoisted(() => ({ contactFetch: vi.fn() }))

vi.mock('#build/fetch.mjs', () => ({
  $fetch: contactFetch,
}))

const validContactValues = {
  email: 'ada@example.com',
  message: 'I would like to discuss a new product build.',
  name: 'Ada Lovelace',
}

async function fillValidContactForm(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  await wrapper.get('input[name="name"]').setValue(validContactValues.name)
  await wrapper.get('input[name="email"]').setValue(validContactValues.email)
  await wrapper.get('textarea[name="message"]').setValue(validContactValues.message)
  await wrapper.get('input[name="consent"]').setValue(true)
}

describe('Epic 4 home sections', () => {
  beforeEach(() => {
    contactFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders semantic testimonials as a focusable manual collection', async () => {
    const wrapper = await mountSuspended(HomeFeedback)

    expect(wrapper.get('section').attributes('id')).toBe('feedback')
    expect(wrapper.findAll('.home-feedback__list > li')).toHaveLength(3)
    expect(wrapper.get('.home-feedback__list').attributes('tabindex')).toBe('0')
    expect(wrapper.get('blockquote').text()).toContain('Over the years')
    expect(wrapper.get('.home-feedback__card p').text()).toBe('John Lilic')
    expect(wrapper.get('img[alt=""]').attributes('src')).toBe('/images/home/feedback-wireframe.svg')
  })

  it('invalid input → announces associated errors without a request', async () => {
    const wrapper = await mountSuspended(HomeContact)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(contactFetch).not.toHaveBeenCalled()
    expect(wrapper.get('input[name="name"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#contact-name-error').text()).toContain('2–100 characters')
    expect(wrapper.get('input[name="consent"]').attributes('aria-describedby')).toBe(
      'contact-consent-error',
    )
  })

  it('accepted request → disables submit, shows success and resets for another request', async () => {
    let acceptRequest: () => void
    contactFetch.mockImplementation(
      () =>
        new Promise<{ status: 'accepted' }>((resolve) => {
          acceptRequest = () => resolve({ status: 'accepted' })
        }),
    )
    const wrapper = await mountSuspended(HomeContact)
    await fillValidContactForm(wrapper)

    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')

    expect(contactFetch).toHaveBeenCalledWith('/api/contact', {
      body: { ...validContactValues, consent: true, website: '' },
      method: 'POST',
    })
    expect(contactFetch).toHaveBeenCalledTimes(1)
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('button[type="submit"]').text()).toBe('Sending…')

    acceptRequest!()
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toContain('Submitted successfully!')
    await wrapper.get('button[type="button"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('form')).toBeDefined()
    expect((wrapper.get('input[name="name"]').element as HTMLInputElement).value).toBe('')
  })

  it('delivery failure → retains values and permits a retry', async () => {
    contactFetch
      .mockRejectedValueOnce({ data: { error: 'service_unavailable' } })
      .mockResolvedValueOnce({ status: 'accepted' })
    const wrapper = await mountSuspended(HomeContact)
    await fillValidContactForm(wrapper)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'We couldn’t send your request. Please try again.',
    )
    expect((wrapper.get('input[name="name"]').element as HTMLInputElement).value).toBe(
      validContactValues.name,
    )

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(contactFetch).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[role="status"]').text()).toContain('Submitted successfully!')
  })
})
