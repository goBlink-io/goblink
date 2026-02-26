# goBlink Telegram Bot — Development Plan

## Overview

A Telegram bot (`@goBlinkBot`) that lets users do cross-chain token transfers directly in Telegram chats — no website needed. Same 1Click API backend, same 26 chains, same 65+ tokens, same fee structure.

**Key difference from web app:** No browser wallets. Users send tokens to a deposit address. This is actually simpler — the 1Click API already returns deposit addresses. The bot just needs to guide users through the flow and monitor transaction status.

**Subdomain:** `tgbot.goblink.io` (namespaced for future bots — Discord bot, etc.)

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Telegram    │────▶│  goBlink Bot      │────▶│  1Click API     │
│  Users       │◀────│  (Node.js/TS)     │◀────│  (NEAR Intents) │
└─────────────┘     └────────┬─────────┘     └─────────────────┘
                             │
                    ┌────────┴─────────┐
                    │   Supabase       │
                    │  (users, txns,   │
                    │   address book)  │
                    └──────────────────┘
```

### Why a Separate Service (Not in the Next.js App)

1. Telegram bots need a long-running process (webhook receiver or polling) — doesn't fit Vercel's serverless model
2. Bot logic (conversation state machines, inline keyboards) is fundamentally different from web UI
3. Independent scaling and deployment
4. Consumes `@goblink/sdk` — the same SDK that third parties and future bots will use

---

## New GitHub Repo

**Repo:** `github.com/Urban-Blazer/goblink-telegram`

**Why separate repo (not monorepo app):**
- Different deployment target (VPS vs Vercel)
- Different runtime (long-running Node.js vs serverless)
- Different release cycle
- Keeps the web monorepo clean

**Shared code:** Consumes `@goblink/sdk` (see SDK section below).

---

## Tech Stack

| Component | Choice | Why |
|---|---|---|
| Runtime | Node.js + TypeScript | Same language as web app, shared types |
| Bot framework | [grammY](https://grammy.dev/) | Modern, TypeScript-first, great middleware, built-in session/conversation plugins |
| Database | Supabase (same instance) | New tables in existing project, shared user data |
| Hosting | shade-bot VPS (existing server) | Long-running process, no extra cost |
| Process manager | PM2 or systemd | Auto-restart, logs |
| Webhook | Caddy/nginx reverse proxy | HTTPS termination for Telegram webhook |

### Why grammY over alternatives
- **telegraf:** Older, less maintained, weaker TS types
- **node-telegram-bot-api:** Too low-level, no conversation management
- **grammY:** Active development, first-class TypeScript, conversation plugin handles multi-step flows perfectly, 30K+ GitHub stars

---

## User Flow

### `/start` — Onboarding
```
Welcome to goBlink ⚡
Move value anywhere, instantly. 26 chains, 65+ tokens.

[🔄 New Transfer]  [📋 My Transfers]
[💰 Prices]        [⚙️ Settings]
```

### Transfer Flow (Inline Keyboard Wizard)

**Step 1 — Source Chain**
```
Select source chain:
[Ethereum] [Solana]  [Sui]
[Base]     [NEAR]    [Arbitrum]
[BNB]      [Polygon] [More ▸]
```

**Step 2 — Source Token** (filtered by chain)
```
Select token to send (Ethereum):
[ETH]  [USDC]  [USDT]
[WBTC] [DAI]   [◂ Back]
```

**Step 3 — Destination Chain**
```
Where to send?
[Solana] [Base]   [NEAR]
[Sui]    [Arbitrum] [More ▸]
```

**Step 4 — Destination Token** (filtered by chain)

**Step 5 — Amount**
```
How much USDC to send?
Type an amount or pick:
[$50] [$100] [$500] [Max]
```
*(User types amount or taps preset)*

**Step 6 — Recipient Address**
```
Enter the destination Solana address:
```
*(User types or picks from address book)*

**Step 7 — Confirm**
```
📋 Transfer Summary

