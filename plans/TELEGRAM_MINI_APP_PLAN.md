# goBlink Telegram Mini App — Development Plan

## Overview

A Telegram Mini App (TMA) that gives users the full goBlink transfer experience inside Telegram — branded UI, wallet connections, real-time quotes, and transaction tracking. Unlike the bot (text-based, deposit-address flow), the Mini App is a proper web UI running inside Telegram's WebView with native platform integration.

**Why a Mini App vs just the bot?**
- Wallet connections (MetaMask, Phantom, Sui Wallet) — users sign transactions directly instead of sending to deposit addresses
- Rich visual UI — token selectors, charts, animations, the full goBlink brand experience
- Homescreen shortcut — users add it like a native app
- Seamless auth — Telegram user identity passed automatically, no signup
- Combines the reach of Telegram (950M+ users) with the power of the web app

**URL:** `telegram.goblink.io`

---

## Architecture Decision: Standalone Vite App (Not Next.js)

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Telegram     │────▶│  Mini App (Vite)  │────▶│  goblink.io API │
│  WebView      │◀────│  React + TS       │◀────│  (Next.js)      │
└──────────────┘     └────────┬─────────┘     └─────────────────┘
                              │                         │
                     ┌────────┴─────────┐      ┌───────┴────────┐
                     │  @telegram-apps/  │      │  1Click API    │
                     │  sdk-react        │      │  (NEAR Intents)│
                     └──────────────────┘      └────────────────┘
```

**Why NOT embed in the existing Next.js app:**
1. TMAs need `@telegram-apps/sdk` initialization before any rendering — conflicts with Next.js SSR/hydration
2. TMA-specific viewport, theme, and navigation patterns don't mix well with the public website
3. Vite builds to a static SPA — perfect for TMA (no server needed, deploy to Vercel/Cloudflare Pages)
4. Keeps the main app clean; TMA has its own lifecycle
5. Can still call goblink.io API routes for balances, quotes, transactions — no duplication

**Why NOT a new app in the monorepo:**
- Different tooling (Vite vs Next.js), different deploy target
- Simpler as standalone repo with its own CI/CD
- Shares code via the SDK + API calls, not workspace packages

---

## New GitHub Repo

**Repo:** `github.com/Urban-Blazer/goblink-tma`

```
goblink-tma/
├── src/
│   ├── App.tsx                  # Root — TMA init, router, providers
│   ├── main.tsx                 # Entry point
│   ├── components/
│   │   ├── Layout.tsx           # TMA chrome (back button, header, safe areas)
│   │   ├── SwapForm.tsx         # Main transfer form (adapted from web)
│   │   ├── TokenSelector.tsx    # Chain + token picker with search
│   │   ├── QuotePreview.tsx     # Fee breakdown, rate, ETA
│   │   ├── WalletConnect.tsx    # Multi-chain wallet connection
│   │   ├── TransactionStatus.tsx # Live status tracker
│   │   ├── AddressBook.tsx      # Saved addresses
│   │   └── History.tsx          # Past transfers
│   ├── hooks/
│   │   ├── useTelegram.ts       # TMA context (user, theme, haptics)
│   │   ├── useTransfer.ts       # Transfer flow state machine
│   │   ├── useWallet.ts         # Unified wallet hook (EVM/Solana/Sui/NEAR)
│   │   └── useQuote.ts          # Quote polling with auto-refresh
│   ├── services/
│   │   ├── api.ts               # Calls to goblink.io/api/* (reuse existing endpoints)
│   │   └── telegram.ts          # TMA-specific helpers (haptics, popups, share)
│   ├── styles/
│   │   └── globals.css          # Tailwind + TMA theme variables
│   └── lib/
│       ├── chains.ts            # Chain configs (reuse from web)
│       └── tokens.ts            # Token list + filters
├── public/
│   └── tonconnect-manifest.json # Required for TON (if added later)
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Tech Stack

