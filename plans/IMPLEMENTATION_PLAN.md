# Sapphire — Implementation Plan

> **Date:** 2026-02-17
> **Author:** Morpheus
> **Status:** Draft — Awaiting Urban's Review

---

## Overview

Convert to pnpm, merge the Express backend into Next.js API routes, deploy to Vercel (auto-deploy from GitHub), use Supabase for Postgres. Then complete EVM signing and fix all identified issues.

**Architecture:**
```
[User] → [Vercel] → [Next.js Frontend + API Routes]
                          ↓
                     [Supabase Postgres]
                          ↓
                     [1Click API / RPCs / DexScreener / Blockvision]
```

One repo. One deployment. One bill.

---

## Phase 0: Package Manager Migration (Yarn 4 → pnpm)
**Priority:** 🔴 Do First — Blocks Everything
**Effort:** 30-60 min

### Steps
1. Delete Yarn artifacts: `.yarn/`, `.yarnrc.yml`, `yarn.lock`
2. Remove `packageManager` field from root `package.json`
3. Create `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```
4. Add `.npmrc` if needed:
   ```
   shamefully-hoist=true
   strict-peer-dependencies=false
   ```
5. Run `pnpm install` — generates `pnpm-lock.yaml`
6. Add `"packageManager": "pnpm@9.15.0"` to root `package.json`
7. Verify: `pnpm build`
8. Update `.gitignore`, docs
9. Commit + push

---

## Phase 1: Merge Express API into Next.js API Routes
**Priority:** 🔴 Critical — Eliminates Separate Backend
**Effort:** 3-4 hours

### Why
- No Railway needed — one Vercel deployment handles everything
- No CORS issues — same domain
- API keys stay server-side in route handlers
- Simpler architecture, fewer moving parts

### 1.1 Move Service Files
Backend services move into the Next.js app as server-only modules:

```
apps/api/src/services/oneclick.ts       → apps/web/src/lib/server/oneclick.ts
apps/api/src/services/fees.ts           → apps/web/src/lib/server/fees.ts
apps/api/src/services/evm.ts            → apps/web/src/lib/server/evm.ts
apps/api/src/services/sui.ts            → apps/web/src/lib/server/sui.ts
apps/api/src/services/dexscreener.ts    → apps/web/src/lib/server/dexscreener.ts
apps/api/src/services/intentsExplorer.ts → apps/web/src/lib/server/intentsExplorer.ts
apps/api/src/services/cache.ts          → apps/web/src/lib/server/cache.ts
apps/api/src/services/transactions.ts   → apps/web/src/lib/server/transactions.ts
apps/api/src/data/token-icons.json      → apps/web/src/lib/server/token-icons.json
apps/api/src/middleware/validation.ts    → apps/web/src/lib/server/validation.ts
```

Add `import 'server-only'` at the top of each to prevent accidental client-side import.

### 1.2 Create Next.js API Route Handlers
Each Express route becomes a Next.js route handler:

```
apps/web/src/app/api/tokens/route.ts              ← GET /api/tokens
apps/web/src/app/api/quote/route.ts                ← POST /api/quote
apps/web/src/app/api/deposit/submit/route.ts       ← POST /api/deposit/submit
apps/web/src/app/api/status/[address]/route.ts     ← GET /api/status/:address
apps/web/src/app/api/balances/near/[accountId]/route.ts
apps/web/src/app/api/balances/near-token/[accountId]/route.ts
apps/web/src/app/api/balances/sui/[address]/route.ts
apps/web/src/app/api/balances/sui-token/[address]/route.ts
apps/web/src/app/api/balances/sui-tokens/[address]/route.ts
apps/web/src/app/api/balances/sui-coins/[address]/route.ts
apps/web/src/app/api/balances/solana/[address]/route.ts
apps/web/src/app/api/balances/solana-blockhash/route.ts
apps/web/src/app/api/balances/solana-rpc/route.ts
apps/web/src/app/api/balances/evm/[chain]/[address]/route.ts
apps/web/src/app/api/balances/evm-token/[chain]/[address]/route.ts
apps/web/src/app/api/health/route.ts
```

**Pattern for each route handler:**
```typescript
// apps/web/src/app/api/tokens/route.ts
import { NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';

export async function GET() {
  try {
    const tokens = await oneclick.getTokens();
    // ... same normalization logic from Express route ...
    return NextResponse.json(allTokens);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch tokens', message: error.message },
      { status: 500 }
    );
  }
}
```

### 1.3 Caching Strategy (Replace Redis)
Use Next.js built-in caching instead of Redis:

```typescript
// Token list: cache for 5 minutes
export async function GET() {
  const tokens = await fetch('https://1click.chaindefuser.com/v0/tokens', {
    next: { revalidate: 300 } // 5 min cache
  });
  // ...
}
```

For custom caching (prices, balances):
```typescript
import { unstable_cache } from 'next/cache';

const getCachedPrices = unstable_cache(
  async (tokenAddress: string) => {
    return await dexscreener.getTokenPrice(chainId, tokenAddress);
  },
  ['token-prices'],
  { revalidate: 120 } // 2 min cache
);
```

If we outgrow this later, Upstash Redis (serverless, free tier, works on Vercel) plugs in with zero infra changes.

### 1.4 Update Frontend API Calls
Create shared API client:

```typescript
// apps/web/src/lib/api.ts
const API_BASE = '/api'; // Same domain now, no CORS

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }
  return response.json();
}
```

Replace all `fetch('http://localhost:3001/api/...')` and `fetch(\`${API_URL}/api/...\`)` with `apiFetch('/tokens')` etc.

### 1.5 Move Backend Dependencies to Web
Add to `apps/web/package.json`:
```
@defuse-protocol/one-click-sdk-typescript
axios
pg (or @supabase/supabase-js)
viem (already there)
near-api-js (already there)
```

Remove from root: `apps/api/` entirely (after migration is verified).

### 1.6 Environment Variables
Server-side env vars (no `NEXT_PUBLIC_` prefix) stay private in Vercel:
```
ONE_CLICK_JWT
INTENTS_EXPLORER_JWT
APP_FEE_BPS
APP_FEE_RECIPIENT
BLOCKVISION_API_KEY
SOLANA_RPC_URL
NEAR_RPC_URL
SUPABASE_URL
SUPABASE_SERVICE_KEY
```

Client-side (prefixed):
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
NEXT_PUBLIC_NEAR_NETWORK_ID
NEXT_PUBLIC_MONAD_RPC_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

No more `CORS_ORIGIN`, `API_PORT`, `NEXT_PUBLIC_API_URL` — all eliminated.

---

## Phase 2: Supabase + Vercel Deployment
**Priority:** 🔴 Critical — Live Testing Environment
**Effort:** 1-2 hours

### 2.1 Supabase Setup
1. Create Supabase project (or use existing)
2. Run schema migration:
   ```sql
   -- From apps/api/src/db/schema.sql
   CREATE TABLE transactions (...)
   CREATE TABLE status_history (...)
   ```
3. Install Supabase client:
   ```bash
   pnpm add @supabase/supabase-js --filter @sapphire/web
   ```
4. Create `apps/web/src/lib/server/db.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   
   export const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_KEY! // Server-side only, full access
   );
   ```

### 2.2 Vercel Auto-Deploy
1. Connect `Urban-Blazer/sapphire` repo in Vercel dashboard
2. Configure:
   - **Root directory:** `apps/web`
   - **Build command:** `cd ../.. && pnpm install && pnpm build:web`
   - **Install command:** `corepack enable && pnpm install`
   - **Output directory:** `.next`
3. Set environment variables in Vercel project settings
4. Push to `main` → auto deploys to production
5. PRs → preview deploys (unique URL per PR)

### 2.3 Vercel Config
Add `vercel.json` in repo root:
```json
{
  "buildCommand": "pnpm build:web",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "outputDirectory": "apps/web/.next"
}
```

### 2.4 Post-Deploy Verification
- Hit `/api/health` → confirm API routes work
- Hit `/api/tokens` → confirm 1Click integration
- Test wallet connection on live URL
- Test quote flow end-to-end

---

## Phase 3: Config & Code Cleanup
**Priority:** 🟡 Important — Quality & Maintainability
**Effort:** 1-2 hours

### 3.1 Centralize Chain Definitions
Move to `packages/shared/src/chains.ts`:
- `SUPPORTED_CHAINS` — single source of truth
- `EVM_CHAINS` with id, name, nativeCurrency, rpcUrls, explorer
- `NATIVE_TOKEN_SYMBOLS`
- Helper functions: `isEvmChain()`, `isNativeToken()`, `getExplorerTxUrl()`

Both frontend components and API routes import from `@sapphire/shared`.

Delete duplicates in: `apps/web/src/lib/chains.ts`, `apps/api/src/services/evm.ts` (chain defs), `SwapForm.tsx` (SUPPORTED_CHAINS), `Web3Provider.tsx` (berachain/monad defs).

### 3.2 Update Shared Types
Add to `packages/shared/src/index.ts`:
```typescript
export interface Token {
  // ... existing fields ...
  defuseAssetId?: string; // NEP-141 equivalent for cross-chain tokens
}
```

