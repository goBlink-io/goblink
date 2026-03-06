# goBlink Security Audit Report

**Date:** 2026-03-06
**Scope:** Full codebase — apps/web (Next.js), packages/connect, packages/shared
**Auditor:** Automated comprehensive review via Claude
**Status:** Read-only audit. No code was modified.

---

## Executive Summary

goBlink is a cross-chain token swap interface using NEAR Intents (1Click API) where users send real cryptocurrency. This audit identified **6 critical**, **9 high**, **8 medium**, and **10 low** severity findings across API routes, client-side code, Farcaster frame integrations, configuration, and dependencies.

**The most urgent risks are:**

1. **Unauthenticated write endpoints** — anyone can create/update transaction records and mark payments as completed without on-chain verification (C1, C2).
2. **Farcaster frame parameter manipulation** — transaction parameters (recipient, amount, chain) are passed via URL query strings that can be freely tampered with, and frame signatures are never verified (C3, C4).
3. **Open Solana RPC proxy** — forwards arbitrary JSON-RPC calls through your paid RPC endpoint with zero method filtering (C5).
4. **1Click deposit addresses trusted blindly** — no verification that the deposit address returned by the 1Click API is legitimate (C6).

The platform has strong fundamentals (non-custodial design, proper secret segregation, React XSS protection), but **critical gaps in authentication, input validation, and frame security** must be addressed before handling significant transaction volume.

---

## Critical Findings

### C1. Unauthenticated Transaction Write Endpoints

**Files:**
- `apps/web/src/app/api/transactions/route.ts:13` (POST)
- `apps/web/src/app/api/transactions/[id]/route.ts:46` (PATCH)

**Description:** `POST /api/transactions` and `PATCH /api/transactions/[id]` have no authentication. Any anonymous user can insert fabricated transaction records or update any existing transaction's status (e.g., mark as `completed`). This pollutes analytics, admin dashboards, fee calculations, and route confidence scores.

**Fix:** Require wallet signature verification or session-based auth. Verify the caller controls the wallet address being written.

---

### C2. Unauthenticated Payment Link Completion — Arbitrary Status Manipulation

**File:** `apps/web/src/app/api/pay/[id]/complete/route.ts:11` (POST), `:65` (PATCH)

**Description:** Both POST and PATCH have no authentication. Anyone who knows an 8-character nanoid payment link ID can:
- Mark a payment as "processing" with a fake `sendTxHash`
- Mark a payment as "paid" without on-chain verification (the PATCH defaults any non-"failed" outcome to "paid")
- Mark a payment as "failed" to grief legitimate payments

```typescript
const status = outcome === 'failed' ? 'failed' : 'paid';
```

**Fix:** Verify on-chain transaction status server-side before marking as paid. Do not trust client-supplied `outcome`. Use HMAC-signed callback URLs or server-side polling only.

---

### C3. Frame Transaction Parameters Are Entirely Client-Controlled

**Files:**
- `apps/web/src/app/frames/send/tx/route.ts:20-27`
- `apps/web/src/app/frames/pay/tx/route.ts:23-34`
- `apps/web/src/app/frames/tip/tx/route.ts:17-28`

**Description:** All three `/tx` routes read critical transaction parameters (`to`, `amount`, `sourceChain`, `sourceToken`, `destChain`, `destToken`) directly from URL query parameters. Farcaster Frames v1 does NOT cryptographically bind button target URLs. A malicious actor can craft a frame URL with a modified `to` parameter to redirect funds to their own wallet, or modify `amount` to drain more than displayed.

**Fix:** Store frame wizard state in a signed JWT or server-side session keyed by a nonce. The `/tx` endpoint should retrieve parameters from that signed state, not from query parameters.

---

### C4. No Farcaster Frame Signature Verification

**Files:**
- `apps/web/src/app/frames/send/post/route.ts:148-151`
- `apps/web/src/app/frames/send/tx/route.ts:60-63`
- `apps/web/src/app/frames/pay/tx/route.ts:41-45`
- `apps/web/src/app/frames/tip/tx/route.ts:37-41`
- `apps/web/src/app/frames/tip/post/route.ts:25-29`

