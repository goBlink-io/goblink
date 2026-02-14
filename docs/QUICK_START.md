# Quick Start Guide

## Fresh Installation

```bash
# 1. Clone/navigate to project
cd d:/near/sapphire

# 2. Remove packageManager restriction (already done)
# package.json no longer enforces npm

# 3. Install with npm (use legacy peer deps to avoid conflicts)
npm install --legacy-peer-deps

# 4. Install Solana packages
cd apps/web
npm install --legacy-peer-deps @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets

# 5. Setup environment
cp .env.example .env
# Edit .env and add ONE_CLICK_JWT

# 6. Start development
npm run dev:api  # Terminal 1
npm run dev:web  # Terminal 2
```

Everything will work with npm. The `--legacy-peer-deps` flag bypasses peer dependency conflicts that Solana packages have with React 18.