Send: 100 USDC (Ethereum)
Receive: ~99.25 USDC (Solana)
Fee: 0.75% ($0.75)
Rate: 1 USDC = 1 USDC
Est. time: ~2 min

⚠️ This is a real transaction. Verify details.

[✅ Confirm — Get Deposit Address]  [❌ Cancel]
```

**Step 8 — Deposit**
```
✅ Transfer created!

Send exactly 100 USDC to:
`0x7a3b...4f2e` (Ethereum)

⏰ Deposit within 30 minutes.
I'll notify you when it arrives.

[📋 Copy Address]  [🔍 Track Status]
```

**Step 9 — Status Updates (Push)**
```
🔄 Deposit received! Processing cross-chain transfer...
```
```
✅ Transfer complete!
99.25 USDC sent to 7xKp...3mNw (Solana)
TX: [View on Explorer ↗]
```

---

## Core Features

### Phase 1 — MVP (Week 1-2)
- [ ] Bot setup (grammY, webhook, PM2)
- [ ] `/start` with main menu
- [ ] Transfer wizard (full 9-step flow above)
- [ ] Quote fetching from 1Click API (reuse existing logic)
- [ ] Deposit address generation
- [ ] Transaction status polling + push notifications
- [ ] Transaction history (`/history`)
- [ ] Address validation per chain
- [ ] Rate limiting per user

### Phase 2 — Power Features (Week 3)
- [ ] Address book (save + label frequently used addresses)
- [ ] `/price <token>` — quick price check
- [ ] Inline mode — trigger transfers from any chat: `@goBlinkBot send 100 USDC to solana:7xKp...`
- [ ] Transfer-as-a-Link integration (share `/t/[id]` links)
- [ ] Payment requests (someone sends you a pay link, bot detects it)
- [ ] Repeat last transfer (`/repeat`)

### Phase 3 — Growth (Week 4+)
- [ ] Group chat support (bot works in groups, not just DMs)
- [ ] Mini App (Telegram WebApp) for complex flows — embed goblink.io swap UI
- [ ] Referral tracking
- [ ] Multi-language support
- [ ] Notification preferences (quiet hours, etc.)

---

## Database Schema (New Tables in Supabase)

```sql
-- Telegram user mapping
CREATE TABLE tg_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- Address book
CREATE TABLE tg_address_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES tg_users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, chain, address)
);

-- Transfer records (bot-specific, links to main transaction_history)
CREATE TABLE tg_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES tg_users(id),
  quote_id TEXT,                    -- 1Click quote ID
  deposit_address TEXT,
  source_chain TEXT NOT NULL,
  source_token TEXT NOT NULL,
  dest_chain TEXT NOT NULL,
  dest_token TEXT NOT NULL,
  amount TEXT NOT NULL,
  recipient TEXT NOT NULL,
  fee_bps INTEGER,
  status TEXT DEFAULT 'PENDING',    -- PENDING, DEPOSITED, PROCESSING, SUCCESS, FAILED, EXPIRED, REFUNDED
  chat_id BIGINT NOT NULL,          -- for push notifications
  message_id INTEGER,               -- status message to edit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tg_transfers_user ON tg_transfers(user_id);
CREATE INDEX idx_tg_transfers_status ON tg_transfers(status) WHERE status IN ('PENDING', 'DEPOSITED', 'PROCESSING');
CREATE INDEX idx_tg_transfers_quote ON tg_transfers(quote_id);