**Description:** All frame POST handlers read `body.untrustedData.inputText` and `body.untrustedData.address` but never verify the frame message signature via Farcaster Hub. The `refundAddress` for cross-chain swaps comes from `body.untrustedData.address` — an attacker can set this to any address. Any HTTP client can POST arbitrary data.

**Fix:** Validate `trustedData.messageBytes` using `@farcaster/core` `validateMessage`. Extract verified FID and address from the validated message.

---

### C5. Open Solana RPC Proxy — Arbitrary JSON-RPC Forwarding

**File:** `apps/web/src/app/api/balances/solana-rpc/route.ts:6-20`

**Description:** Accepts arbitrary JSON body and forwards it verbatim to the Solana RPC endpoint. Zero input validation — no method whitelist, no parameter sanitization. An attacker can call any Solana RPC method (`sendTransaction`, `simulateTransaction`, etc.), abuse paid RPC quota, or use the server as an SSRF proxy.

```typescript
const body = await request.json();
const response = await axios.post(SOLANA_RPC_URL, body, { ... });
```

**Fix:** Whitelist allowed RPC methods (e.g., `getLatestBlockhash`, `sendRawTransaction`). Validate the `method` field before forwarding.

---

### C6. 1Click Deposit Address Trusted Blindly

**Files:**
- `apps/web/src/app/api/frames/quote/route.ts:134-138`
- `apps/web/src/app/frames/send/tx/route.ts:89-93`
- `apps/web/src/app/frames/pay/tx/route.ts:71-76`
- `apps/web/src/app/frames/tip/tx/route.ts:67-71`

**Description:** The `depositAddress` from the 1Click API quote is used directly as the `to` field in EVM transactions with zero verification. If the 1Click API is compromised, returns a malicious response, or `NEXT_PUBLIC_BASE_URL` is poisoned, user funds go to an attacker address.

```typescript
params: { abi: [], to: depositAddress, value: `0x${BigInt(sendAmount).toString(16)}` }
```

**Fix:** Maintain an allowlist of known 1Click deposit address patterns. Verify the quote response includes the same recipient/amounts requested. Pin the 1Click API base URL.

---

## High Priority Findings

### H1. SQL/PostgREST Filter Injection via Unsanitized Search

**Files:**
- `apps/web/src/app/api/admin/transactions/route.ts:30-32`
- `apps/web/src/lib/server/transactions.ts:222-227`

**Description:** User-supplied search strings are interpolated directly into Supabase `.or()` filter expressions:

```typescript
query = query.or(`wallet_address.ilike.%${search}%,recipient.ilike.%${search}%,...`);
```

Crafted input containing PostgREST syntax (commas, dots, parentheses) can inject additional filter operators.

**Fix:** Escape PostgREST special characters or use parameterized `.ilike()` on individual columns.

---

### H2. No Client-Side Address Validation Before Transaction Signing

**Files:**
- `apps/web/src/components/SwapForm.tsx:379-454`
- `apps/web/src/components/TransferModal.tsx:165-430`

**Description:** `validators.ts` defines `isValidEvmAddress`, `isValidSolanaAddress`, `isValidNearAccount`, `isValidSuiAddress` — but none are called in SwapForm or TransferModal before submitting quotes or initiating transactions. Malicious payment links can inject attacker-controlled addresses.

**Fix:** Call appropriate chain-specific validators on `recipient` and `refundTo` before `handleGetQuote()` and `handleConfirm()`.

---

### H3. Unauthenticated Transaction Search — Data Enumeration

**Files:**
- `apps/web/src/app/api/transactions/search/route.ts:13`
- `apps/web/src/app/api/transactions/route.ts:93`

**Description:** `GET /api/transactions/search?q=...` and `GET /api/transactions?wallet=...` have no authentication. Anyone can enumerate wallet addresses, transaction amounts, and activity patterns.

**Fix:** Require wallet signature verification proving the caller owns the queried address.

---

### H4. Missing OAuth State Parameter — CSRF on GitHub Login

