# Farcaster Frames — Future Improvements

## Post-Launch Priority

### Farcaster Hub Signature Validation
- Currently reading `untrustedData.address` without verifying the frame message signature
- Should validate via Farcaster Hub API or Neynar to prevent address spoofing
- Low risk for now (address only used for `refundTo` in 1Click quotes)
- Requires: Neynar API key or direct Hub connection
- Reference: https://docs.farcaster.xyz/reference/frames/spec#frame-signature-packet

### Farcaster Frames v2 Support
- v2 enables non-EVM transaction signing (Solana, NEAR, etc.)
- Would unlock all 12 chains as source chains (currently EVM-only)
- Monitor: https://docs.farcaster.xyz/developers/frames/v2/
- When available: remove `SOURCE_CHAIN_PAGES` restriction, add multi-chain signing

### Frame Analytics
- Track funnel: cast impressions → button taps → step completions → tx signed
- Possible approach: lightweight event logging in each POST handler
- Dashboard: number of frames generated, conversion rates per mode (Send/Pay/Tip)
- Consider: Farcaster Frames analytics API if one becomes available

### Chain Logo Images in OG Cards
- Satori (next/og) can load images from URLs via `<img src="...">`
- Add actual chain logos next to chain names in the route summary
- Source: `/public/chains/` or external CDN
- Would make the frame cards much more visually distinctive

### Rate Limiting on `/api/frames/quote`
- Each tx button tap hits 1Click for a live quote with `dry: false`
- No rate limit currently — could get expensive if spammed
- Options: per-IP rate limit via middleware, or cache quotes for ~30s
- Consider: return cached quote if same params within TTL

## Nice-to-Have

### Custom Frame Builder Templates
- Pre-built templates: "Freelancer invoice", "Tip jar", "Donation drive"
- Each template pre-fills the builder with sensible defaults
- Could be a dropdown in the Frame Builder UI

### Frame Preview in Builder
- Render a live preview of the OG image as the user fills in the form
- Use the `/frames/image` endpoint with current params
- Show what the cast will look like before generating the link

### Multi-Language Support
- Frame step titles and button labels in user's preferred language
- Detect from Farcaster user profile or accept `lang` param

### QR Code Generation
- Generate a QR code alongside the frame link
- Useful for in-person payments: scan to open Warpcast → tap to pay
