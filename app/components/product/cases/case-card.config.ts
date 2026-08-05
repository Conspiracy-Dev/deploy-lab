import cafeCosmosGameImage from '~/assets/images/cases/cafe-cosmos-game.png'
import johnLilicImage from '~/assets/images/cases/john-lilic.png'
import modernistesImage from '~/assets/images/cases/modernistes.png'
import potokDigitalImage from '~/assets/images/cases/potok-digital.png'
import qmFundImage from '~/assets/images/cases/qm-fund.png'
import quantumReadyImage from '~/assets/images/cases/quantumready.png'

type CaseCardImageCrop = {
  height: string
  left: string
  top: string
  width: string
}

export type CaseCardData = {
  description: string
  destination: {
    external?: boolean
    href: string
    label: string
  }
  image: {
    alt: string
    desktopCrop?: CaseCardImageCrop
    mobileCrop?: CaseCardImageCrop
    src: string
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
    image: {
      alt: 'Project preview',
      src: quantumReadyImage,
      desktopCrop: { height: '108.09%', left: '-0.17%', top: '-8.09%', width: '100.2%' },
      mobileCrop: { height: '108.75%', left: '-0.17%', top: '-8.42%', width: '100.82%' },
    },
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
    image: {
      alt: 'Project preview',
      src: modernistesImage,
      desktopCrop: { height: '100%', left: '-0.09%', top: '0', width: '161.06%' },
    },
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
    image: {
      alt: 'Project preview',
      src: qmFundImage,
      desktopCrop: { height: '100%', left: '0.08%', top: '0', width: '161.22%' },
    },
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
    image: {
      alt: 'Project preview',
      src: johnLilicImage,
      desktopCrop: { height: '100%', left: '-0.07%', top: '0', width: '162.37%' },
    },
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
    image: {
      alt: 'Project preview',
      src: cafeCosmosGameImage,
      desktopCrop: { height: '100%', left: '-17.05%', top: '0', width: '112.2%' },
    },
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
    image: {
      alt: 'Project preview',
      src: potokDigitalImage,
      desktopCrop: { height: '100%', left: '0.01%', top: '0', width: '132.55%' },
    },
  },
]