**Files:**
- `apps/web/src/app/api/auth/github/route.ts:13`
- `apps/web/src/app/api/auth/github/callback/route.ts:4`

**Description:** GitHub OAuth flow has no `state` parameter. This enables CSRF login attacks where an attacker forces a victim to authenticate as the attacker's GitHub account.

**Fix:** Generate a random `state` value, store in httpOnly cookie, include in auth URL, and verify in callback.

---

### H5. GitHub Access Token Stored in Cookie

**File:** `apps/web/src/app/api/auth/github/callback/route.ts:59`

**Description:** The full GitHub access token is stored in the `github_auth` cookie for 30 days. If exposed via proxy logs, CDN misconfiguration, or a code change removing httpOnly, it grants `read:user` access.

**Fix:** Store the token server-side keyed by a random session ID. Only store the session ID in the cookie.

---

### H6. HTML Injection in Frame Meta Tags

**Files:**
- `apps/web/src/app/frames/send/post/route.ts:77-91`
- `apps/web/src/app/frames/tip/post/route.ts:36-46`

**Description:** Frame HTML is built via string interpolation with unescaped user input from `untrustedData.inputText`. A crafted value containing `"` can break out of content attributes and inject arbitrary meta tags, potentially overriding transaction target URLs.

**Fix:** HTML-escape all interpolated values (`"`, `<`, `>`, `&`) in meta tag content attributes.

---

### H7. Client-Side Fee Calculation Can Be Manipulated

**File:** `apps/web/src/components/TransferModal.tsx:188-209`

**Description:** For `EXACT_OUTPUT` swaps, fee adjustments are computed client-side from the `feeInfo` object. An attacker modifying React state or intercepting the response can zero out `feeInfo.bps`, causing underpayment that fails the swap but locks the deposit.

**Fix:** The server should return the final `sendAmount` inclusive of fees. Never compute fee-adjusted amounts client-side.

---

### H8. Self-Referencing Server Fetch Creates SSRF Risk

**Files:**
- `apps/web/src/app/frames/send/tx/route.ts:69-70`
- `apps/web/src/app/frames/pay/tx/route.ts:51-52`
- `apps/web/src/app/frames/tip/tx/route.ts:47-48`

**Description:** The tx routes fetch their own API via `NEXT_PUBLIC_BASE_URL`:

```typescript
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://goblink.io';
const quoteRes = await fetch(`${baseUrl}/api/frames/quote`, { ... });
```

If `NEXT_PUBLIC_BASE_URL` is set to `http://169.254.169.254` or similar, this is an SSRF vector.

**Fix:** Call the quote logic directly as a function import, or use a non-public env var with validation for internal URLs.

---

### H9. `unsafe-eval` in Content Security Policy

**File:** `apps/web/next.config.js:62`

**Description:** `script-src` includes `'unsafe-eval'`, which allows `eval()` and `new Function()`. Combined with `'unsafe-inline'`, this effectively neuters CSP for script injection.

**Fix:** Investigate which wallet libraries require `unsafe-eval`. Consider nonce-based CSP for inline scripts and isolating wallet code.

---

## Medium Priority Findings

### M1. No Rate Limiting on Any Endpoint

**Files:** All API routes; no `middleware.ts` exists.

**Description:** No rate limiting anywhere. Every endpoint is vulnerable to brute-force, resource exhaustion, and spam. This affects admin login, RPC proxies, unauthenticated write endpoints, and quote generation.

**Fix:** Implement rate limiting middleware (Vercel Edge + KV, or `next-rate-limit`). Prioritize: admin auth (strict), RPC proxies (moderate), public reads (lenient).

---

### M2. Admin Auth Brute-Force — No Lockout

**File:** `apps/web/src/app/api/admin/auth/route.ts:5`

**Description:** Admin login accepts email/password with no rate limiting, no lockout, no CAPTCHA, and no exponential backoff.

**Fix:** Per-IP rate limiting (5/min), temporary lockout after N failures, consider 2FA.

---

### M3. Supabase Service Role Key Used for All DB Operations

