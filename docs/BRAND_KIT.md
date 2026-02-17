# goBlink Brand Kit
> The complete brand system for universal value transfer.
> Version 1.0 — February 2026

---

## 1. Brand Foundation

### Mission
Make moving value between any blockchain as simple as sending a text message.

### Core Concept
**Universal value transfer** — one protocol that works for a crypto trader swapping tokens, a developer building an app, a Shopify merchant accepting payments, and a DEX aggregating liquidity across chains.

### Tagline
**Primary:** Move value anywhere, instantly.

**Phase-specific:**
| Phase | Tagline |
|-------|---------|
| Swap | One click. Any chain. Seconds. |
| SDK | Cross-chain payments in 5 lines of code. |
| Connect | Add cross-chain to your protocol. |
| Pay | Accept crypto from any chain. Get paid how you want. |
| Exchange | Every asset. Every chain. Everyone. |

---

## 2. Logo

### Concept
The goBlink logo is a **wordmark** with an integrated **blink symbol** — a stylized cursor/bolt mark replacing the dot on the "i" in "Blink" (or sitting after the wordmark). The symbol represents instant transfer — a blink of movement between two points.

### Wordmark
- **"go"** — lowercase, regular weight (Geist Sans 400)
- **"Blink"** — capitalized, bold weight (Geist Sans 700)
- Combined: **goBlink** — always written in camelCase
- The weight contrast between "go" (light) and "Blink" (bold) creates visual rhythm and emphasizes the action word

### Symbol Mark
A standalone icon for favicons, app icons, and small-space uses:
- Abstract **"gB"** lettermark or **blink/bolt** icon
- Must be legible at 16×16px (favicon)
- Works in single color (white on dark, dark on light)
- Placeholder until professional design is commissioned: use bold "gB" in Geist Mono, or a lightning cursor icon

### Logo Spacing
- Minimum clear space around logo: equal to the cap-height of the "B"
- Never stretch, rotate, or recolor with off-brand colors
- Minimum display size: 80px wide (wordmark), 16px (symbol)

### Logo Variations
| Variant | Usage |
|---------|-------|
| Full wordmark (dark text) | Light backgrounds |
| Full wordmark (white text) | Dark backgrounds |
| Symbol only (dark) | Favicons, app icons, light bg |
| Symbol only (white) | Favicons, app icons, dark bg |
| Gradient wordmark | Marketing hero, social media |

---

## 3. Color System

### Brand Colors

**Primary Gradient**
```
Blue:    #2563EB  (blue-600)
Purple:  #7C3AED  (violet-600)
Gradient: linear-gradient(135deg, #2563EB, #7C3AED)
```
Used for: Primary CTAs, brand accent, hero elements, logo gradient variant.

