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
  philosophy: {
    description:
      'We build digital products with a focus on fintech and web3. Our team delivers the full development cycle from design and architecture to production release and ongoing support.',
    eyebrow: '[Manifesto, Philosophy]',
    title: 'We deliver complete products',
  },
  mobileMenuLabel: 'Open navigation',
  privacyHref: '/privacy-policy',
  services: {
    description:
      'We build digital products with a focus on fintech and web3. Our team delivers the full development cycle from design and architecture to production release and ongoing support.',
    eyebrow: '[Services]',
    title: 'What We Do',
  },
} as const)

export const homePhilosophyItems = Object.freeze([
  {
    artwork: '/images/home/philosophy-full-team.png',
    description:
      'We operate as a dedicated engineering team covering architecture, design, development and production deployment.',
    rotate: false,
  },
  {
    artwork: '/images/home/philosophy-domain-expertise.png',
    description: 'Strong expertise in fintech, web3 platforms and infrastructure-heavy systems.',
    rotate: true,
  },
  {
    artwork: '/images/home/philosophy-reliable-process.png',
    description:
      'Teams value us for a reliable process, consistent quality and deep technical expertise.',
    rotate: false,
  },
] as const)

export const homeServiceItems = Object.freeze([
  {
    description: 'Modern web products with structured architecture and clean implementation.',
    icon: '/icons/home/service-web-development.svg',
    title: 'Web Development',
  },
  {
    description: 'iOS and Android apps from prototype to production.',
    icon: '/icons/home/service-mobile-development.svg',
    title: 'Mobile Development',
  },
  {
    description: 'Secure and reliable contract logic for blockchain products.',
    icon: '/icons/home/service-smart-contract.svg',
    title: 'Smart Contract Development',
  },
  {
    description: 'Platforms, dApps, integrations and tooling.',
    icon: '/icons/home/service-web3.svg',
    title: 'Web3 Applications',
  },
  {
    description: 'Deployment, CI/CD, monitoring, optimization and secure environments.',
    icon: '/icons/home/service-infrastructure.svg',
    title: 'Infrastructure & DevOps',
  },
  {
    description: 'Long-term maintenance, improvements and product growth.',
    icon: '/icons/home/service-support.svg',
    title: 'Technical Support',
  },
] as const)

export const casePlaceholderAltTexts = Object.freeze([
  'QuantumReady project preview',
  'Modernistes project preview',
  'QM Fund project preview',
  'John Lilic personal website project preview',
  'Cafe Cosmos game project preview',
  'Potok.Digital platform project preview',
] as const)
