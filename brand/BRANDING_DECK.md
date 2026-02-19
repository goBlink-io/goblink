# goBlink — Branding Deck
> Version 1.0 — February 2026

---

## Logo Concept: The Cursor

The goBlink logo is a **wordmark + cursor** design. The blinking text cursor after the wordmark represents:
- **Instant** — type and it's already done
- **Digital-native** — technology, not finance jargon
- **Action** — the cursor is ready, waiting for your next move

### Design Elements
- **"go"** — lowercase, Geist Sans 400 (regular weight)
- **"Blink"** — capitalized, Geist Sans 700 (bold weight)
- **Cursor** — vertical bar in blue→violet gradient (#2563EB → #7C3AED)
- Weight contrast between "go" and "Blink" creates visual rhythm

---

## Logo Variations

### 1. Primary (Full Color)
**File:** `4k-finals/logos/primary-full-color-4k.png`
**SVG:** `svg-specs/wordmark.svg`
**Use:** Default logo. Website header, documentation, presentations, business cards.
- Dark charcoal text on white/light backgrounds
- Gradient cursor accent

### 2. Negative (On Dark)
**File:** `4k-finals/logos/negative-on-dark-4k.png`
**SVG:** `svg-specs/wordmark-white.svg`
**Use:** Dark backgrounds, dark mode UI, app dark theme.
- White text with gradient cursor
- Use when background is dark (#09090B or similar)

### 3. Gradient Wordmark
**File:** `4k-finals/logos/gradient-wordmark-4k.png`
**SVG:** `svg-specs/wordmark-gradient.svg`
**Use:** Marketing hero sections, social media headers, promotional materials.
- Full text in blue→violet gradient
- Maximum brand impact — use sparingly for emphasis

### 4. Mono Black
**File:** `4k-finals/logos/mono-black-4k.png`
**SVG:** `svg-specs/wordmark-mono-black.svg`
**Use:** Print (single-color), fax, stamps, watermarks, legal documents.
- All black, no gradient
- Works when color isn't available

### 5. Mono White
**File:** `4k-finals/logos/mono-white-on-black-4k.png`
**SVG:** `svg-specs/wordmark-mono-white.svg`
**Use:** Photo overlays, video watermarks, merchandise on dark fabrics.
- All white, no gradient
- Use on dark photos, videos, or backgrounds where the gradient wouldn't be visible

---

## Icon / Favicon / App Icon

### Option A: The Cursor
**Files:** `4k-finals/icons/icon-cursor-dark-4k.png`, `icon-cursor-light-4k.png`
**SVG:** `svg-specs/icon-cursor.svg`
- Standalone gradient cursor bar on rounded square
- Dark variant: black background with gradient glow
- Light variant: white background with clean gradient
- **Pros:** Unique, conceptually tied to logo, ultra-minimal
- **Best for:** App icon on dark devices, favicon

### Option B: The gB Lettermark
**Files:** `4k-finals/icons/icon-gB-dark-4k.png`, `icon-gB-light-4k.png`
**SVG:** `svg-specs/icon-gB.svg`
- Gradient "gB" letters on rounded square
- Same weight contrast as wordmark (g=400, B=700)
- **Pros:** More recognizable, better brand recall
- **Best for:** Favicon, PWA icon, social media avatar, app stores

### Favicon (16×16 / 32×32)
**SVG:** `svg-specs/favicon.svg`
- gB lettermark optimized for tiny sizes
- Dark background for contrast at small scale

---

## Color System

### Brand Gradient
```
Direction: 135° (top-left to bottom-right)
Start: #2563EB (Blue 600)
End:   #7C3AED (Violet 600)
CSS:   linear-gradient(135deg, #2563EB, #7C3AED)
```

### Primary Solid
```
#2563EB — buttons, links, focus rings (when gradient isn't appropriate)
```

### Dark Background
```
#09090B — zinc-950 (app background, icon backgrounds)
```

### Text Colors
```
#18181B — zinc-900 (primary text on light)
#FFFFFF — white (primary text on dark)
#71717A — zinc-500 (secondary/muted text)
```

---

## Typography

### Font Stack
```
Primary:  Geist Sans (native to Next.js via `geist` package)
Mono:     Geist Mono (code, technical contexts)
Fallback: Inter, -apple-system, BlinkMacSystemFont, sans-serif
```

### Weight Usage
| Weight | Name | Usage |
|--------|------|-------|
| 400 | Regular | Body text, "go" in wordmark |
| 500 | Medium | UI labels, navigation |
| 600 | Semibold | Headings, emphasis |
| 700 | Bold | "Blink" in wordmark, CTAs |

---

## Logo Spacing Rules

- **Minimum clear space:** Equal to cap-height of "B" on all sides
- **Minimum width:** 80px (wordmark), 16px (icon)
- **Never:** stretch, rotate, skew, add shadows, recolor with off-brand colors
- **Never:** place on busy/cluttered backgrounds without sufficient contrast

---

## File Structure

```
brand/
├── BRANDING_DECK.md          ← this file
├── logos/                     ← 2K drafts (reference)
│   ├── primary-full-color.png
│   ├── negative-on-dark.png
│   ├── gradient-wordmark.png
│   ├── mono-black.png
│   └── mono-white-on-black.png
├── icons/                     ← 2K drafts (reference)
│   ├── icon-cursor-dark.png
│   ├── icon-cursor-light.png
│   ├── icon-gB-dark.png
│   └── icon-gB-light.png
├── 4k-finals/                 ← Production-ready 4K assets
│   ├── logos/
│   │   ├── primary-full-color-4k.png
│   │   ├── negative-on-dark-4k.png
│   │   ├── gradient-wordmark-4k.png
│   │   ├── mono-black-4k.png
│   │   └── mono-white-on-black-4k.png
│   └── icons/
│       ├── icon-cursor-dark-4k.png
│       ├── icon-cursor-light-4k.png
│       ├── icon-gB-dark-4k.png
│       └── icon-gB-light-4k.png
├── svg-specs/                 ← Vector specifications
│   ├── wordmark.svg           (dark text, gradient cursor)
│   ├── wordmark-white.svg     (white text, gradient cursor)
│   ├── wordmark-gradient.svg  (full gradient text + cursor)
│   ├── wordmark-mono-black.svg
│   ├── wordmark-mono-white.svg
│   ├── icon-cursor.svg        (cursor icon, dark bg)
│   ├── icon-gB.svg            (lettermark, dark bg)
│   └── favicon.svg            (32×32 optimized)
└── options/                   ← (reserved for future explorations)
```

---

## Transparent PNG Note

The Gemini image generator produces PNGs with solid backgrounds (white or black). For production transparent PNGs:

**Method 1 — Background Removal (quick):**
```bash
# Using ImageMagick (white bg → transparent)
convert input.png -fuzz 10% -transparent white output-transparent.png

# For black backgrounds
convert input.png -fuzz 10% -transparent black output-transparent.png
```

**Method 2 — Professional (recommended for final assets):**
- Use the SVG specs in `svg-specs/` as the source of truth
- Export transparent PNGs at any resolution from the SVGs
- SVGs are inherently transparent — no background removal needed
- Use Figma, Illustrator, or Inkscape to export

**Method 3 — From SVG via CLI:**
```bash
# Using Inkscape CLI
inkscape svg-specs/wordmark.svg --export-type=png --export-width=4096 --export-filename=wordmark-transparent-4k.png

# Using rsvg-convert (librsvg)
rsvg-convert -w 4096 svg-specs/wordmark.svg > wordmark-transparent-4k.png
```

---

## Quick Reference

| Need | Use This |
|------|----------|
| Website header (light mode) | `wordmark.svg` or `primary-full-color-4k.png` |
| Website header (dark mode) | `wordmark-white.svg` or `negative-on-dark-4k.png` |
| Marketing hero | `wordmark-gradient.svg` or `gradient-wordmark-4k.png` |
| Print / single color | `wordmark-mono-black.svg` or `mono-black-4k.png` |
| Video overlay | `wordmark-mono-white.svg` or `mono-white-on-black-4k.png` |
| Favicon | `favicon.svg` → export to .ico |
| PWA / app icon | `icon-gB.svg` or `icon-gB-dark-4k.png` |
| Social media avatar | `icon-gB-dark-4k.png` (crop to circle) |
| App store listing | `icon-gB-dark-4k.png` or `icon-cursor-dark-4k.png` |
| OG / Twitter card | `gradient-wordmark-4k.png` |

---

*goBlink — Move value anywhere, instantly.*