-- RLS
ALTER TABLE tg_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tg_address_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE tg_transfers ENABLE ROW LEVEL SECURITY;
```

---

## Server Requirements

### Hosting: shade-bot (Existing VPS) ✅

No new server needed. The bot is lightweight:
- ~50MB RAM idle
- Minimal CPU (webhook-driven, not polling)
- Network: outbound HTTPS to Telegram API + 1Click API + Supabase

### What's Needed on shade-bot

| Requirement | Status | Action |
|---|---|---|
| Node.js 22 | ✅ Already installed | None |
| PM2 | ❓ Check | `npm i -g pm2` |
| Caddy or nginx | ❓ Check | For HTTPS webhook endpoint |
| Domain/subdomain | ❌ Need | `tgbot.goblink.io` — point A record to shade-bot IP or Cloudflare tunnel |
| SSL cert | Auto via Caddy | Caddy handles Let's Encrypt |
| Telegram Bot Token | ❌ Need | Create via @BotFather |
| Supabase service key | ✅ Exists | Same project, new tables |

### Firewall
- Open port 443 for Telegram webhook (Caddy handles TLS)
- Or use a Cloudflare tunnel (already have Cloudflare on goblink.io) — preferred, avoids exposing shade-bot IP

---

## Bot Registration (@BotFather)

```
Bot name: goBlink
Username: @goBlinkBot (check availability, fallback: @goBlink_bot)
Description: Cross-chain crypto transfers. 26 chains, 65+ tokens. Send from any chain to any chain — right here in Telegram.
About: goblink.io — Move value anywhere, instantly.
Commands:
  start - Main menu
  transfer - New cross-chain transfer
  history - Your transfer history
  price - Check token prices
  address - Manage address book
  settings - Notification & preferences
  help - How to use goBlink
```

---

## Project Structure

```
goblink-telegram/
├── src/
│   ├── bot.ts                 # Bot init, middleware, webhook
│   ├── config.ts              # Env vars, constants
│   ├── conversations/
│   │   ├── transfer.ts        # Transfer wizard (grammY conversation)
│   │   └── address-book.ts    # Address book management
│   ├── commands/
│   │   ├── start.ts
│   │   ├── history.ts
│   │   ├── price.ts
│   │   └── help.ts
│   ├── services/
│   │   ├── goblink.ts         # SDK client instance + helpers
│   │   ├── tokens.ts          # Token list, filtering, icons (via SDK)
│   │   ├── fees.ts            # Fee calculation (via SDK)
│   │   ├── status-poller.ts   # Poll 1Click for tx status, push updates
│   │   └── supabase.ts        # DB operations
│   ├── utils/
│   │   ├── keyboards.ts       # Inline keyboard builders
│   │   ├── formatters.ts      # Message formatting (amounts, addresses)
│   │   └── validators.ts      # Address validation per chain
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
├── .env.example
├── ecosystem.config.js         # PM2 config
└── README.md
```

---

## Key Technical Decisions

### 1. Webhook vs Long Polling
**Webhook.** More efficient, lower latency, production-grade. Requires HTTPS endpoint (Caddy handles this).

### 2. Conversation State
**grammY conversations plugin** — stores state in memory (with Redis/Supabase adapter for persistence across restarts). Handles the multi-step transfer wizard cleanly.

### 3. Status Monitoring
**Background poller.** Every 15s, query active transfers (status IN PENDING, DEPOSITED, PROCESSING), check 1Click status API, push updates via `editMessageText` on the status message. Efficient — only polls while transfers are active.

### 4. Security
- No private keys stored — deposit address model (user sends from their own wallet)
- Rate limit: 5 transfers/hour per user, 1 quote/second
- Address validation before creating deposit
- Amount validation (min/max from 1Click API)
- Telegram user ID as primary identifier (can't be spoofed in bot context)

### 5. SDK-First Architecture
The Telegram bot is the first consumer of `@goblink/sdk`. All 1Click API interaction, fee calculation, token resolution, and address validation goes through the SDK — not duplicated in bot code. See SDK section below.

---

---

## @goblink/sdk — The SDK Package

### Why Build It Now

The Telegram bot needs the same core logic as the web app: token lists, quotes, fee calculation, address validation, deposit address generation, status tracking. Instead of duplicating this across two repos, we extract it into `@goblink/sdk` — a headless TypeScript SDK that any consumer (web app, TG bot, Discord bot, third-party integrations) can import.

This was already Phase 2 in the 5-phase vision. Building the Telegram bot is the forcing function.

### New Repo

**Repo:** `github.com/Urban-Blazer/goblink-sdk`
**Package:** `@goblink/sdk` (published to npm — public, this is how we get third-party adoption)

### What Goes in the SDK

```
@goblink/sdk/
├── src/
│   ├── index.ts               # Main exports
│   ├── client.ts              # GoBlinkClient class — main entry point
│   ├── tokens/
│   │   ├── list.ts            # Fetch + cache token list from 1Click API
│   │   ├── filter.ts          # Filter by chain, search, deduplicate
│   │   ├── icons.ts           # Token icon mapping
│   │   └── types.ts           # Token, Chain, AssetId types
│   ├── quotes/
│   │   ├── get-quote.ts       # Request quote (protocol abstracted internally)
│   │   ├── types.ts           # QuoteRequest, QuoteResponse
│   │   └── fees.ts            # Fee calculation (tiered bps, min floor enforced)
│   ├── transfers/
│   │   ├── create.ts          # Create transfer → get deposit address
│   │   ├── status.ts          # Poll transfer status
│   │   └── types.ts           # TransferRequest, TransferStatus
│   ├── validation/
│   │   ├── address.ts         # Per-chain address validation (EVM, Solana, Sui, NEAR, etc.)
│   │   └── amount.ts          # Min/max, decimal precision
│   ├── chains/
│   │   ├── config.ts          # Chain definitions, RPC URLs, explorer URLs
│   │   └── types.ts           # Chain enum, ChainConfig
│   └── utils/
│       ├── format.ts          # Amount formatting, address truncation
│       └── cache.ts           # Simple TTL cache (in-memory)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Design Principles

