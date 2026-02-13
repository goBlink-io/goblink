# Sapphire

> Cross-chain swap orchestration platform powered by NEAR Intents 1Click API

**Status:** Phase 1 - MVP Development in Progress

---

## Overview

Sapphire eliminates the friction of cross-chain token swaps by providing a simple, single-interface experience powered by NEAR Intents. Users connect their wallet, select source/destination tokens, and send — no need to understand deposit addresses, manage gas on multiple chains, or navigate complex multi-step workflows.

**Key Features:**
- ✅ Single-page swap interface
- ✅ Multi-chain wallet support (EVM, Solana, NEAR, SUI, and more)
- ✅ Automatic refunds on failed swaps
- ✅ Configurable fee structure with tiered pricing support
- ✅ No custody of user funds

---

## Architecture

```
sapphire/
├── apps/
│   ├── web/          # Next.js frontend (Phase 1.4 - Pending)
│   └── api/          # Express backend (Phase 1.2 - In Progress)
│       ├── src/
│       │   ├── services/
│       │   │   ├── oneclick.ts    # 1Click SDK wrapper
│       │   │   └── fees.ts        # Fee calculation logic
│       │   ├── routes/
│       │   │   └── swap.ts        # API routes: /tokens, /quote, /deposit/submit, /status
│       │   ├── middleware/
│       │   │   └── validation.ts  # Request validation
│       │   └── index.ts           # Express app entry point
│       └── db/                     # Database schemas (Phase 1.3 - Pending)
└── packages/
    └── shared/        # Shared TypeScript types
```

---

## Current Status

### ✅ Completed
- **Phase 1.1: Project Scaffolding**
  - Turborepo monorepo setup
  - TypeScript configuration
  - Prettier & ESLint setup
  - Environment configuration (`.env.example`)

- **Phase 1.2: Backend API Server** ✅
  - Express server running at http://localhost:3001
  - 1Click SDK integration working
  - API routes tested and functional:
    - `GET /health` - Server health check
    - `GET /api/tokens` - Get supported tokens (119+ tokens across 20+ chains)
    - `POST /api/quote` - Request swap quote with fee calculation (tested successfully)
    - `POST /api/deposit/submit` - Submit deposit tx hash
    - `GET /api/status/:depositAddress` - Check swap status
  - Fee calculation service with tiered pricing support
  - Request validation middleware
  - See [API Testing Guide](docs/API_TESTING.md) for examples

### 🚧 Next Steps
- **Phase 1.3: Database Setup**
  - PostgreSQL schema for transactions
  - Redis cache for tokens and status
  
- **Phase 1.4: Frontend Core UI**
  - Next.js app with swap form
  - Quote preview display
  - Transaction status tracker

- **Phase 1.5: EVM Wallet Integration**
  - wagmi + RainbowKit setup
  - MetaMask, Rabby, WalletConnect support

- **Phase 1.6: End-to-End Testing**
  - Complete swap flow testing
  - Error handling verification

---

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- PostgreSQL (for Phase 1.3+)
- Redis (for Phase 1.3+)
- 1Click API key from [Partners Portal](https://partners.near-intents.org)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your 1Click API key
   ```

3. **Build shared package:**
   ```bash
   npm run build --filter=@sapphire/shared
   ```

4. **Run backend API (development):**
   ```bash
   npm run dev:api
   ```

   The API server will start at `http://localhost:3001`

5. **Test the health endpoint:**
   ```bash
   curl http://localhost:3001/health
   ```

---

## Environment Variables

See [`.env.example`](.env.example) for all available configuration options.

**Key variables:**
- `ONE_CLICK_JWT` - Your 1Click API key (required)
- `APP_FEE_BPS` - Your fee in basis points (default: 50 = 0.5%)
- `APP_FEE_RECIPIENT` - NEAR account for fee collection
- `FEE_TIERS` - Optional JSON array for tiered pricing
- `DATABASE_URL` - PostgreSQL connection string (Phase 1.3+)
- `REDIS_URL` - Redis connection string (Phase 1.3+)

---

## API Endpoints

### `GET /api/tokens`
Returns list of all supported tokens across chains.

### `POST /api/quote`
Request a swap quote.

**Request body:**
```json
{
  "dry": true,
  "originAsset": "nep141:wrap.near",
  "destinationAsset": "nep141:usdc.near",
  "amount": "1000000000000000000",
  "recipient": "0x...",
  "refundTo": "0x...",
  "swapType": "EXACT_INPUT",
  "slippageTolerance": 100
}
```

**Response:**
```json
{
  "quoteId": "...",
  "depositAddress": "0x...",
  "amountIn": "1000000000000000000",
  "amountOut": "...",
  "feeAmount": "...",
  "estimatedTimeMs": 180000
}
```

### `POST /api/deposit/submit`
Submit deposit transaction hash to speed up processing.

**Request body:**
```json
{
  "txHash": "0x..."
}
```

### `GET /api/status/:depositAddress`
Check the status of a swap.

**Response:**
```json
{
  "status": "PROCESSING",
  "depositAddress": "0x...",
  "txHash": "0x...",
  "updatedAt": "2026-02-13T06:00:00.000Z"
}
```

---

## Fee Structure

Sapphire charges a configurable fee on all swaps:

- **Default:** 0.5% (50 basis points)
- **Collected in:** Input token (what the user is swapping from)
- **Destination:** NEAR Intents account specified in `APP_FEE_RECIPIENT`

### Tiered Pricing (Optional)

Set the `FEE_TIERS` environment variable to enable amount-based pricing:

```bash
FEE_TIERS='[{"maxAmountUsd": 1000, "bps": 75}, {"maxAmountUsd": 10000, "bps": 50}, {"maxAmountUsd": null, "bps": 30}]'
```

This example charges:
- 0.75% for swaps under $1,000
- 0.50% for swaps between $1,000-$10,000
- 0.30% for swaps above $10,000

---

## Development Scripts

```bash
# Run all apps in dev mode
npm run dev

# Run specific app
npm run dev:api
npm run dev:web

# Build all apps
npm run build

# Build specific app
npm run build:api
npm run build:web

# Lint
npm run lint

# Clean build artifacts
npm run clean
```

---

## Documentation

- [Architecture Plan](./plans/sapphire-architecture.md)
- [NEAR Intents Documentation](https://docs.near-intents.org/near-intents)
- [1Click API Docs](https://docs.near-intents.org/near-intents)
- [Partners Portal](https://partners.near-intents.org)

---

## License

Private - All Rights Reserved