**Primary Solid** (when gradient isn't appropriate)
```
#2563EB  — Primary actions, links, focus rings
```

### Neutral Palette

**Dark Mode (default for crypto-facing surfaces)**
```
bg-primary:    #09090B   (zinc-950)    — Page background
bg-surface:    #18181B   (zinc-900)    — Card/panel background
bg-elevated:   #27272A   (zinc-800)    — Hover states, elevated cards
border:        #3F3F46   (zinc-700)    — Subtle borders
border-muted:  #27272A   (zinc-800)    — Very subtle borders
```

**Light Mode (default for merchant/Web2-facing surfaces)**
```
bg-primary:    #FAFAFA   (zinc-50)     — Page background
bg-surface:    #FFFFFF   (white)       — Card/panel background
bg-elevated:   #F4F4F5   (zinc-100)    — Hover states
border:        #E4E4E7   (zinc-200)    — Subtle borders
border-muted:  #F4F4F5   (zinc-100)    — Very subtle borders
```

**Text**
```
Dark mode:
  text-primary:    #FAFAFA   (zinc-50)
  text-secondary:  #A1A1AA   (zinc-400)
  text-muted:      #71717A   (zinc-500)
  text-faint:      #52525B   (zinc-600)

Light mode:
  text-primary:    #09090B   (zinc-950)
  text-secondary:  #52525B   (zinc-600)
  text-muted:      #71717A   (zinc-500)
  text-faint:      #A1A1AA   (zinc-400)
```

### Semantic Colors

```
Success:
  base:    #10B981   (emerald-500)
  soft:    #059669   (emerald-600)     — dark mode text
  bg:      #022C22   (emerald-950/50)  — dark mode badge bg
  bg-lt:   #ECFDF5   (emerald-50)     — light mode badge bg

Warning:
  base:    #F59E0B   (amber-500)
  soft:    #D97706   (amber-600)
  bg:      #451A03   (amber-950/50)
  bg-lt:   #FFFBEB   (amber-50)

Error:
  base:    #EF4444   (red-500)
  soft:    #DC2626   (red-600)
  bg:      #450A0A   (red-950/50)
  bg-lt:   #FEF2F2   (red-50)

Info:
  base:    #2563EB   (blue-600)  — same as primary
  soft:    #3B82F6   (blue-500)
  bg:      #172554   (blue-950/50)
  bg-lt:   #EFF6FF   (blue-50)
```

### Accent Glow (hover/focus effects)
```css
/* Blue glow */
box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.3), 0 0 20px rgba(37, 99, 235, 0.1);

/* Purple glow */
box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.3), 0 0 20px rgba(124, 58, 237, 0.1);

/* Success glow */
box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.1);
```

### Sub-Brand Accent Colors
```
Swap:     #2563EB  (blue)     — The default/primary
SDK:      #2563EB  (blue)     — Developer docs share primary
Connect:  #7C3AED  (violet)   — Protocol integration
Pay:      #10B981  (emerald)  — Money/merchant
Exchange: #7C3AED  (violet)   — Trading/advanced
```

---

## 4. Typography

### Font Stack
```css
/* Sans (primary) */
font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Mono (addresses, code, numbers) */
font-family: 'Geist Mono', 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
```

### Installation (Next.js)
```typescript
// app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export default function RootLayout({ children }) {
  return (
    <html className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

```javascript
// tailwind.config.ts
fontFamily: {
  sans: ['var(--font-geist-sans)', ...defaultTheme.fontFamily.sans],
  mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],
}
```

### Type Scale

**Headings** (Geist Sans, bold/extrabold)
| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Hero | 56px / 3.5rem | 800 | 1.1 | -0.02em | Marketing hero (one per page max) |
| H1 | 40px / 2.5rem | 700 | 1.15 | -0.02em | Page titles |
| H2 | 32px / 2rem | 700 | 1.2 | -0.01em | Section headings |
| H3 | 24px / 1.5rem | 600 | 1.3 | -0.01em | Card titles, sub-sections |
| H4 | 20px / 1.25rem | 600 | 1.4 | 0 | Small headings |
| H5 | 16px / 1rem | 600 | 1.5 | 0 | Labels, overlines |

**Body** (Geist Sans, regular/medium)
| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Body Large | 18px / 1.125rem | 400 | 1.6 | Marketing paragraphs |
| Body | 16px / 1rem | 400 | 1.6 | Default body text |
| Body Small | 14px / 0.875rem | 400 | 1.5 | Secondary text, descriptions |
| Caption | 13px / 0.8125rem | 400 | 1.4 | Tertiary text, timestamps |
| Tiny | 12px / 0.75rem | 500 | 1.4 | Badges, labels, overlines |

**Mono** (Geist Mono)
| Name | Size | Usage |
|------|------|-------|
| Mono Body | 14px | Wallet addresses, transaction hashes |
| Mono Small | 13px | Inline code, token amounts |
| Mono Tiny | 12px | Contract addresses in tight spaces |

### Fluid Typography (responsive)
```css
/* Hero: 36px → 56px */
.text-hero { font-size: clamp(2.25rem, 4vw + 1rem, 3.5rem); }

/* H1: 28px → 40px */
.text-h1 { font-size: clamp(1.75rem, 3vw + 0.5rem, 2.5rem); }

