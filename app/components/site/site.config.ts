export type SiteNavigationItem = {
  href: string
  label: string
}

export const siteContent = Object.freeze({
  brand: '[Deploy Lab]',
  footerYear: '2026',
  mobileMenuLabel: 'Open navigation',
  privacyHref: '/privacy-policy',
} as const)
