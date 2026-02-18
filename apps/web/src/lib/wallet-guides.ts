/**
 * Wallet recommendation database for guided wallet setup.
 * Each chain maps to recommended wallets with detection, install URLs, and metadata.
 * Supports both desktop (browser extension) and mobile (app store) flows.
 */

export interface WalletGuide {
  name: string;
  icon: string;
  url: string;                    // Main website
  chromeUrl?: string;             // Chrome Web Store direct link
  appStoreUrl?: string;           // iOS App Store link
  playStoreUrl?: string;          // Google Play Store link
  deepLink?: string;              // Mobile deep link / universal link to open wallet app
  wcProjectId?: string;           // WalletConnect project ID (if applicable)
  detector?: string;              // JS expression to detect extension (desktop only)
  users?: string;                 // Social proof
  description: string;            // Short description
  primary: boolean;               // Recommended default
  mobile?: boolean;               // Has mobile app
  desktopOnly?: boolean;          // Extension-only, no mobile app
  multiChain?: boolean;           // Supports multiple chains
  setupSteps?: string[];          // Desktop setup guidance
  mobileSetupSteps?: string[];    // Mobile-specific setup guidance
}

export interface ChainWalletConfig {
  chainName: string;
  wallets: WalletGuide[];
  defaultSteps: string[];         // Generic desktop steps
  defaultMobileSteps: string[];   // Generic mobile steps
}

/** Detect if user is on a mobile device */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
}

/** Detect iOS specifically */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Detect Android specifically */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/** Get the appropriate install URL for the current platform */
export function getInstallUrl(wallet: WalletGuide): string | null {
  if (isMobileDevice()) {
    if (isIOS() && wallet.appStoreUrl) return wallet.appStoreUrl;
    if (isAndroid() && wallet.playStoreUrl) return wallet.playStoreUrl;
    // Fallback: try either store link, then main URL
    return wallet.appStoreUrl || wallet.playStoreUrl || wallet.url;
  }
  return wallet.chromeUrl || wallet.url;
}

/** Get the setup steps appropriate for the current platform */
export function getSetupSteps(wallet: WalletGuide, chainConfig: ChainWalletConfig): string[] {
  if (isMobileDevice()) {
    return wallet.mobileSetupSteps || chainConfig.defaultMobileSteps;
  }
  return wallet.setupSteps || chainConfig.defaultSteps;
}

/** Get wallets filtered for the current platform */
export function getPlatformWallets(config: ChainWalletConfig): WalletGuide[] {
  if (isMobileDevice()) {
    // On mobile, only show wallets that have mobile apps
    return config.wallets.filter(w => w.mobile && !w.desktopOnly);
  }
  return config.wallets;
}

