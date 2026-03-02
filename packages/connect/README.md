# @goblink/connect

**Universal Multi-Chain Wallet Connection SDK**

One provider. One hook. 9 blockchain ecosystems. 350+ wallets.

---

## The Problem

Connecting wallets across multiple chains requires stitching together 7+ separate SDKs, each with different APIs, state shapes, React providers, and connection flows. The result is a 7-layer provider pyramid and ~500 lines of glue code.

## The Solution

```tsx
// Before: 7 nested providers
<WagmiProvider>
  <QueryClientProvider>
    <SuiClientProvider>
      <SuiWalletProvider>
        <AptosWalletAdapterProvider>
          <StarknetConfig>
            <TonConnectUIProvider>
              <TronWalletProvider>
                <App />
              </TronWalletProvider>
            </TonConnectUIProvider>
          </StarknetConfig>
        </AptosWalletAdapterProvider>
      </SuiWalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>
</WagmiProvider>

// After: one provider
<BlinkConnectProvider config={{ projectId: 'xxx' }}>
  <App />
</BlinkConnectProvider>
```

## Quick Start

### 1. Install

```bash
npm install @goblink/connect

# Required peer deps
npm install react react-dom @reown/appkit @reown/appkit-adapter-wagmi @reown/appkit-adapter-solana wagmi viem @tanstack/react-query

# Optional — install only the chains you need
npm install @mysten/dapp-kit           # Sui
npm install @aptos-labs/wallet-adapter-react  # Aptos
npm install @starknet-react/core @starknet-react/chains  # Starknet
npm install @tonconnect/ui-react       # TON
npm install @tronweb3/tronwallet-adapter-react-hooks @tronweb3/tronwallet-adapters  # TRON
npm install @hot-labs/near-connect     # NEAR
```

### 2. Wrap Your App

```tsx
import { BlinkConnectProvider } from '@goblink/connect/react';

function App() {
  return (
    <BlinkConnectProvider config={{ projectId: 'your-walletconnect-id' }}>
      <YourApp />
    </BlinkConnectProvider>
  );
}
```

### 3. Use the Hook

```tsx
import { useWallet, ConnectButton, ConnectModal } from '@goblink/connect/react';

function Navbar() {
  const { wallets, address, isConnected, connect, disconnect } = useWallet();

  return (
    <nav>
      <ConnectButton />
      <ConnectModal />
    </nav>
  );
}
```

## API Reference

### Hooks

#### `useWallet()`

Primary hook for wallet interaction.

```tsx
const {
  wallets,          // ConnectedWallet[] — all connected wallets
  address,          // string | null — primary wallet address
  chain,            // ChainType | null — primary wallet chain
  isConnected,      // boolean — whether any wallet is connected
  connectedCount,   // number — count of connected wallets
  connect,          // (chain?: ChainType) => Promise<void>
  disconnect,       // (chain?: ChainType) => Promise<void>
  getAddress,       // (chain: ChainType) => string | null
  isChainConnected, // (chain: ChainType) => boolean
  switchChain,      // (chain: ChainType) => Promise<void>
} = useWallet();
```

#### `useConnect()`

Connection management (modal, connect, disconnect).

```tsx
const {
  openModal,        // () => void
  closeModal,       // () => void
  isModalOpen,      // boolean
  connectChain,     // (chain: ChainType) => Promise<void>
  disconnectChain,  // (chain: ChainType) => Promise<void>
  disconnectAll,    // () => Promise<void>
} = useConnect();
```

#### `useBalance(chain?, refreshInterval?)`

Balance hook with auto-refresh.

```tsx
const {
  balance,    // string | null
  symbol,     // string | null
  isLoading,  // boolean
  error,      // Error | null
  refetch,    // () => void
} = useBalance('evm', 30000);
```

#### `useSign()`

Sign messages and transactions.

```tsx
const { signMessage, signTransaction } = useSign();
const sig = await signMessage("Hello!");
const txHash = await signTransaction({ to: '0x...', value: '0.1' });
```

### Components

#### `<ConnectButton />`

Drop-in button that shows "Connect Wallet" or the connected address.

```tsx
<ConnectButton />
<ConnectButton label="Sign In" showChainIcon={true} theme="dark" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | `"Connect Wallet"` | Button text when disconnected |
| `showChainIcon` | `boolean` | `true` | Show chain icon when connected |
| `theme` | `'light' \| 'dark'` | from config | Theme override |
| `className` | `string` | — | Custom CSS class |
| `style` | `CSSProperties` | — | Custom inline styles |

#### `<ConnectModal />`

Pre-built modal with chain selector grid and per-chain wallet connection.

```tsx
<ConnectModal />
<ConnectModal chains={['evm', 'solana', 'sui']} theme="dark" accentColor="#2563eb" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `chains` | `ChainType[]` | all | Limit visible chains |
| `theme` | `'light' \| 'dark'` | from config | Theme override |
| `accentColor` | `string` | `#3b82f6` | Accent color |
| `logo` | `string` | — | App logo URL |
| `className` | `string` | — | Custom CSS class |

