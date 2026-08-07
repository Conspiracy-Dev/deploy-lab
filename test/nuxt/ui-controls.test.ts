import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import UiButton from '~/components/ui/UiButton.vue'
import UiCheckbox from '~/components/ui/UiCheckbox.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiMenuToggle from '~/components/ui/UiMenuToggle.vue'
import UiSuccessNotice from '~/components/ui/UiSuccessNotice.vue'

describe('UI kit controls', () => {
  it('renders UiButton as a native disabled-aware button', async () => {
    const wrapper = await mountSuspended(UiButton, {
      props: { disabled: true, type: 'submit' },
      slots: { default: 'Start a Project' },
    })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('submit')
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toBe('Start a Project')
  })

  it('forwards native attributes and emits input values for UiInput', async () => {
    const wrapper = await mountSuspended(UiInput, {
      attrs: { 'aria-label': 'Company name', placeholder: 'Company name' },
      props: { modelValue: '' },
    })

    const field = wrapper.get('input')
    expect(field.attributes('aria-label')).toBe('Company name')
    await field.setValue('DeployLab')
    expect(wrapper.emitted('update:modelValue')).toEqual([['DeployLab']])
  })

  it('selects a native textarea and keeps long content intact', async () => {
    const longValue = 'Detailed project scope '.repeat(40).trim()
    const wrapper = await mountSuspended(UiInput, {
      props: { modelValue: longValue, multiline: true, rows: 6 },
    })

    const field = wrapper.get('textarea')
    expect(field.attributes('rows')).toBe('6')
    expect((field.element as HTMLTextAreaElement).value).toBe(longValue)
  })

  it('emits checkbox state changes and preserves disabled semantics', async () => {
    const wrapper = await mountSuspended(UiCheckbox, { props: { modelValue: false } })
    const field = wrapper.get('input[type="checkbox"]')

    await field.setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])

    const disabledWrapper = await mountSuspended(UiCheckbox, { props: { disabled: true } })
    expect(disabledWrapper.get('input').attributes('disabled')).toBeDefined()
  })

  it('renders an accessible menu toggle and emits the next state', async () => {
    const wrapper = await mountSuspended(UiMenuToggle, {
      props: { label: 'Open navigation', modelValue: false },
    })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('aria-label')).toBe('Open navigation')
    expect(wrapper.attributes('aria-pressed')).toBe('false')
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('supports a controlled menu-toggle state change', async () => {
    const ControlledMenuToggle = defineComponent({
      setup() {
        const isOpen = ref(false)

        return () =>
          h(UiMenuToggle, {
            label: 'Menu',
            modelValue: isOpen.value,
            'onUpdate:modelValue': (value: boolean) => {
              isOpen.value = value
            },
          })
      },
    })
    const wrapper = await mountSuspended(ControlledMenuToggle)

    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
  })

  it('keeps success artwork decorative inside a status boundary', async () => {
    const wrapper = await mountSuspended(UiSuccessNotice, {
      props: {
        description: 'A long description '.repeat(40).trim(),
        title: 'Submitted successfully!',
      },
    })

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.get('img').attributes('alt')).toBe('')
    expect(wrapper.get('img').attributes('aria-hidden')).toBe('true')
    expect(wrapper.text()).toContain('Submitted successfully!')
  })
})