**File:** `apps/web/src/lib/server/db.ts:9`

**Description:** All database queries use the service role key, which bypasses all Row Level Security (RLS). If any endpoint has a filter injection, it operates with full DB access.

**Fix:** Use anon key with RLS for public endpoints. Reserve service role for admin operations only.

---

### M4. URL-Based Parameter Injection in Payment Links

**Files:**
- `apps/web/src/lib/payment-requests.ts:38-51`
- `apps/web/src/app/pay/[id]/page.tsx:15-40`

**Description:** Payment request data decoded from base64 URL segment — `recipient`, `amount`, `toChain`, `toToken` are trusted with minimal validation. Crafted payment links can phish users with attacker-controlled recipients and misleading names.

**Fix:** Validate `recipient` per chain format. Display clear warnings about verifying the recipient. Add visual distinction between verified/unverified recipients.

---

### M5. Wildcard Image Hostname Pattern

**File:** `apps/web/next.config.js:46-48`

**Description:** `images.remotePatterns` allows `hostname: '**'` — image optimization from any HTTPS host. Can be abused for SSRF via Next.js image proxy.

**Fix:** Restrict to known hostnames (token icon CDNs, raw.githubusercontent.com).

---

### M6. Embed Route Allows Framing from Any Origin

**File:** `apps/web/next.config.js:111,119`

**Description:** Sets `frame-ancestors *` and `X-Frame-Options: ALLOWALL` for `/embed`. Any website can iframe the embed widget, creating clickjacking risk if wallet signing occurs within the frame.

**Fix:** Ensure all signing confirmations happen in the wallet's own UI. Offer an allowlist for merchants instead of `*`.

---

### M7. Verbose Console Logging of Sensitive Transaction Data

**Files:**
- `apps/web/src/components/QuotePreview.tsx:87-112, 164, 192-193, 252-253, 259`

**Description:** Multiple `console.log` calls expose deposit addresses, transaction amounts, wallet addresses, and API responses in production.

**Fix:** Remove all `console.log` from production. Use a logger stripped in production builds.

---

### M8. Error Messages Leak Internal Details

**Files:**
- `apps/web/src/app/api/quote/route.ts:186`
- `apps/web/src/app/api/tokens/route.ts:216`
- `apps/web/src/app/api/status/[depositAddress]/route.ts:93`
- `apps/web/src/app/api/frames/quote/route.ts:163`
- Multiple balance and admin routes

**Description:** Error responses include raw `error.message` in `details` field, potentially leaking internal URLs, DB schema, and infrastructure info.

**Fix:** Log full errors server-side only. Return generic messages to clients.

---

## Low Priority Findings

### L1. Encryption Fallback to Plaintext in secureStorage

**File:** `apps/web/src/lib/storage.ts:79-93, 109-113`

**Description:** `secureStorage` silently falls back to plaintext `localStorage` if encryption fails. The `obfuscatedStorage` uses base64 (trivially reversible).

**Fix:** Remove plaintext fallback — throw/don't store if encryption fails.

---

### L2. localStorage Data Can Influence Pre-filled Form Values

**Files:**
- `apps/web/src/hooks/useSmartDefaults.ts:33-43`
- `apps/web/src/hooks/useSmartFirstTransaction.ts:41-49`

**Description:** `goblink_patterns` in localStorage influences auto-filled chain/token selections. Tampered values could pre-select attacker-chosen routes.

**Fix:** Validate loaded route data against `SUPPORTED_CHAINS` before applying.

---

### L3. Address Book Has No Chain-Specific Address Validation

**File:** `apps/web/src/components/AddressBook.tsx:116-129`

**Description:** Users can save any string as an address for any chain. No format validation.

**Fix:** Validate address format against selected chain using `validators.ts`.

---

### L4. Payment Request Form Minimal Recipient Validation

**File:** `apps/web/src/components/PaymentRequestForm.tsx:39`

**Description:** Only validates `recipient.trim().length > 5`.

**Fix:** Validate against selected `toChain` address format.

---

### L5. Dependency: `bigint-buffer` Buffer Overflow