### 3.3 Replace alert() with Error UI
**Files:** `SwapForm.tsx`, `ConnectWalletModal.tsx`

Use the existing error banner pattern from `page.tsx` — set error state, render inline.

### 3.4 Remove apps/api
After migration is verified and deployed:
1. Remove `apps/api/` directory
2. Remove api-specific deps from root
3. Update `turbo.json` to remove `dev:api`, `build:api` tasks
4. Update root `package.json` scripts

---

## Phase 4: Complete EVM Transaction Signing
**Priority:** 🔴 Critical — Biggest User Base
**Effort:** 3-4 hours

### Understanding the Flow
All tokens are NEAR-wrapped (NEP-141). When swapping from EVM:
1. User selects ETH on Base → USDC on Solana
2. Quote request uses `defuseAssetId` (NEP-141 format) for the 1Click API
3. 1Click returns a **deposit address on Base** (the source chain)
4. App triggers MetaMask/Rabby to send ETH to that Base address
5. User signs → funds sent → 1Click handles the cross-chain swap

**No `approve()` needed** — we're pushing tokens via `transfer()`, not having a contract pull them.

### 4.1 Wire EVM in QuotePreview
Add EVM block to `handleConfirmSwap()` in `QuotePreview.tsx`:

```typescript
import { useWalletClient, useSwitchChain } from 'wagmi';
import { isEvmChain, isNativeToken, EVM_CHAINS } from '@sapphire/shared';

const { data: walletClient } = useWalletClient();
const { switchChainAsync } = useSwitchChain();

// In handleConfirmSwap, after getting deposit address:
if (isEvmChain(originChain)) {
  try {
    if (!walletClient) throw new Error('Please connect your EVM wallet first');
    
    // Ensure wallet is on the correct chain
    const requiredChainId = EVM_CHAINS[originChain]?.id;
    if (walletClient.chain.id !== requiredChainId) {
      setConfirmationStep('Switching network...');
      await switchChainAsync({ chainId: requiredChainId });
    }
    
    setConfirmationStep('Please approve the transaction in your wallet...');
    
    const isNative = isNativeToken(originTokenMetadata?.symbol);
    
    let txHash: string;
    if (isNative) {
      txHash = await walletClient.sendTransaction({
        to: receivedDepositAddress as `0x${string}`,
        value: BigInt(quoteRequest.amount),
      });
    } else {
      // ERC-20 transfer
      txHash = await walletClient.writeContract({
        address: originTokenMetadata.contractAddress as `0x${string}`,
        abi: [{
          name: 'transfer',
          type: 'function',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ type: 'bool' }],
        }],
        functionName: 'transfer',
        args: [receivedDepositAddress as `0x${string}`, BigInt(quoteRequest.amount)],
      });
    }
    
    setConfirmationStep('Transaction sent! Tracking status...');
    onSwapInitiated(receivedDepositAddress, txHash);
  } catch (txError: any) {
    setShowDepositInfo(true);
    setConfirmationStep('');
    setError(txError.message || 'Transaction cancelled.');
  }
}
```

This uses **viem/wagmi directly** — no ethers dependency needed.

### 4.2 Refactor transactions.ts
Update `sendEvmTransaction` to accept wagmi's `walletClient` instead of ethers provider. Or better yet, since the logic is now inline in QuotePreview (simple enough), we can simplify `transactions.ts` to just handle NEAR and Sui (which have more complex setup), and do EVM inline.

### 4.3 Use defuseAssetId for Quotes
In `SwapForm.tsx`, when building the quote request:
```typescript
const effectiveOriginAsset = originToken.defuseAssetId || originToken.assetId;
const effectiveDestAsset = destinationToken.defuseAssetId || destinationToken.assetId;
```

This eliminates the need for `NATIVE_TO_NEP141_MAP` in the backend. The frontend already has the mapping from the `/api/tokens` response.

---

## Phase 5: API Performance
**Priority:** 🟡 Important
**Effort:** 2-3 hours

### 5.1 Async Token Pricing
Return tokens immediately, prices separately:
```
GET /api/tokens        → Tokens with icons (fast, cached 5 min)
GET /api/tokens/prices → Pricing data (cached 2 min, fetched async)
```

Frontend loads tokens first, prices fill in after.

### 5.2 Next.js Caching
- Token list: `revalidate: 300` (5 min)
- Prices: `revalidate: 120` (2 min)
- Balances: no cache (real-time)

