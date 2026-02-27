# SEO Fixes for goblink.io

All work is in this directory: apps/web/

## 1. Add llms.txt
Create `public/llms.txt` with a plain-text description of goBlink for AI crawlers:
- What goBlink is (cross-chain token transfer platform)
- Supported chains (12 active: Ethereum, Solana, Base, Arbitrum, Sui, Polygon, BNB, Optimism, Aptos, Starknet, Tron, NEAR)
- 65+ tokens supported
- Non-custodial, auto-refund on failure
- Key pages: / (landing), /app (swap interface), /history (transaction history), /pay (payment requests), /widget (embeddable), /embed, /terms, /privacy, /api-docs
- API info if relevant
- Contact: admin@goblink.io, X: @goBlink_io
Keep it concise. See https://llmstxt.org for format reference.

## 2. Add JSON-LD Structured Data
In `src/app/layout.tsx`, add two JSON-LD `<script type="application/ld+json">` blocks in the `<head>`:

### WebApplication schema:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "goBlink",
  "url": "https://goblink.io",
  "description": "Transfer tokens across 12 blockchains in under 60 seconds. One click, any chain, no bridges. Non-custodial with auto-refund on failure.",
  "applicationCategory": "DeFi",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": ["Cross-chain transfers", "65+ tokens", "12 blockchains", "Non-custodial", "Auto-refund", "Payment requests", "Embeddable widget"]
}
```

### Organization schema:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "goBlink",
  "url": "https://goblink.io",
  "logo": "https://goblink.io/icon-512.png",
  "sameAs": ["https://x.com/goBlink_io"],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "admin@goblink.io",
    "contactType": "customer support"
  }
}
```

## 3. Fix h1 opacity for crawlers
In the landing page component (likely `src/app/page.tsx` or a component it imports), the h1 tag has inline `style={{opacity:0, transform:'translateY(24px)'}}`. This means crawlers see an invisible h1.

Fix: Remove the inline opacity:0 from the h1's initial style. Instead, use a CSS class that starts visible and optionally animates in via JS/intersection observer. The h1 content is "Skip the bridge. Just send it." — it MUST be visible to crawlers on initial render.

Same issue affects the hero subtitle, CTA buttons, stat counters, and feature sections — they all have `opacity:0` inline. Fix the h1 at minimum; ideally fix all hero content to be server-rendered visible.

## 4. Add missing pages to sitemap
Edit `src/app/sitemap.ts` to include:
- `/app` (priority 0.9, changefreq daily) — this is the actual product
- `/pay` (priority 0.7, changefreq weekly)
- `/api-docs` (priority 0.6, changefreq monthly)

## 5. Git
- Create branch `seo/llms-jsonld-fixes` from develop
- Commit all changes with message: `feat(seo): add llms.txt, JSON-LD schema, fix h1 visibility, expand sitemap`
- Push to origin

Do NOT touch any other files. Do NOT modify functionality. SEO-only changes.