**Package:** `@solana/spl-token > @solana/buffer-layout-utils > bigint-buffer`
**Advisory:** GHSA-3gc7-fjrx-p6mg — Buffer overflow via `toBigIntLE()`. No patched version.

**Fix:** Check if `@solana/spl-token` has a newer version without this dependency.

---

### L6. Dependency: `tar` Path Traversal

**Package:** `supabase > tar`
**Advisory:** GHSA-qffp-2rhf-9h96 — Hardlink path traversal. Patched in `>=7.5.10`.

**Fix:** Add `"tar": ">=7.5.10"` to `pnpm.overrides` in root `package.json`.

---

### L7. Dependency: `elliptic` Crypto Weakness

**Package:** `near-api-js > @near-js/crypto > secp256k1 > elliptic`
**Advisory:** GHSA-848j-6mx2-7j84 — No patched version.

**Fix:** Monitor for `near-api-js` updates with an alternative crypto library.

---

### L8. Payment Link ID Brute-Force — 8-Character nanoid

**File:** `apps/web/src/app/api/pay/shorten/route.ts:14`

**Description:** 8-char nanoid (~2.8 * 10^14 combinations) combined with no rate limiting allows probing for valid payment links.

**Fix:** Increase to 16+ characters. Add rate limiting on status endpoint.

---

### L9. Non-null Assertions on Environment Variables

**Files:**
- `apps/web/src/lib/supabase-browser.ts:11-12`
- `apps/web/src/lib/supabase-server.ts:8-9`
- `apps/web/src/lib/server/db.ts:9-10`

**Description:** `process.env.VAR!` silently passes `undefined` if env var missing. `validateEnv()` in `env.ts` only checks 4 variables.

**Fix:** Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `validateEnv()` required list.

---

### L10. Missing Amount Upper Bound in Frame Wizard

**File:** `apps/web/src/app/frames/send/post/route.ts:249-255`

**Description:** Only validates `amount > 0`, no maximum. Extremely large amounts may cause unpredictable 1Click API behavior.

**Fix:** Add reasonable maximum amount validation.

---

## Positive Observations

- **Non-custodial architecture** — transaction signing correctly delegates to wallet providers; the server never holds private keys
- **Secret segregation** — all `NEXT_PUBLIC_` variables are appropriately public; sensitive keys (`ONE_CLICK_JWT`, `SUPABASE_SERVICE_ROLE_KEY`, RPC keys) are server-side only
- **No XSS in React components** — all user input rendered in JSX is properly escaped by React's default behavior; `dangerouslySetInnerHTML` uses only hardcoded content
- **No eval() or Function() constructor** in application code
- **Proper `rel="noopener noreferrer"`** on external links
- **Well-implemented validators library** — `validators.ts` has correct chain-specific validators, they're just underutilized
- **Same-origin API proxy pattern** — no direct third-party API calls with keys from the client

---

## Remediation Priority

| Priority | Action | Findings |
|----------|--------|----------|
| **Immediate** | Add auth to transaction write + payment completion endpoints | C1, C2 |
| **Immediate** | Sign/verify frame state; validate Farcaster signatures | C3, C4 |
| **Immediate** | Whitelist Solana RPC methods | C5 |
| **This week** | Add auth to transaction read/search endpoints | H3 |
| **This week** | Sanitize PostgREST filter input | H1 |
| **This week** | Add OAuth state parameter to GitHub flow | H4 |
| **This week** | HTML-escape frame meta tag content | H6 |
| **This week** | Use existing validators on all user-facing inputs | H2 |
| **This week** | Move fee calculation server-side | H7 |
| **Next sprint** | Implement rate limiting middleware | M1, M2 |
| **Next sprint** | Scope Supabase service role usage | M3 |
| **Next sprint** | Sanitize error responses | M8 |
| **Next sprint** | Restrict image hostnames, embed framing | M5, M6 |
| **Backlog** | Dependency overrides and monitoring | L5, L6, L7 |
| **Backlog** | Lengthen payment link IDs | L8 |
| **Backlog** | Remove console.log from production | M7 |
