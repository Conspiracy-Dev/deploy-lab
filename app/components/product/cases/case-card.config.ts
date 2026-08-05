export type CaseCardData = {
  description: string
  destination: {
    external?: boolean
    href: string
    label: string
  }
  image: {
    alt: string
    focalPosition?: string
    src?: string
  }
  tags: string[]
  title: string
}

export const caseCardFixtures: CaseCardData[] = [
  {
    title: 'QuantumReady',
    description:
      'Dashboard for assessing quantum risk in blockchain networks and financial institutions.',
    tags: ['Architecture', 'Web development', 'Integrations'],
    destination: {
      external: true,
      href: 'https://quantumready.info',
      label: 'quantumready.info',
    },
    image: { alt: '' },
  },
  {
    title: 'Modernistes',
    description: 'Marketplace for high-end interior pieces with tokenized ownership.',
    tags: ['Full-cycle development', 'Web3 logic', 'Infrastructure'],
    destination: {
      external: true,
      href: 'https://modernistes.com',
      label: 'modernistes.com',
    },
    image: { alt: '' },
  },
  {
    title: 'QM Fund',
    description: 'Website for a fund investing in quantum technology startups',
    tags: ['Website development', 'Content structure'],
    destination: {
      external: true,
      href: 'https://qm.fund',
      label: 'qm.fund',
    },
    image: { alt: '' },
  },
  {
    title: 'John Lilic — Personal Website',
    description: 'Personal site for a leading venture investor and web3 advocate.',
    tags: ['Design', 'Development', 'Support'],
    destination: {
      external: true,
      href: 'https://johnlilic.info',
      label: 'johnlilic.info',
    },
    image: { alt: '' },
  },
  {
    title: 'Cafe Cosmos Game',
    description: 'Web3 game with on-chain mechanics and an in-game economy.',
    tags: ['Frontend', 'Integrations', 'Optimization'],
    destination: {
      external: true,
      href: 'https://game.cafecosmos.io',
      label: 'game.cafecosmos.io',
    },
    image: { alt: '' },
  },
  {
    title: 'Potok.Digital',
    description: 'Major crowd-lending platform in the CIS region',
    tags: ['Support', 'Platform evolution', 'Process optimization'],
    destination: {
      external: true,
      href: 'https://potok.digital',
      label: 'potok.digital',
    },
    image: { alt: '' },
  },
]
