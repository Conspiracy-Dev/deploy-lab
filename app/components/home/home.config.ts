export type HomeNavigationItem = {
  href: `#${string}`
  label: string
}

export const homeNavigationItems = Object.freeze([
  { href: '#home', label: 'Home' },
  { href: '#philosophy', label: 'Philosophy' },
  { href: '#services', label: 'Services' },
  { href: '#projects', label: 'Selected Projects' },
  { href: '#process', label: 'Process' },
  { href: '#feedback', label: 'Feedback' },
] as const satisfies readonly HomeNavigationItem[])

export const homeAnchorIds = Object.freeze({
  contact: 'contact',
  feedback: 'feedback',
  home: 'home',
  philosophy: 'philosophy',
  process: 'process',
  projects: 'projects',
  services: 'services',
} as const)

export const homeContent = Object.freeze({
  brand: '[Deploy Lab]',
  footerYear: '2025',
  hero: {
    actionLabel: 'Start a Project',
    description:
      'We build digital products with a focus on fintech and web3. Our team delivers the full development cycle from design and architecture to production release and ongoing support.',
    title: 'Full-cycle web and mobile development',
  },
  mobileMenuLabel: 'Open navigation',
  privacyHref: '/privacy-policy',
} as const)

export const casePlaceholderAltTexts = Object.freeze([
  'QuantumReady project preview',
  'Modernistes project preview',
  'QM Fund project preview',
  'John Lilic personal website project preview',
  'Cafe Cosmos game project preview',
  'Potok.Digital platform project preview',
] as const)