### Configuration

```tsx
<BlinkConnectProvider config={{
  // Required
  projectId: 'your-walletconnect-project-id',

  // Optional
  chains: ['evm', 'solana', 'sui'],     // Enable specific chains (default: all)
  theme: 'dark',                          // 'light' | 'dark' | 'auto'
  appName: 'My App',                      // Shown in wallet prompts
  appIcon: 'https://myapp.com/icon.png',  // App icon URL
  appUrl: 'https://myapp.com',            // App URL

  // Chain-specific
  evmChains: [customChain],              // Custom EVM chains
  nearNetwork: 'mainnet',                 // 'mainnet' | 'testnet'
  suiNetwork: 'mainnet',                  // 'mainnet' | 'testnet' | 'devnet'
  tonManifestUrl: '/tonconnect-manifest.json',

  // Features
  features: {
    multiConnect: true,                   // Multiple chains simultaneously
    persistSession: true,                 // Remember connections
    socialLogin: true,                    // Email/social via AppKit
    analytics: false,                     // Usage analytics
  },

  // Callbacks
  onConnect: (wallet) => console.log('Connected:', wallet),
  onDisconnect: (chain) => console.log('Disconnected:', chain),
  onError: (error, chain) => console.error(chain, error),
}}>
```

## Supported Chains

| Chain | Adapter | Wallets | Social Login |
|---|---|---|---|
| **EVM** (15 chains) | ReOwn AppKit | 350+ (MetaMask, Coinbase, Rainbow, etc.) | Google, Apple, Discord, X, GitHub |
| **Solana** | ReOwn AppKit | Phantom, Solflare, Backpack, etc. | Same as EVM |
| **Bitcoin** | ReOwn AppKit | Xverse, Leather, UniSat, etc. | Same as EVM |
| **Sui** | @mysten/dapp-kit | Sui Wallet, Suiet, Ethos, etc. | — |
| **NEAR** | @hot-labs/near-connect | HOT Wallet, NEAR Wallet, MyNearWallet | — |
| **Aptos** | @aptos-labs/wallet-adapter | Petra, Martian, Pontem | — |
| **Starknet** | @starknet-react/core | Argent X, Braavos | — |
| **TON** | @tonconnect/ui | Tonkeeper, TON Wallet, OpenMask | — |
| **TRON** | @tronweb3/tronwallet-adapter | TronLink | — |

### EVM Networks

Ethereum, Polygon, Optimism, Arbitrum, Base, BNB Chain, Avalanche, Gnosis, Berachain, Monad, Aurora, Plasma, X Layer, ADI Chain, Sepolia (testnet).

## Comparison

| Feature | BlinkConnect | RainbowKit | ConnectKit | AppKit |
|---|---|---|---|---|
| EVM | Yes | Yes | Yes | Yes |
| Solana | Yes | — | — | Yes |
| Bitcoin | Yes | — | — | Yes |
| Sui | Yes | — | — | — |
| NEAR | Yes | — | — | — |
| Aptos | Yes | — | — | — |
| Starknet | Yes | — | — | — |
| TON | Yes | — | — | — |
| TRON | Yes | — | — | — |
| Multi-connect | Yes | — | — | Partial |
| Social login | Yes | — | — | Yes |
| Single provider | Yes | Yes | Yes | 2 providers |

## Tree-Shaking

Only bundle the chains you use:

```tsx
// Full — all 9 ecosystems
import { BlinkConnectProvider, ConnectModal, ConnectButton, useWallet } from '@goblink/connect/react';

// Individual adapters for custom setups
import { useEvmAdapter } from '@goblink/connect/adapters/evm';
import { useSuiAdapter } from '@goblink/connect/adapters/sui';

// Limit chains in config to skip unused provider layers
<BlinkConnectProvider config={{ projectId: 'xxx', chains: ['evm', 'solana'] }}>
```

Peer dependencies you don't install are automatically skipped.

## Vanilla JS (Non-React)

```ts
import { BlinkConnect } from '@goblink/connect/vanilla';

const client = new BlinkConnect({ projectId: 'xxx' });

client.on('connect', (wallet) => {
  console.log('Connected:', wallet.chain, wallet.address);
});

client.on('disconnect', (chain) => {
  console.log('Disconnected:', chain);
});
```

## Utilities

```ts
import { formatAddress, validateAddress, getChainMeta, getExplorerTxUrl } from '@goblink/connect';

formatAddress('0x1234...abcd');           // '0x1234…abcd'
validateAddress('evm', '0x...');          // true/false
getChainMeta('solana');                   // { name: 'Solana', symbol: 'SOL', ... }
getExplorerTxUrl('evm', '0x...');         // 'https://etherscan.io/tx/0x...'
```

## Types

```ts
type ChainType = 'evm' | 'solana' | 'sui' | 'near' | 'bitcoin' | 'aptos' | 'starknet' | 'ton' | 'tron';

interface ConnectedWallet {
  chain: ChainType;
  address: string;
}
```

## License

MIT
