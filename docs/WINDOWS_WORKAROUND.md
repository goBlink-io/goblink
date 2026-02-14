# Windows Installation Workaround

## Issue
`@stellar/stellar-sdk` (dependency of Solana wallet adapter) has broken postinstall script on Windows.

## Solutions

### Option 1: Skip Postinstall Scripts (Quickest)
```bash
cd apps/web
npm install --legacy-peer-deps --ignore-scripts @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
```

### Option 2: WSL2 (Recommended for Development)
```bash
# In WSL2 Ubuntu terminal
cd /mnt/d/near/sapphire/apps/web
npm install --legacy-peer-deps @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
```

### Option 3: Continue Without Solana (Phase 2.1 Deferred)
Phase 1.6 is complete. Solana can be added later when on Linux/Mac or WSL2.

## Current Status
- Phase 1.6: ✅ Complete (EVM wallets work)
- Phase 2.1: ⚠️ Windows-blocked
- Code: ✅ Ready in components
- Docs: ✅ Complete
