# Phase 2.4: Additional Chain Integrations

## Overview
Phase 2.4 adds wallet integration support for multiple additional blockchain networks beyond EVM, Solana, Sui, and NEAR. This expands Sapphire's multi-chain capabilities to cover TON, TRON, Stellar, Starknet, Bitcoin, and other important networks.

## Target Chains

### 1. TON (The Open Network)
**Wallet SDK**: TONConnect SDK  
**Status**: In Progress  
**Wallets**: Tonkeeper, MyTonWallet, OpenMask, Tonhub  
**Address Format**: TON address format (EQ... or UQ...)  
**Packages**:
- `@tonconnect/ui-react` - React UI components
- `@tonconnect/sdk` - Core TON Connect protocol

**Key Features**:
- TONConnect 2.0 protocol support
- QR code and deep link wallet connections
- Transaction signing support
- Balance queries

### 2. TRON
**Wallet SDK**: TronLink SDK / TronWeb  
**Status**: In Progress  
**Wallets**: TronLink, Ledger  
**Address Format**: Base58Check T-prefix  
**Packages**:
- `tronweb` - TRON JavaScript API

**Key Features**:
- TronLink browser extension detection
- TRC-20 token support
- TIP-191 message signing
- Transaction building and signing

### 3. Stellar
**Wallet SDK**: Freighter SDK  
**Status**: In Progress  
**Wallets**: Freighter, Albedo, LOBSTR  
**Address Format**: 56-char base32 (G-prefix for accounts)  
**Packages**:
- `@stellar/freighter-api` - Freighter wallet API
- `stellar-sdk` - Stellar JavaScript SDK

**Key Features**:
- SEP-53 authentication
- Memo support for exchanges
- Asset transfers
- Multi-signature support

### 4. Starknet
**Wallet SDK**: get-starknet / starknet.js  
**Status**: In Progress  
**Wallets**: Argent X, Braavos  
**Address Format**: 251-bit hex 0x-prefixed  
**Packages**:
- `get-starknet-core` - Wallet connection library
- `starknet` - Starknet.js SDK
- `@starknet-react/core` - React hooks (optional)

**Key Features**:
- Account abstraction support
- Cairo contract interaction
- STARK signature support
- Multi-wallet detection

### 5. Bitcoin
**Wallet SDK**: Custom adapter  
**Status**: In Progress  
**Wallets**: Xverse, Leather (Hiro), Unisat  
**Address Format**: Legacy, SegWit, Taproot  
**Packages**:
- `@unisat/wallet-sdk` - Unisat wallet integration
- `sats-connect` - Bitcoin wallet standard

**Key Features**:
- BIP-322 message signing (when available)
- PSBT support
- Multiple address format support
- Ordinals/Inscriptions awareness

### 6. XRP (Ripple)
**Wallet SDK**: Custom adapter  
**Status**: Planned  
**Wallets**: XUMM, Crossmark  
**Address Format**: Classic / X-Address  
**Packages**:
- `xrpl` - XRP Ledger JavaScript library

**Key Features**:
- Destination tag support
- X-Address format support
- Payment channels
- Multi-signature

### 7. Litecoin / Dogecoin / Bitcoin Cash
**Wallet SDK**: Custom adapters  
**Status**: Planned  
**Wallets**: Various browser extensions  
**Address Formats**: 
- Litecoin: Legacy, Bech32, Taproot
- Dogecoin: P2PKH/Legacy, P2SH
- Bitcoin Cash: Legacy P2PKH, P2SH, CashAddr

**Approach**: Similar to Bitcoin implementation with chain-specific parameters

## Implementation Strategy

### Phase 2.4.1: High-Priority Chains (Week 1)
1. **Stellar** (Freighter SDK)
   - Well-documented SDK
   - Active community
   - Good DeFi presence

2. **Starknet** (get-starknet)
   - Growing ecosystem
   - Strong developer tools
   - Cairo contract support

### Phase 2.4.2: Medium-Priority Chains (Week 2)
3. **TON** (TONConnect SDK)
   - Rapidly growing ecosystem
   - Telegram integration
   - Good documentation

4. **TRON** (TronLink SDK)
   - Large user base
   - TRC-20 token ecosystem
   - Well-established

### Phase 2.4.3: Lower-Priority Chains (Week 3)
5. **Bitcoin** (Custom adapter)
   - Complex integration
   - Multiple wallet standards
   - BIP-322 in progress

6. **XRP, Litecoin, Dogecoin, Bitcoin Cash**
   - Lower trading volume
   - Custom implementations needed
   - Deferred to Phase 2.4.4

## Technical Architecture

### Wallet Provider Structure
Each chain will follow the established pattern:

```typescript
// 1. Create chain-specific provider component
export function ChainWalletProvider({ children }: { children: ReactNode }) {
  // Wallet connection logic
  // Account management
  // Transaction signing
}

// 2. Add to Web3Provider composition
<WagmiProvider>
  <QueryClientProvider>
    {/* Existing providers */}
    <ChainWalletProvider>
      {children}
    </ChainWalletProvider>
  </QueryClientProvider>
</WagmiProvider>

// 3. Update SwapForm with connection UI
const { address, isConnected, connect } = useChainWallet();
```

### Address Detection Logic
Extend [`getConnectedAddressForChain()`](../apps/web/src/components/SwapForm.tsx) function:

```typescript
const getConnectedAddressForChain = (assetId: string) => {
  const token = tokens.find(t => t.assetId === assetId);
  const chain = token.blockchain?.toLowerCase();
  
  switch(chain) {
    case 'ton': return tonAddress;
    case 'tron': return tronAddress;
    case 'stellar': return stellarAddress;
    case 'starknet': return starknetAddress;
    case 'bitcoin': return bitcoinAddress;
    // ... etc
  }
};
```