### 5.3 Rate Limiting
Use Vercel's built-in rate limiting (vercel.json):
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-RateLimit-Limit", "value": "60" }
      ]
    }
  ]
}
```

Or add middleware-based limiting with Upstash if needed.

---

## Phase 6: UX Polish
**Priority:** 🟢 Nice to Have
**Effort:** 2-3 hours

1. **Loading skeletons** for token list and balances
2. **Toast notifications** instead of alert() for non-critical errors
3. **Mobile responsiveness** — test wallet flows on mobile
4. **Transaction history** — localStorage for recent swaps
5. **Better token selector** — search/filter, show balances inline

---

## Phase 7: Partners Portal & Revenue
**Priority:** 🟡 Important — Revenue Impact
**Effort:** 1 hour

1. Register at [partners.near-intents.org](https://partners.near-intents.org/)
   - JWT for 1Click API (saves 0.1% protocol fee per swap)
   - JWT for Intents Explorer (transaction tracking)
2. Create fee recipient NEAR account
3. Configure tiered fees: 75/50/30 bps
4. Set `APP_FEE_RECIPIENT` and `ONE_CLICK_JWT` in Vercel env vars

---

## Execution Order

```
Phase 0: pnpm migration                           [30 min]
    ↓
Phase 1: Merge Express → Next.js API routes        [3-4 hrs]
    ↓
Phase 2: Supabase + Vercel auto-deploy             [1-2 hrs]
    ↓
Phase 3: Code cleanup (shared chains, types, UI)   [1-2 hrs]
    ↓
Phase 4: EVM transaction signing                   [3-4 hrs]
    ↓
Phase 5: Performance (caching, async pricing)      [2-3 hrs]
    ↓
Phase 6: UX polish                                 [2-3 hrs]
    ↓
Phase 7: Partners Portal + fees                    [1 hr]
```

**Total estimated: ~15-20 hours of work**

Phases 3+4 can run in parallel. Phase 7 can happen anytime (just registration + env vars).

---

## Dependency Map

| Package | Purpose | Layer |
|---------|---------|-------|
| **Core** | | |
| `next@16` | Framework (frontend + API routes) | Both |
| `react@19` / `react-dom@19` | UI | Client |
| `tailwindcss@3` | Styling | Client |
| `typescript@5` | Type safety | Both |
| `turbo@2` | Monorepo builds | Build |
| **Wallet Connections** | | |
| `wagmi@3` / `viem@2` | EVM wallets + transactions | Client |
| `@reown/appkit@1.8` | Multi-chain wallet modal | Client |
| `@reown/appkit-adapter-wagmi@1.8` | EVM adapter | Client |
| `@reown/appkit-adapter-solana@1.8` | Solana adapter | Client |
| `@mysten/dapp-kit@1` / `@mysten/sui@2` | Sui wallets + transactions | Client |
| `@hot-labs/near-connect@0.9` | NEAR wallet selector | Client |
| `near-api-js@5` (web) / `@4` (api) | NEAR SDK | Both |
| `@solana/web3.js@1` | Solana transactions | Client |
| `@tanstack/react-query@5` | Data fetching/caching | Client |
| **Backend Services (now in API routes)** | | |
| `@defuse-protocol/one-click-sdk-typescript@0.1` | 1Click Swap API | Server |
| `viem@2` | EVM RPC balance queries | Server |
| `axios@1` | HTTP client (Sui, Solana RPC, DexScreener) | Server |
| `@supabase/supabase-js` | Postgres (replaces pg + redis) | Server |
| **UI** | | |
| `clsx@2` / `tailwind-merge@2` | Conditional classes | Client |
| `lucide-react@0.300` | Icons | Client |

### What Gets Removed
- `express`, `cors`, `dotenv` — no standalone server
- `pg` — replaced by Supabase client
- `redis` — replaced by Next.js caching
- `ts-node-dev` — no Express dev server
- `@types/express`, `@types/cors`, `@types/pg` — associated types
- `apps/api/` directory — entire backend folder

### near-api-js Version Mismatch
Frontend uses `near-api-js@5`, backend used `@4`. After merge, consolidate to `@5` (already in web's package.json). Check for any breaking API changes in the server-side NEAR RPC calls.

---

## Questions for Urban

1. **Supabase project** — Do you have an existing one, or should we create new?

2. **Vercel** — I'll set up the GitHub auto-deploy. Do you have a Vercel account linked to the `Urban-Blazer` GitHub org?

3. **Domain** — Use `.vercel.app` for now, or do you have a domain ready?

4. **WalletConnect Project ID** — Do you have one from [cloud.reown.com](https://cloud.reown.com)?

5. **Blockvision API Key** — Do you have one for Sui balances?

6. **Partners Portal** — Registered at [partners.near-intents.org](https://partners.near-intents.org/) yet?

---

*Each phase gets a commit + push. Vercel auto-deploys on push to main.*