1. **Revenue by default.** The SDK's default fee tiers are 75/50/30 bps (our revenue). Third parties using the SDK generate revenue for goBlink on every transfer. The constructor accepts custom overrides, but a minimum floor (configurable, default 10 bps) ensures we always earn on SDK-originated transfers. This is the business model for making it public.

2. **goBlink branding only.** No references to NEAR, 1Click, Intents, Defuse, or NEP-141 in any public-facing API, types, docs, or error messages. The underlying protocol is an implementation detail — completely abstracted. If we swap backends tomorrow, the SDK interface doesn't change. Internal modules may reference 1Click internally but nothing is exported.

3. **Protocol-agnostic types.** Asset IDs use goBlink's own format (e.g., `ethereum:usdc`, `solana:native`) — not `nep141:*` or `defuseAssetId`. The SDK maps to/from protocol-specific IDs internally.

### API Surface

```typescript
import { GoBlink } from '@goblink/sdk';

const gb = new GoBlink({
  fees: [
    { maxAmountUsd: 5000, bps: 35 },    // Under $5K → 0.35%
    { maxAmountUsd: 50000, bps: 10 },   // $5K–$50K → 0.10%
    { maxAmountUsd: null, bps: 5 },     // Over $50K → 0.05%
  ],  // optional, defaults to goBlink standard tiers
  minFee: 5,                             // optional, minimum bps floor
});

// Tokens
const tokens = await gb.getTokens();
const ethTokens = await gb.getTokens({ chain: 'ethereum' });

// Quote
const quote = await gb.getQuote({
  sourceToken: 'eth:native',
  destToken: 'solana:native',
  amount: '1.5',
});
// → { amountIn, amountOut, fee, rate, estimatedTime, depositAddress }

// Transfer (create deposit intent)
const transfer = await gb.createTransfer({
  sourceToken: 'eth:native',
  destToken: 'solana:native',
  amount: '1.5',
  recipient: '7xKp...3mNw',
});
// → { id, depositAddress, depositAmount, expiresAt }

// Status
const status = await gb.getTransferStatus(transfer.id);
// → { status: 'PROCESSING', txHash, explorerUrl }

// Validation
gb.validateAddress('solana', '7xKp...3mNw'); // → true
gb.validateAmount('1.5', token);              // → { valid: true }

// Chains
const chains = gb.getChains();
// → [{ id: 'ethereum', name: 'Ethereum', explorerUrl, ... }]
```

### Build Order