| Component | Choice | Why |
|---|---|---|
| Build tool | Vite 6 | Fast SPA builds, perfect for TMA |
| Framework | React 19 + TypeScript | Same as web app, shared knowledge |
| TMA SDK | `@telegram-apps/sdk-react` | Official React bindings, hooks for all TMA features |
| Styling | Tailwind CSS | Same as web app, consistent brand |
| Wallets (EVM) | `@reown/appkit` + wagmi | Same as web app — MetaMask, WalletConnect, Coinbase |
| Wallets (Solana) | `@reown/appkit-adapter-solana` | Same as web app |
| Wallets (Sui) | `@mysten/dapp-kit` | Same as web app |
| Wallets (NEAR) | `@hot-labs/near-connect` | Same as web app |
| State | Zustand | Lightweight, no boilerplate (simpler than web app's React context) |
| Routing | React Router 7 | SPA routing, TMA back button integration |
| Deploy | Vercel (static) or Cloudflare Pages | Free tier, global CDN, custom domain |
| API | Existing goblink.io/api/* routes | Zero backend duplication |

---

## Key Differences from Web App

| Feature | Web App (goblink.io) | Mini App (TMA) |
|---|---|---|
| Auth | No auth / wallet-based | Telegram initData (automatic) |
| Navigation | Browser nav + hamburger menu | TMA BackButton + MainButton |
| Theme | Own dark/light toggle | Inherits Telegram's theme |
| Haptics | None | Native haptic feedback on actions |
| Sharing | Copy link / social buttons | `shareMessage()` — native Telegram share |
| Payments | Wallet signing only | Wallet signing + Telegram Stars (future) |
| Address book | localStorage | Supabase (linked to Telegram user) |
| Notifications | None (check back) | Push via bot after Mini App close |
| Homescreen | PWA install prompt | `addToHomeScreen()` native |

---

## User Flow

### Launch Points
1. **Bot menu button** — @goBlinkBot → hamburger → "Open Mini App"
2. **Inline button** — Bot sends a button that opens the TMA
3. **Direct link** — `t.me/goBlinkBot/app` (or custom short name)
4. **Homescreen** — After first use, prompt to add shortcut

### Transfer Flow (Visual)

```
┌─────────────────────────┐
│  goBlink ⚡              │  ← TMA header (Telegram chrome)
│                         │
│  ┌───────────────────┐  │
│  │ From               │  │
│  │ [Ethereum ▾] [ETH]│  │  ← Chain + token selector
│  │ Balance: 2.4 ETH  │  │
│  └───────────────────┘  │
│          ↕ swap          │
│  ┌───────────────────┐  │
│  │ To                 │  │
│  │ [Solana ▾] [USDC] │  │
│  │ Address: 7xKp...  │  │  ← Paste, scan, or pick from address book
│  └───────────────────┘  │
│                         │
│  Amount: [____] ETH     │
│  ≈ $4,280.00            │
│                         │
│  Rate: 1 ETH = 1,784 USDC │
│  Fee: 0.35% ($14.98)    │
│  ETA: ~2 min            │
│                         │
│  [    🔄 Transfer    ]  │  ← TMA MainButton (native, bottom)
└─────────────────────────┘
```

### Post-Transfer
- Haptic success feedback
- Status tracker (same as web: PENDING → PROCESSING → SUCCESS)
- Share button → sends transfer receipt to any Telegram chat
- Push notification via bot when transfer completes (if user closed TMA)

---

## Phases

### Phase 1 — MVP (Target: 1 week)
Core transfer flow inside Telegram.

- [ ] Project scaffold (Vite + React + TS + Tailwind + TMA SDK)
- [ ] TMA initialization (theme sync, safe areas, back button, viewport)
- [ ] Main transfer form (chain selector, token selector, amount input)
- [ ] Wallet connection (EVM via AppKit, Solana, Sui, NEAR)
- [ ] Quote fetching (call goblink.io/api/tokens, /api/deposit/submit)
- [ ] Transaction signing (reuse web app's signing logic per chain)
- [ ] Status tracking (poll /api/status/[depositAddress])
- [ ] Basic navigation (Transfer → Status → History)
- [ ] TMA MainButton for primary CTA ("Get Quote" → "Confirm Transfer")
- [ ] TMA BackButton integration with React Router
- [ ] Deploy to Vercel, configure `telegram.goblink.io`
- [ ] Register Mini App with @BotFather, link to @goBlinkBot

### Phase 2 — Polish & Platform Features (Target: 1 week)
Make it feel native.

- [ ] Haptic feedback (selection, confirmation, success/error)
- [ ] Theme adaptation (use Telegram's CSS variables for colors)
- [ ] Address book (Supabase-backed, linked to TG user)
- [ ] Transaction history (full list with filters)
- [ ] Share transfer receipt via `shareMessage()`
- [ ] Homescreen prompt (`addToHomeScreen()`)
- [ ] Loading states + skeleton UI
- [ ] Error boundaries with retry
- [ ] QR code scanner for destination addresses (if TMA supports camera)

### Phase 3 — Growth & Advanced (Target: 2 weeks)
Leverage Telegram's distribution.

- [ ] Push notifications via bot (transfer complete, price alerts)
- [ ] Referral system (share Mini App link with tracking)
- [ ] Payment requests — generate shareable links opened in TMA
- [ ] Favorites (pin frequent transfer routes)
- [ ] Multi-language (i18n — start with EN, ES, RU, ZH)
- [ ] Full-screen mode for immersive experience
- [ ] DeviceStorage for persistent preferences
- [ ] Analytics (Vercel Analytics + custom events)

### Phase 4 — Ecosystem
- [ ] Inline mode — share Mini App card from any chat
- [ ] Premium features (priority routing, lower fees for power users)

---

## API Strategy: Zero Backend Duplication

The Mini App calls the **existing** goblink.io API routes. No new backend needed.

| Mini App needs | Existing API route | Notes |
|---|---|---|
| Token list | `GET /api/tokens` | Already filtered + cached |
| Token prices | `GET /api/tokens/prices` | DexScreener data |
| Balances (EVM) | `GET /api/balances/evm/[chain]/[address]` | Per-chain |
| Balances (Solana) | `GET /api/balances/solana/[address]` | Via backend RPC proxy |
| Balances (Sui) | `GET /api/balances/sui/[address]` | Blockvision |
| Balances (NEAR) | `GET /api/balances/near/[accountId]` | Direct RPC |
| Submit transfer | `POST /api/deposit/submit` | Returns deposit address |
| Transfer status | `GET /api/status/[depositAddress]` | 1Click execution status |
| Transaction history | `GET /api/transactions` | Supabase query |
| Fee calculation | `GET /api/fees` | Tier calculation |

**Auth for API calls:** Include `initData` from TMA in request headers. Add a lightweight middleware to goblink.io API routes to validate Telegram `initData` signature and extract user identity.

---

## Wallet Strategy

TMAs run in a WebView — most wallet browser extensions won't inject. Strategy:

| Chain | Connection Method | Notes |
|---|---|---|
| EVM | AppKit (WalletConnect + injected) | Same as web app — MetaMask, Trust, Coinbase, WalletConnect QR/deep link |
| Solana | AppKit Solana adapter | Same as web app — Phantom, Solflare via deep link + WalletConnect |
| Sui | @mysten/dapp-kit | Same as web app — Sui Wallet deep link |
| NEAR | @hot-labs/near-connect | Same as web app — HOT Wallet (already Telegram-native) |
| Aptos | @aptos-labs/wallet-adapter-react | Same as web app — Petra, Pontem |
| Starknet | starknetkit + @starknet-react/core | Same as web app — Argent X, Braavos |
| Tron | @tronweb3/tronwallet-adapter-react-hooks | Same as web app — TronLink |
| Fallback | Deposit address mode | Same as bot — user sends to address manually |

**Mirror rule:** Every wallet connection the web app supports, the Mini App supports. Exact same adapters, same chains, same UX. If an extension can't inject in WebView, the adapter's WalletConnect/deep-link fallback handles it.

**Deposit-address fallback:** If wallet connection fails entirely (some WebViews are hostile), gracefully fall back to the deposit-address flow (same as the bot). Never leave users stuck.

---

## TMA-Specific Integration Points

### Theme Sync
```typescript
// Use Telegram's CSS variables directly in Tailwind
// --tg-theme-bg-color, --tg-theme-text-color, etc.
// Override our brand colors only where needed (accent stays goBlink blue→violet)
```

### MainButton (Native CTA)
```typescript
// Phase 1: "Get Quote" → Phase 2: "Confirm Transfer" → Phase 3: "Sending..."
mainButton.setText('Confirm Transfer');
mainButton.show();
mainButton.onClick(() => executeTransfer());
```

### BackButton
```typescript
// Integrates with React Router
backButton.show();
backButton.onClick(() => navigate(-1));
```

### Haptics
```typescript
hapticFeedback.impactOccurred('medium');     // On selection
hapticFeedback.notificationOccurred('success'); // Transfer complete
```

### Data Validation
```typescript
// Validate initData on the backend to prevent spoofing
// Use HMAC-SHA256 with bot token as per Telegram docs
// This authenticates every API call from the Mini App
```

---

## BotFather Setup

```
/mybots → @goBlinkBot → Bot Settings → Configure Mini App → Enable Mini App
- App URL: https://telegram.goblink.io
- Short name: app (so link = t.me/goBlinkBot/app)
- Menu button text: "Open goBlink"
```

---

## Deploy & CI

```yaml
# GitHub Actions — deploy on push to main
- Vite build → static dist/
- Deploy to Vercel (or Cloudflare Pages)
- Custom domain: telegram.goblink.io
- Environment: VITE_API_URL=https://goblink.io, VITE_BOT_USERNAME=goBlinkBot
```

---

## Code Reuse from Web App

These components/logic can be adapted (not copied verbatim — TMA needs simpler, mobile-first versions):

| Web App Source | TMA Adaptation |
|---|---|
| `SwapForm.tsx` | Simplified single-column layout |
| `TokenSelector.tsx` | Bottom sheet style with search |
| `QuotePreview.tsx` | Inline below form (not modal) |
| `StatusTracker.tsx` | Full-screen status page with haptics |
| `lib/chains.ts`, token configs | Direct reuse |
| Wallet connection logic | Adapted for WalletConnect-only (no extensions) |
| Fee calculation | Reuse via API call |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Wallet extensions don't work in WebView | Users can't sign transactions | Deposit-address fallback (bot flow) |
| WalletConnect QR scan UX is clunky | Drop-off during wallet connect | Deep links for popular wallets + clear instructions |
| TMA SDK breaking changes | Build failures | Pin SDK version, test in Telegram beta |
| CORS on goblink.io API from telegram.goblink.io | API calls blocked | Add `telegram.goblink.io` to CORS allowlist in Next.js |
| Telegram theme clashes with brand | Ugly UI | Use TG theme for chrome, goBlink brand for content area |

---

## Success Metrics (Phase 1)

- Transfer completion rate ≥ 60% (users who start a transfer finish it)
- Average transfer time < 3 min (from open to confirmed)
- Zero critical bugs in first 48h of beta
- Bot → Mini App handoff works seamlessly

---

## Estimated Timeline

| Phase | Duration | Milestone |
|---|---|---|
| Phase 1 — MVP | 5-7 days | Core transfer flow live in Telegram |
| Phase 2 — Polish | 5-7 days | Native feel, address book, sharing |
| Phase 3 — Growth | 10-14 days | Referrals, i18n, notifications |
| Phase 4 — Monetization | Ongoing | Stars, premium features |

---

## Decisions (Locked)

1. **Domain:** `telegram.goblink.io`
2. **Wallets:** Exact mirror of web app — all chains, all adapters, no subset
3. **Bot ↔ Mini App:** Fully independent. Different users, different flows. Bot = deposit-address text flow. Mini App = visual wallet-signing flow. No cross-linking.
4. **Telegram Stars:** Not implementing. Removed from roadmap.
5. **Supabase tables:** Reuse `tg_users`, `tg_address_book`, `tg_transfers` from bot. Add `tg_wallets` table (telegram_id → chain + wallet_address + label). Unified identity — transfers from bot and Mini App share the same history.
