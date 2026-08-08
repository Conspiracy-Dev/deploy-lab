import { describe, expect, it } from 'vitest'
import {
  casePlaceholderAltTexts,
  homeAnchorIds,
  homeContent,
  homeNavigationItems,
  homePhilosophyItems,
  homeServiceItems,
} from '~/components/home/home.config'

describe('home config contract', () => {
  it('keeps six unique primary navigation destinations', () => {
    const destinations = homeNavigationItems.map((item) => item.href)

    expect(destinations).toHaveLength(6)
    expect(new Set(destinations).size).toBe(destinations.length)
  })

  it('uses the approved Privacy Policy route and immutable navigation data', () => {
    expect(homeContent.privacyHref).toBe('/privacy-policy')
    expect(Object.isFrozen(homeNavigationItems)).toBe(true)
    expect(homeAnchorIds.contact).toBe('contact')
  })

  it('keeps one resolved placeholder alt text for every case', () => {
    expect(casePlaceholderAltTexts).toHaveLength(6)
    expect(casePlaceholderAltTexts.every((alt) => alt.endsWith('project preview'))).toBe(true)
  })

  it('keeps immutable Epic 2 content counts and approved section copy', () => {
    expect(homeContent.philosophy.title).toBe('We deliver complete products')
    expect(homeContent.services.title).toBe('What We Do')
    expect(homePhilosophyItems).toHaveLength(3)
    expect(homeServiceItems).toHaveLength(6)
    expect(Object.isFrozen(homePhilosophyItems)).toBe(true)
    expect(Object.isFrozen(homeServiceItems)).toBe(true)
  })
})