1. **Extract from web app** — the logic already exists in `apps/web/src/lib/server/oneclick.ts`, `lib/validators.ts`, `lib/server/fees.ts`, etc.
2. **Package as SDK** — ESM + CJS dual build, TypeScript declarations
3. **Publish to npm** — `@goblink/sdk` (public)
4. **Refactor web app** — replace inline 1Click calls with SDK imports
5. **Telegram bot** — imports SDK from day 1

### What the Web App Keeps (Not in SDK)

- React components, UI, styling
- Wallet connection logic (browser-specific)
- Supabase client-side auth
- Vercel-specific config
- Frame rendering (Farcaster)

### What the Telegram Bot Adds on Top of SDK

- grammY bot framework + conversation state
- Inline keyboard builders
- Telegram-specific message formatting
- Status polling → Telegram push notifications
- Supabase server-side operations (user records, transfer history)

---

## Environment Variables

```env
# Telegram
TELEGRAM_BOT_TOKEN=           # From @BotFather
TELEGRAM_WEBHOOK_SECRET=      # Random string for webhook verification
TELEGRAM_WEBHOOK_URL=         # https://tgbot.goblink.io/webhook

# 1Click API
ONECLICK_API_URL=https://1click.chaindefuser.com
INTENTS_EXPLORER_JWT=         # For status tracking

# Supabase
SUPABASE_URL=                 # Same as web app
SUPABASE_SERVICE_KEY=         # Server-side key (not anon)

# App
APP_FEE_BPS_STANDARD=35       # Under $5K (0.35%)
APP_FEE_BPS_PRO=10            # $5K-$50K (0.10%)
APP_FEE_BPS_WHALE=5           # Over $50K (0.05%)
APP_FEE_RECIPIENT=goblink.near
NODE_ENV=production
```

---

## Estimated Timeline

| Phase | Duration | Deliverable |
|---|---|---|
| Setup (repo, bot registration, infra) | 1 day | Bot responding to /start |
| Transfer wizard + quotes | 3-4 days | Full transfer flow working |
| Status polling + notifications | 1 day | Real-time updates |
| History + address book | 1 day | User data features |
| Testing + polish | 1-2 days | Error handling, edge cases |
| **Phase 1 total** | **~7-9 days** | **MVP live** |
| Phase 2 (inline mode, etc.) | 1 week | Power features |
| Phase 3 (groups, Mini App) | 1-2 weeks | Growth features |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 1Click API rate limits | Bot can't fetch quotes | Cache quotes for 30s, rate limit per user |
| Deposit address expiry | User sends after expiry → funds stuck | Clear warnings, 30min countdown, auto-expire transfers |
| Telegram API limits | Can't send updates | Batch status updates, respect 30 msg/sec limit |
| User sends wrong amount | Partial fill or rejection | Show exact amount prominently, copy button |
| User sends wrong token | Funds lost | Warn on confirm screen, validate chain match |
| Bot downtime | Missed status updates | PM2 auto-restart, catch up on pending txs at boot |

---

## Decisions (Locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Bot username | `@goblinkbot` (check availability, fallback: `@goblink_bot`) |
| 2 | SDK scope | **Public** — `@goblink/sdk` on npm. Revenue via default fee tiers. |
| 3 | Bot UX model | **Pure bot MVP** → Mini App in Phase 3 |
| 4 | Group chat | **DMs only for MVP.** Phase 2: inline mode (`@goblinkbot` in any chat). Phase 3: group triggers → DM redirect. |
| 5 | Domain routing | **Cloudflare Tunnel** — `tgbot.goblink.io` routed through tunnel, shade-bot IP hidden |
| 6 | Build order | **SDK first**, then bot consumes it |
| 7 | Branding | **goBlink only** — no NEAR/1Click/Intents/Defuse in any public API, types, or docs |
| 8 | Revenue | Default fee tiers baked into SDK (35/10/5 bps at $5K/$50K thresholds). Minimum floor enforced (5 bps). Fee recipient: `goblink.near`. Third-party SDK consumers generate revenue for goBlink. |
