import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CaseCard from '~/components/product/cases/CaseCard.vue'
import { caseCardFixtures } from '~/components/product/cases/case-card.config'

const quantumReady = caseCardFixtures[0]!

describe('CaseCard', () => {
  it('renders the product card with a single external destination link', async () => {
    const wrapper = await mountSuspended(CaseCard, { props: quantumReady })
    const link = wrapper.get('a')

    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.get('h3').text()).toBe('QuantumReady')
    expect(wrapper.findAll('li')).toHaveLength(3)
    expect(link.attributes('href')).toBe('https://quantumready.info')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(wrapper.get('img[alt="Project preview"]')).toBeDefined()
  })

  it('keeps internal destinations in the current tab and renders a supplied image accessibly', async () => {
    const wrapper = await mountSuspended(CaseCard, {
      props: {
        ...quantumReady,
        destination: { href: '/cases/quantumready', label: 'Read case' },
        image: { alt: 'QuantumReady dashboard preview', src: '/preview.png' },
      },
    })

    const link = wrapper.get('a')
    expect(link.attributes('target')).toBeUndefined()
    expect(link.attributes('rel')).toBeUndefined()
    expect(wrapper.get('img[alt="QuantumReady dashboard preview"]')).toBeDefined()
  })

  it('keeps long case content and all six fixtures as data', async () => {
    const longTitle = 'QuantumReady '.repeat(20).trim()
    const wrapper = await mountSuspended(CaseCard, {
      props: { ...quantumReady, title: longTitle },
    })

    expect(wrapper.text()).toContain(longTitle)
    expect(caseCardFixtures).toHaveLength(6)
    expect(new Set(caseCardFixtures.map((caseCard) => caseCard.title)).size).toBe(6)
    expect(caseCardFixtures.every((caseCard) => caseCard.image.src)).toBe(true)
  })
})