## Installation Commands

### Stellar
```bash
npm install --workspace apps/web @stellar/freighter-api stellar-sdk
```

### Starknet
```bash
npm install --workspace apps/web get-starknet-core starknet
```

### TON
```bash
npm install --workspace apps/web @tonconnect/ui-react
```

### TRON
```bash
npm install --workspace apps/web tronweb
```

### Bitcoin
```bash
npm install --workspace apps/web sats-connect
```

## Component Files to Create

### Required New Files
1. `apps/web/src/components/StellarWalletProvider.tsx`
2. `apps/web/src/components/StarknetWalletProvider.tsx`
3. `apps/web/src/components/TonWalletProvider.tsx`
4. `apps/web/src/components/TronWalletProvider.tsx`
5. `apps/web/src/components/BitcoinWalletProvider.tsx`

### Files to Modify
1. `apps/web/src/components/Web3Provider.tsx` - Add all new providers
2. `apps/web/src/components/SwapForm.tsx` - Add wallet connection UI and address logic
3. `apps/web/package.json` - Add new dependencies
4. `package-lock.json` - Auto-updated by npm install

## Testing Strategy

### Manual Testing Checklist
For each chain:
- [ ] Wallet extension/app installation
- [ ] Wallet connection flow
- [ ] Address display and verification
- [ ] Address auto-fill for origin token
- [ ] Address auto-fill for destination token
- [ ] Multi-chain coordination (switching wallets)
- [ ] Disconnect functionality
- [ ] Error handling (no wallet, wrong network, rejected connection)

### Integration Testing
- [ ] Test swaps FROM each new chain
- [ ] Test swaps TO each new chain
- [ ] Test all chain-to-chain combinations (where supported by 1Click)
- [ ] Verify deposit address generation for each chain
- [ ] Confirm transaction submission flows

## Security Considerations

### Per-Chain Security
1. **Wallet Detection**: Ensure proper wallet extension detection without XSS vulnerabilities
2. **Address Validation**: Validate address formats before API submission
3. **Transaction Review**: Always show transaction details before signing
4. **Network Verification**: Confirm correct network (mainnet vs testnet)
5. **Signature Standards**: Use chain-appropriate signing standards (TIP-191, SEP-53, etc.)

### Multi-Chain Security
1. **Cross-Chain Validation**: Prevent address confusion between chains
2. **Clear Chain Indicators**: Always show which chain is active
3. **Disconnect All**: Provide "disconnect all wallets" functionality
4. **Session Management**: Proper cleanup on wallet disconnection

## Performance Considerations

### Bundle Size
- Each wallet SDK adds to bundle size
- Use dynamic imports where possible
- Consider code splitting by chain
- Current providers: ~700+ packages installed
- Expected addition: ~150-200 more packages

### Load Time
- Lazy-load wallet providers not in use
- Initialize only connected wallet providers
- Cache wallet detection results
- Debounce balance queries

## Known Limitations

### Current Phase Scope
Phase 2.4 focuses on **wallet connection and address management**. Full transaction signing capabilities (similar to Phases 2.1.1, 2.2.1, 2.3.1) will be added in subsequent phases:
- Phase 2.4.1: Transaction implementation for Stellar
- Phase 2.4.2: Transaction implementation for Starknet
- Phase 2.4.3: Transaction implementation for TON
- Phase 2.4.4: Transaction implementation for TRON
- Phase 2.4.5: Transaction implementation for Bitcoin

### Manual Deposit Flow
Users will initially need to:
1. Connect wallet to see their address
2. Copy the 1Click deposit address from quote
3. Manually send tokens using their wallet app
4. Submit transaction hash (optional, speeds up processing)

This matches the pattern used in earlier phases before transaction providers were added.

## Dependencies Between Chains

### Independent Integrations
Most chains can be integrated independently:
- Stellar (self-contained)
- Starknet (self-contained)
- TON (self-contained)
- TRON (self-contained)

### Shared Dependencies
- Bitcoin, Litecoin, Dogecoin, Bitcoin Cash share similar architecture
- Can reuse UTXO transaction building logic
- Address validation patterns similar

## Success Criteria

### Phase 2.4 Complete When:
- [x] Stellar wallet connection working
- [x] Starknet wallet connection working
- [x] TON wallet connection working
- [x] TRON wallet connection working
- [x] Bitcoin wallet connection working (basic)
- [x] All wallets integrated into Web3Provider
- [x] SwapForm supports all new chains
- [x] Address auto-fill working for all chains
- [x] Documentation complete
- [x] Manual testing guide created

### Future Phases Will Add:
- Transaction signing capabilities for each chain
- Balance fetching services
- Token transfer implementations
- Transaction confirmation tracking
- Enhanced UX features

## References

### Official Documentation
- **TON**: https://docs.ton.org/develop/dapps/ton-connect/overview
- **TRON**: https://developers.tron.network/docs/tronlink-integration
- **Stellar**: https://developers.stellar.org/docs/building-apps
- **Starknet**: https://www.starknetjs.com/docs/guides/connect_wallet
- **Bitcoin**: https://docs.xverse.app/sats-connect
- **Freighter**: https://github.com/stellar/freighter

### SDK Repositories
- TONConnect: https://github.com/ton-connect
- TronLink: https://github.com/tronprotocol/tronweb
- Freighter: https://github.com/stellar/freighter
- get-starknet: https://github.com/starknet-io/get-starknet
- sats-connect: https://github.com/secretkeylabs/sats-connect

---

**Status**: In Progress  
**Started**: 2026-02-14  
**Target Completion**: Phase 2.4 wallet integration by 2026-02-15