/* H2: 24px → 32px */
.text-h2 { font-size: clamp(1.5rem, 2vw + 0.5rem, 2rem); }
```

---

## 5. Spacing & Layout

### Spacing Scale (4px base)
```
0:   0px
1:   4px
2:   8px
3:   12px
4:   16px
5:   20px
6:   24px
8:   32px
10:  40px
12:  48px
16:  64px
20:  80px
24:  96px
32:  128px
```

### Layout Widths
```
Swap card:     max-w-[480px]   — Centered, compact
Content:       max-w-2xl       — 672px — Blog, docs, standard pages
Wide content:  max-w-4xl       — 896px — Feature sections
Full bleed:    max-w-7xl       — 1280px — Navigation, footer, hero backgrounds
```

### Section Spacing
```
Between major sections:  py-24 (96px) desktop / py-16 (64px) mobile
Between sub-sections:    py-12 (48px) / py-8 (32px)
Card internal padding:   p-6 (24px) / p-4 (16px) mobile
```

### Border Radius
```
Tiny:    rounded (4px)       — Tags, badges
Small:   rounded-lg (8px)    — Buttons, inputs
Medium:  rounded-xl (12px)   — Cards, panels
Large:   rounded-2xl (16px)  — Modals, major containers
Full:    rounded-full         — Avatars, pills, chain logos
```

---

## 6. Component Tokens

### Buttons

**Primary** (gradient)
```css
background: linear-gradient(135deg, #2563EB, #7C3AED);
color: white;
font-weight: 600;
padding: 12px 24px;
border-radius: 12px;
transition: opacity 150ms;
/* Hover: opacity 0.9 */
/* Active: opacity 0.85 */
/* Disabled: opacity 0.5, cursor not-allowed */
```

**Secondary** (outline)
```css
background: transparent;
border: 1px solid var(--border);
color: var(--text-primary);
/* Hover: bg var(--bg-elevated) */
```

**Ghost** (text only)
```css
background: transparent;
color: var(--text-secondary);
/* Hover: color var(--text-primary), bg var(--bg-elevated) */
```

**Destructive**
```css
background: #EF4444;
color: white;
/* Hover: #DC2626 */
```

**Button Sizes**
| Size | Padding | Font | Min Height |
|------|---------|------|------------|
| sm | 8px 16px | 13px/600 | 32px |
| md | 12px 24px | 14px/600 | 40px |
| lg | 16px 32px | 16px/600 | 48px |

### Cards
```css
/* Dark mode */
background: #18181B;
border: 1px solid #27272A;
border-radius: 12px;
/* Hover: border-color #3F3F46, box-shadow 0 0 20px rgba(37, 99, 235, 0.05) */

/* Light mode */
background: #FFFFFF;
border: 1px solid #E4E4E7;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
/* Hover: border-color #D4D4D8, box-shadow 0 4px 12px rgba(0, 0, 0, 0.06) */
```

### Inputs
```css
background: var(--bg-primary);
border: 1px solid var(--border);
border-radius: 8px;
padding: 10px 14px;
font-size: 14px;
color: var(--text-primary);
/* Focus: border-color #2563EB, ring 2px rgba(37, 99, 235, 0.2) */
/* Error: border-color #EF4444 */
/* Placeholder: var(--text-muted) */
```

### Modals
```css
/* Overlay */
background: rgba(0, 0, 0, 0.6);
backdrop-filter: blur(8px);

/* Modal panel */
background: var(--bg-surface);
border: 1px solid var(--border);
border-radius: 16px;
max-width: 480px;
max-height: 90vh;
overflow-y: auto;

/* Mobile: slides up from bottom */
border-radius: 16px 16px 0 0;  /* mobile */
width: 100%;
```

### Badges / Tags
```css
padding: 2px 8px;
border-radius: 4px;
font-size: 12px;
font-weight: 500;
/* Use semantic color bg + text combos */
```

---

## 7. Animation

### Principles
1. **Purposeful** — Every animation communicates state change
2. **Fast** — Most transitions under 200ms
3. **Subtle** — Scale changes ≤ 3%, opacity fades, small translateY
4. **Consistent** — Same easing everywhere

### Easing
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Primary — entrances */
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);   /* Reversible — toggles */
--spring: cubic-bezier(0.34, 1.56, 0.64, 1);     /* Bouncy — success states */
```

### Duration
```
Micro:   100ms  — Button press, toggle
Fast:    150ms  — Hover states, focus
Normal:  200ms  — Panel open, tab switch
Slow:    300ms  — Modal open, page transition
Enter:   400ms  — First-paint entrance, hero reveal
```

### Framer Motion Presets
```typescript
// Page entrance
export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

// Modal
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

// Card hover
export const cardHover = {
  whileHover: { y: -2, transition: { duration: 0.15 } },
};

// Swap flip button
export const flipRotate = {
  animate: { rotate: 180 },
  transition: { type: 'spring', stiffness: 200, damping: 15 },
};

// Number count-up (use with useInView)
export const countUp = {
  from: 0,
  duration: 1.5,
  ease: [0.16, 1, 0.3, 1],
};

// Stagger children
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};
```

---

## 8. Iconography

### Primary: Lucide React
```bash
pnpm add lucide-react
```
- Consistent 24px grid, 1.5px stroke weight
- Tree-shakeable — only imports what you use
- Covers all our needs: arrows, wallets, chains, status, navigation

### Chain Logos
- Source: `src/lib/chain-logos.ts` (already built)
- Displayed as 20-32px rounded circles
- Always include `onError` fallback hiding

### Icon Sizes
| Context | Size | Stroke |
|---------|------|--------|
| Inline with text | 16px | 1.5px |
| Button icon | 18px | 1.5px |
| Feature card | 24px | 1.5px |
| Hero feature | 32px | 1.5px |
| Empty state | 48px | 1px |

---

## 9. Voice & Copy

### Voice Attributes
| Attribute | Description | Example |
|-----------|-------------|---------|
| **Clear** | No jargon. If a 15-year-old can't understand it, rewrite it. | "Transfer" not "bridge" |
| **Confident** | State facts. No hedging, no "we believe." | "Transfers in seconds" not "designed for speed" |
| **Specific** | Use numbers. Always. | "29 chains" not "many blockchains" |
| **Calm** | Even errors feel reassuring. | "Your funds are safe. Try again." |
| **Human** | Write like a person, not a corporation. | "Pick your tokens and go" not "Select assets to initiate" |

### Tone by Context

**App UI** — Calm, minimal, confident
```
Good: "Transfer complete · 24 seconds"
Bad:  "Congratulations! Your cross-chain swap was successful!"
```

**Marketing** — Bold, direct, aspirational
```
Good: "One click. Any chain. Seconds."
Bad:  "The next generation of cross-chain interoperability solutions."
```

**Errors** — Reassuring, specific, actionable
```
Good: "Not enough ETH for this transfer. You need 0.003 more."
Bad:  "Error: Insufficient funds (code: ERR_BALANCE)"
```

**Developer docs** — Neutral, precise, code-first
```
Good: "Initialize the client with your API key:
       const client = new GoBlink({ apiKey: '...' })"
Bad:  "Getting started with our amazing SDK is super easy!"
```

**Social/community** — Human, witty, never corporate
```
Good: "Just added Tron support. Your TRX is welcome here 🤝"
Bad:  "We are pleased to announce Tron network integration."
```

### Word Choice

| ❌ Don't Say | ✅ Say Instead |
|-------------|---------------|
| Bridge | Transfer |
| Swap (as noun) | Transfer / Exchange |
| Slippage | Price protection |
| Gas fee | Network fee |
| Deposit address | Transfer address |
| Non-custodial | You stay in control |
| Liquidity | (omit) |
| TVL | (omit) |
| DeFi (to Web2 audience) | Decentralized finance (first mention), then omit |
| Execute a transaction | Send / Transfer |
| Initiate | Start |
| Utilize | Use |
| Leverage | Use |

---

## 10. Brand Architecture

```
goBlink ─────────────── Master brand
│
├── Swap ─────────────── goblink.io (consumer app)
│   Primary color: Blue (#2563EB)
│   Audience: Crypto users, newcomers
│
├── SDK ──────────────── docs.goblink.io (future)
│   Primary color: Blue (#2563EB)
│   Audience: Developers
│
├── Connect ──────────── connect.goblink.io (future)
│   Accent: Violet (#7C3AED)
│   Audience: DEX/Launchpad operators
│
├── Pay ──────────────── pay.goblink.io (future)
│   Accent: Emerald (#10B981)
│   Audience: Merchants, ecommerce
│
└── Exchange ─────────── exchange.goblink.io (future)
    Accent: Violet (#7C3AED)
    Audience: Traders, power users
```

All sub-brands share: Geist font, logo, neutral palette, spacing system, component library. Only the accent color shifts to signal context.

---

## 11. Implementation Checklist

### Immediate (Phase 1 — Swap Interface)
- [ ] Install `geist` package, configure in layout.tsx
- [ ] Create CSS custom properties from color system above
- [ ] Update Tailwind config with brand tokens
- [ ] Replace all hardcoded colors with design tokens
- [ ] Apply typography scale to all components
- [ ] Update button styles to match component tokens
- [ ] Update card styles (swap card, feature cards)
- [ ] Update modal styles (TransferModal, ConnectWalletModal)
- [ ] Add Framer Motion for page entrance + modal transitions
- [ ] Create text-only logo as wordmark (Geist Sans)
- [ ] Update favicon with symbol mark
- [ ] Dark mode as default, light mode polished

### Near-term
- [ ] Commission professional logo/symbol design
- [ ] Build component library as shared package
- [ ] Create marketing landing page sections
- [ ] Add stats bar with real/placeholder data
- [ ] FAQ section
- [ ] Footer

### Future (Phase 2+)
- [ ] Developer documentation site (docs.goblink.io)
- [ ] SDK package with theming API
- [ ] Merchant checkout embed (goBlink Pay)
- [ ] White-label variant for Connect partners

---

## 12. File Reference

| File | Purpose |
|------|---------|
| `docs/BRAND_KIT.md` | This document — the source of truth |
| `docs/DESIGN_RESEARCH.md` | Crypto/Web3 design research |
| `docs/WEB2_DESIGN_RESEARCH.md` | Web2/platform design research |
| `memory/neuro-behavioral-design.md` | Behavioral science frameworks |
| `src/lib/chain-logos.ts` | Chain logo assets |

---

*goBlink Brand Kit v1.0 — February 2026*
*Built by Urban Blazer & Morpheus*
