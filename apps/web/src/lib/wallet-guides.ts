/**
 * Wallet recommendation database for guided wallet setup.
 * Each chain maps to recommended wallets with detection, install URLs, and metadata.
 */

export interface WalletGuide {
  name: string;
  icon: string;
  url: string;                    // Main website
  chromeUrl?: string;             // Chrome Web Store direct link
  detector?: string;              // JS expression to detect installation (evaluated at runtime)
  users?: string;                 // Social proof
  description: string;            // Short description
  primary: boolean;               // Recommended default
  mobile?: boolean;               // Has mobile app
  multiChain?: boolean;           // Supports multiple chains
  setupSteps?: string[];          // Custom setup guidance (overrides defaults)
}

export interface ChainWalletConfig {
  chainName: string;
  wallets: WalletGuide[];
  defaultSteps: string[];         // Generic setup steps if wallet doesn't have custom ones
}

export const WALLET_GUIDES: Record<string, ChainWalletConfig> = {
  near: {
    chainName: 'NEAR',
    wallets: [
      {
        name: 'MyNearWallet',
        icon: '🌐',
        url: 'https://app.mynearwallet.com',
        description: 'The most popular NEAR wallet. Browser-based — no extension needed.',
        detector: 'false', // Web-based, no extension to detect
        users: '5M+',
        primary: true,
        mobile: false,
        setupSteps: [
          'Click the link to open MyNearWallet',
          'Click "Create Account"',
          'Choose your account name (this is your NEAR address)',
          'Save your recovery phrase — write it on paper',
          'Come back and connect your wallet',
        ],
      },
      {
        name: 'Meteor Wallet',
        icon: '☄️',
        url: 'https://meteorwallet.app',
        chromeUrl: 'https://chromewebstore.google.com/detail/meteor-wallet/pcndjhknafelgpljaamhageaifemokod',
        detector: 'typeof window !== "undefined" && !!(window as any).meteorWallet',
        description: 'Feature-rich NEAR wallet with browser extension.',
        users: '500K+',
        primary: false,
        mobile: true,
      },
    ],
    defaultSteps: [
      'Create your wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
  },

  ethereum: {
    chainName: 'Ethereum',
    wallets: [
      {
        name: 'MetaMask',
        icon: '🦊',
        url: 'https://metamask.io',
        chromeUrl: 'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
        detector: 'typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask',
        description: 'The most trusted Ethereum wallet. Works on all EVM chains.',
        users: '30M+',
        primary: true,
        mobile: true,
        multiChain: true,
      },
      {
        name: 'Rabby',
        icon: '🐰',
        url: 'https://rabby.io',
        chromeUrl: 'https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch',
        detector: 'typeof window !== "undefined" && !!(window as any).ethereum?.isRabby',
        description: 'Modern multi-chain wallet with built-in security checks.',
        users: '2M+',
        primary: false,
        mobile: false,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
  },

  solana: {
    chainName: 'Solana',
    wallets: [
      {
        name: 'Phantom',
        icon: '👻',
        url: 'https://phantom.app',
        chromeUrl: 'https://chromewebstore.google.com/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa',
        detector: 'typeof window !== "undefined" && !!(window as any).phantom?.solana',
        description: 'The most popular Solana wallet. Used by millions.',
        users: '10M+',
        primary: true,
        mobile: true,
        multiChain: true,
      },
      {
        name: 'Solflare',
        icon: '☀️',
        url: 'https://solflare.com',
        chromeUrl: 'https://chromewebstore.google.com/detail/solflare-wallet/bhhhlbepdkbapadjdcopmiegjfkbbpmd',
        detector: 'typeof window !== "undefined" && !!(window as any).solflare?.isSolflare',
        description: 'Solana-native wallet with staking and DeFi built in.',
        users: '2M+',
        primary: false,
        mobile: true,
      },
      {
        name: 'Backpack',
        icon: '🎒',
        url: 'https://backpack.app',
        chromeUrl: 'https://chromewebstore.google.com/detail/backpack/aflkmfhebedbjioipglgcbcmnbpgliof',
        detector: 'typeof window !== "undefined" && !!(window as any).backpack?.isBackpack',
        description: 'Next-gen wallet from the xNFT team.',
        users: '1M+',
        primary: false,
        mobile: true,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
  },

  sui: {
    chainName: 'Sui',
    wallets: [
      {
        name: 'Sui Wallet',
        icon: '💧',
        url: 'https://suiwallet.com',
        chromeUrl: 'https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil',
        detector: 'typeof window !== "undefined" && !!(window as any).suiWallet',
        description: 'The official Sui wallet by Mysten Labs.',
        users: '3M+',
        primary: true,
        mobile: true,
      },
      {
        name: 'Navi',
        icon: '🧭',
        url: 'https://naviprotocol.io',
        chromeUrl: 'https://chromewebstore.google.com/detail/navi/lgcamodjpegnpjjoliibjlcfbhemamag',
        detector: 'typeof window !== "undefined" && !!(window as any).navi',
        description: 'DeFi-focused Sui wallet with lending built in.',
        users: '500K+',
        primary: false,
        mobile: false,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
  },

  aptos: {
    chainName: 'Aptos',
    wallets: [
      {
        name: 'Petra',
        icon: '🔴',
        url: 'https://petra.app',
        chromeUrl: 'https://chromewebstore.google.com/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci',
        detector: 'typeof window !== "undefined" && !!(window as any).petra',
        description: 'The official Aptos wallet by Aptos Labs.',
        users: '2M+',
        primary: true,
        mobile: true,
      },
      {
        name: 'Martian',
        icon: '👽',
        url: 'https://martianwallet.xyz',
        chromeUrl: 'https://chromewebstore.google.com/detail/martian-aptos-sui-wallet/efbglgofoippbgcjepnhiblaibstcloj',
        detector: 'typeof window !== "undefined" && !!(window as any).martian',
        description: 'Multi-chain wallet supporting Aptos and Sui.',
        users: '1M+',
        primary: false,
        mobile: true,
        multiChain: true,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
  },

  starknet: {
    chainName: 'Starknet',
    wallets: [
      {
        name: 'Argent X',
        icon: '🛡️',
        url: 'https://www.argent.xyz',
        chromeUrl: 'https://chromewebstore.google.com/detail/argent-x/dlcobpjiigpikoobohmabehhmhfoodbb',
        detector: 'typeof window !== "undefined" && !!(window as any).starknet?.isArgent',
        description: 'The leading Starknet wallet with account abstraction.',
        users: '2M+',
        primary: true,
        mobile: true,
      },
      {
        name: 'Braavos',
        icon: '⚔️',
        url: 'https://braavos.app',
        chromeUrl: 'https://chromewebstore.google.com/detail/braavos-smart-wallet/jnlgamecbpmbajjfhmmmlhejkemejdma',
        detector: 'typeof window !== "undefined" && !!(window as any).starknet?.isBraavos',
        description: 'Smart wallet for Starknet with hardware signer.',
        users: '1M+',
        primary: false,
        mobile: true,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
  },

  ton: {
    chainName: 'TON',
    wallets: [
      {
        name: 'Tonkeeper',
        icon: '💎',
        url: 'https://tonkeeper.com',
        chromeUrl: 'https://chromewebstore.google.com/detail/tonkeeper/omaabbefbmiijedngplfjmnooppbclkk',
        detector: 'typeof window !== "undefined" && !!(window as any).tonkeeper',
        description: 'The most popular TON wallet. Clean and simple.',
        users: '10M+',
        primary: true,
        mobile: true,
      },
      {
        name: 'OpenMask',
        icon: '🎭',
        url: 'https://openmask.app',
        chromeUrl: 'https://chromewebstore.google.com/detail/openmask/penjlddjkjgpnkllboccdgccekpkcbin',
        detector: 'typeof window !== "undefined" && !!(window as any).openmask',
        description: 'Open-source TON wallet extension.',
        users: '200K+',
        primary: false,
        mobile: false,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
  },

  tron: {
    chainName: 'Tron',
    wallets: [
      {
        name: 'TronLink',
        icon: '⚡',
        url: 'https://www.tronlink.org',
        chromeUrl: 'https://chromewebstore.google.com/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec',
        detector: 'typeof window !== "undefined" && !!(window as any).tronWeb',
        description: 'The official Tron wallet. Simple and reliable.',
        users: '5M+',
        primary: true,
        mobile: true,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
  },

  // EVM chains share wallet recommendations with Ethereum
  polygon: { chainName: 'Polygon', wallets: [], defaultSteps: [] },
  arbitrum: { chainName: 'Arbitrum', wallets: [], defaultSteps: [] },
  optimism: { chainName: 'Optimism', wallets: [], defaultSteps: [] },
  base: { chainName: 'Base', wallets: [], defaultSteps: [] },
  bsc: { chainName: 'BNB Chain', wallets: [], defaultSteps: [] },
  berachain: { chainName: 'Berachain', wallets: [], defaultSteps: [] },
  monad: { chainName: 'Monad', wallets: [], defaultSteps: [] },
};

// EVM L2s inherit from Ethereum
const evmAliases = ['polygon', 'arbitrum', 'optimism', 'base', 'bsc', 'berachain', 'monad'] as const;
for (const alias of evmAliases) {
  WALLET_GUIDES[alias] = {
    ...WALLET_GUIDES.ethereum,
    chainName: WALLET_GUIDES[alias].chainName,
  };
}

/**
 * Get the wallet guide config for a chain.
 * Falls back to Ethereum config for unknown EVM chains.
 */
export function getWalletGuide(chainId: string): ChainWalletConfig | null {
  return WALLET_GUIDES[chainId] || null;
}

/**
 * Get the primary (recommended) wallet for a chain.
 */
export function getPrimaryWallet(chainId: string): WalletGuide | null {
  const config = getWalletGuide(chainId);
  if (!config) return null;
  return config.wallets.find(w => w.primary) || config.wallets[0] || null;
}

/**
 * Detect if a wallet extension is installed.
 * Uses the detector expression from wallet config.
 */
export function detectWallet(wallet: WalletGuide): boolean {
  if (!wallet.detector) return false;
  try {
    // eslint-disable-next-line no-eval
    return !!eval(wallet.detector);
  } catch {
    return false;
  }
}