export const WALLET_GUIDES: Record<string, ChainWalletConfig> = {
  near: {
    chainName: 'NEAR',
    wallets: [
      {
        name: 'MyNearWallet',
        icon: '🌐',
        url: 'https://app.mynearwallet.com',
        description: 'The most popular NEAR wallet. Browser-based — works everywhere.',
        detector: 'false',
        users: '5M+',
        primary: true,
        mobile: true, // Web-based, works on mobile browsers
        setupSteps: [
          'Click the link to open MyNearWallet',
          'Click "Create Account"',
          'Choose your account name (this is your NEAR address)',
          'Save your recovery phrase — write it on paper',
          'Come back and connect your wallet',
        ],
        mobileSetupSteps: [
          'Tap the link to open MyNearWallet in your browser',
          'Tap "Create Account"',
          'Choose your account name (this is your NEAR address)',
          'Save your recovery phrase — write it down, never screenshot it',
          'Come back to goBlink and connect your wallet',
        ],
      },
      {
        name: 'Meteor Wallet',
        icon: '☄️',
        url: 'https://meteorwallet.app',
        chromeUrl: 'https://chromewebstore.google.com/detail/meteor-wallet/pcndjhknafelgpljaamhageaifemokod',
        appStoreUrl: 'https://apps.apple.com/app/meteor-wallet/id6504256648',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=app.meteorwallet',
        detector: 'typeof window !== "undefined" && !!(window as any).meteorWallet',
        description: 'Feature-rich NEAR wallet with browser extension and mobile app.',
        users: '500K+',
        primary: false,
        mobile: true,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create your wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
    defaultMobileSteps: [
      'Install the app from your app store',
      'Open the app and tap "Create new wallet"',
      'Set a strong password or enable biometrics',
      'Save your recovery phrase — write it down, never screenshot it',
      'Come back to goBlink and connect your wallet',
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
        appStoreUrl: 'https://apps.apple.com/app/metamask-blockchain-wallet/id1438144202',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
        deepLink: 'metamask://',
        detector: 'typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask',
        description: 'The most trusted Ethereum wallet. Works on all EVM chains.',
        users: '30M+',
        primary: true,
        mobile: true,
        multiChain: true,
        mobileSetupSteps: [
          'Install MetaMask from your app store',
          'Open the app and tap "Create a new wallet"',
          'Agree to the terms and set a password',
          'Enable Face ID or fingerprint for quick access',
          'Write down your 12-word recovery phrase on paper',
          'Confirm your recovery phrase',
          'Come back to goBlink and tap "Connect wallet"',
        ],
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
        desktopOnly: true,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
    defaultMobileSteps: [
      'Install the app from your app store',
      'Open the app and tap "Create new wallet"',
      'Set a password and enable biometrics',
      'Write down your recovery phrase on paper — never screenshot it',
      'Come back to goBlink and tap "Connect wallet"',
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
        appStoreUrl: 'https://apps.apple.com/app/phantom-crypto-wallet/id1598432977',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=app.phantom',
        deepLink: 'phantom://',
        detector: 'typeof window !== "undefined" && !!(window as any).phantom?.solana',
        description: 'The most popular Solana wallet. Used by millions.',
        users: '10M+',
        primary: true,
        mobile: true,
        multiChain: true,
        mobileSetupSteps: [
          'Install Phantom from your app store',
          'Open the app and tap "Create a new wallet"',
          'Enable Face ID or fingerprint',
          'Write down your recovery phrase on paper',
          'Come back to goBlink and tap "Connect wallet"',
        ],
      },
      {
        name: 'Solflare',
        icon: '☀️',
        url: 'https://solflare.com',
        chromeUrl: 'https://chromewebstore.google.com/detail/solflare-wallet/bhhhlbepdkbapadjdcopmiegjfkbbpmd',
        appStoreUrl: 'https://apps.apple.com/app/solflare/id1580902717',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.solflare.mobile',
        deepLink: 'solflare://',
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
        appStoreUrl: 'https://apps.apple.com/app/backpack-crypto-wallet/id6444544067',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=app.backpack.mobile',
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
    defaultMobileSteps: [
      'Install the app from your app store',
      'Open the app and tap "Create new wallet"',
      'Set a password and enable biometrics',
      'Write down your recovery phrase on paper — never screenshot it',
      'Come back to goBlink and tap "Connect wallet"',
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
        appStoreUrl: 'https://apps.apple.com/app/sui-wallet-mobile/id6476572140',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.mystenlabs.suiwallet',
        detector: 'typeof window !== "undefined" && !!(window as any).suiWallet',
        description: 'The official Sui wallet by Mysten Labs.',
        users: '3M+',
        primary: true,
        mobile: true,
        mobileSetupSteps: [
          'Install Sui Wallet from your app store',
          'Open the app and tap "Create new wallet"',
          'Set a password and enable biometrics',
          'Write down your recovery phrase on paper',
          'Come back to goBlink and tap "Connect wallet"',
        ],
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
        desktopOnly: true,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
    defaultMobileSteps: [
      'Install the app from your app store',
      'Open the app and tap "Create new wallet"',
      'Set a password and enable biometrics',
      'Write down your recovery phrase on paper — never screenshot it',
      'Come back to goBlink and tap "Connect wallet"',
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
        appStoreUrl: 'https://apps.apple.com/app/petra-wallet/id6446259840',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.aptoslabs.petra.wallet',
        deepLink: 'petra://',
        detector: 'typeof window !== "undefined" && !!(window as any).petra',
        description: 'The official Aptos wallet by Aptos Labs.',
        users: '2M+',
        primary: true,
        mobile: true,
        mobileSetupSteps: [
          'Install Petra from your app store',
          'Open the app and tap "Create new wallet"',
          'Set a password and enable biometrics',
          'Write down your recovery phrase on paper',
          'Come back to goBlink and tap "Connect wallet"',
        ],
      },
      {
        name: 'Martian',
        icon: '👽',
        url: 'https://martianwallet.xyz',
        chromeUrl: 'https://chromewebstore.google.com/detail/martian-aptos-sui-wallet/efbglgofoippbgcjepnhiblaibstcloj',
        appStoreUrl: 'https://apps.apple.com/app/martian-wallet-aptos-sui/id1642744109',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=xyz.martianwallet.app',
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
    defaultMobileSteps: [
      'Install the app from your app store',
      'Open the app and tap "Create new wallet"',
      'Set a password and enable biometrics',
      'Write down your recovery phrase on paper — never screenshot it',
      'Come back to goBlink and tap "Connect wallet"',
    ],
  },

  starknet: {
    chainName: 'Starknet',
    wallets: [
      {
        name: 'Argent',
        icon: '🛡️',
        url: 'https://www.argent.xyz',
        chromeUrl: 'https://chromewebstore.google.com/detail/argent-x/dlcobpjiigpikoobohmabehhmhfoodbb',
        appStoreUrl: 'https://apps.apple.com/app/argent/id1358741926',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=im.argent.contractwalletclient',
        deepLink: 'argent://',
        detector: 'typeof window !== "undefined" && !!(window as any).starknet?.isArgent',
        description: 'The leading Starknet wallet with account abstraction.',
        users: '2M+',
        primary: true,
        mobile: true,
        mobileSetupSteps: [
          'Install Argent from your app store',
          'Open the app and tap "Create wallet"',
          'Verify your email or phone number',
          'Enable Face ID or fingerprint',
          'Your wallet is ready — no seed phrase needed (smart wallet)',
          'Come back to goBlink and tap "Connect wallet"',
        ],
      },
      {
        name: 'Braavos',
        icon: '⚔️',
        url: 'https://braavos.app',
        chromeUrl: 'https://chromewebstore.google.com/detail/braavos-smart-wallet/jnlgamecbpmbajjfhmmmlhejkemejdma',
        appStoreUrl: 'https://apps.apple.com/app/braavos-smart-wallet/id1668005545',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=app.braavos',
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
    defaultMobileSteps: [
      'Install the app from your app store',
      'Open the app and tap "Create new wallet"',
      'Set up security (password, biometrics, or email)',
      'Save your recovery phrase if prompted — write it down',
      'Come back to goBlink and tap "Connect wallet"',
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
        appStoreUrl: 'https://apps.apple.com/app/tonkeeper/id1587742107',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ton_keeper',
        deepLink: 'tonkeeper://',
        detector: 'typeof window !== "undefined" && !!(window as any).tonkeeper',
        description: 'The most popular TON wallet. Clean and simple.',
        users: '10M+',
        primary: true,
        mobile: true,
        mobileSetupSteps: [
          'Install Tonkeeper from your app store',
          'Open the app and tap "Set up wallet"',
          'Tap "Create new wallet"',
          'Write down your 24-word recovery phrase on paper',
          'Enable biometrics for quick access',
          'Come back to goBlink and tap "Connect wallet"',
        ],
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
        desktopOnly: true,
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
    defaultMobileSteps: [
      'Install the app from your app store',
      'Open the app and tap "Create new wallet"',
      'Set a password and enable biometrics',
      'Write down your recovery phrase on paper — never screenshot it',
      'Come back to goBlink and tap "Connect wallet"',
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
        appStoreUrl: 'https://apps.apple.com/app/tronlink-trx-btt-wallet/id1453530188',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.tronlinkpro.wallet',
        deepLink: 'tronlink://',
        detector: 'typeof window !== "undefined" && !!(window as any).tronWeb',
        description: 'The official Tron wallet. Simple and reliable.',
        users: '5M+',
        primary: true,
        mobile: true,
        mobileSetupSteps: [
          'Install TronLink from your app store',
          'Open the app and tap "Create wallet"',
          'Set a wallet name and password',
          'Write down your recovery phrase on paper',
          'Come back to goBlink and tap "Connect wallet"',
        ],
      },
    ],
    defaultSteps: [
      'Install the browser extension',
      'Create a new wallet and set a strong password',
      'Save your recovery phrase — write it on paper, never screenshot it',
      'Come back to goBlink and connect your new wallet',
    ],
    defaultMobileSteps: [
      'Install the app from your app store',
      'Open the app and tap "Create new wallet"',
      'Set a password and enable biometrics',
      'Write down your recovery phrase on paper — never screenshot it',
      'Come back to goBlink and tap "Connect wallet"',
    ],
  },

  // EVM chains share wallet recommendations with Ethereum
  polygon: { chainName: 'Polygon', wallets: [], defaultSteps: [], defaultMobileSteps: [] },
  arbitrum: { chainName: 'Arbitrum', wallets: [], defaultSteps: [], defaultMobileSteps: [] },
  optimism: { chainName: 'Optimism', wallets: [], defaultSteps: [], defaultMobileSteps: [] },
  base: { chainName: 'Base', wallets: [], defaultSteps: [], defaultMobileSteps: [] },
  bsc: { chainName: 'BNB Chain', wallets: [], defaultSteps: [], defaultMobileSteps: [] },
  berachain: { chainName: 'Berachain', wallets: [], defaultSteps: [], defaultMobileSteps: [] },
  monad: { chainName: 'Monad', wallets: [], defaultSteps: [], defaultMobileSteps: [] },
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
 */
export function getWalletGuide(chainId: string): ChainWalletConfig | null {
  return WALLET_GUIDES[chainId] || null;
}

/**
 * Get the primary (recommended) wallet for a chain, filtered by platform.
 */
export function getPrimaryWallet(chainId: string): WalletGuide | null {
  const config = getWalletGuide(chainId);
  if (!config) return null;
  const platformWallets = getPlatformWallets(config);
  return platformWallets.find(w => w.primary) || platformWallets[0] || null;
}

/**
 * Detect if a wallet extension is installed (desktop only).
 */
export function detectWallet(wallet: WalletGuide): boolean {
  if (isMobileDevice()) return false; // Can't detect extensions on mobile
  if (!wallet.detector) return false;
  try {
    // eslint-disable-next-line no-eval
    return !!eval(wallet.detector);
  } catch {
    return false;
  }
}
