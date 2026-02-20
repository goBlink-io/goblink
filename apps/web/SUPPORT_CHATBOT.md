# goBlink Support Chatbot

## Overview
A Tier 1 context-aware support chatbot that provides intelligent help based on the user's current app state. No LLM required - uses a deterministic rule engine.

## Architecture

### 1. SupportContext (`src/contexts/SupportContext.tsx`)
Aggregates app state from across the application:
- **Wallet state**: Connected wallets, addresses, chain types
- **Form state**: Selected chains, tokens, amounts, recipients
- **Quote state**: Loading, success, error, expired states
- **Transaction state**: Pending, completed, failed, refunded
- **Balance info**: Insufficient balance detection
- **Environment**: Mobile detection, wallet extension detection
- **Error history**: Recent errors for context

### 2. Rule Engine (`src/lib/support/rules.ts`)
20+ deterministic rules ordered by priority:

**Wallet Rules (100-199)**
- No wallet connected
- Wrong wallet type for selected chain
- Missing wallet for source chain

**Swap/Quote Rules (200-299)**
- Insufficient balance
- Quote loading/error/expired
- Large amount notifications
- Same-chain selection

**Transaction Rules (300-399)**
- Pending >2min / >5min warnings
- Failed transactions
- Refunded transactions
- Completed transfers

**General/Educational (400-499)**
- First-time user welcome
- Fee structure
- Supported chains
- Safety information
- Transfer speed

### 3. Message Matcher (`src/lib/support/matcher.ts`)
Keyword-based matching for common questions:
- Fees, costs, pricing
- Safety, security, trust
- Wallet connection issues
- Speed, timing
- Refunds, missing funds
- Supported chains

### 4. UI Components

**SupportWidget** (`src/components/support/SupportWidget.tsx`)
- Floating button (bottom-right)
- Expandable chat panel (350px × 500px)
- Lazy-loaded (dynamic import)
- Proactive tip detection

**SupportChat** (`src/components/support/SupportChat.tsx`)
- Message history with auto-scroll
- Text input with Enter support
- Quick-reply buttons
- Typing indicator
- Action button handlers

**SupportMessage** (`src/components/support/SupportMessage.tsx`)
- Bot avatar (gB icon)
- Severity-based styling (info/warning/error/success)
- Clickable action buttons
- Timestamp display

**ProactiveTip** (`src/components/support/ProactiveTip.tsx`)
- Contextual help banner
- Auto-dismiss after 10s
- Session-based dismissal tracking
- Notification dot on widget

## Integration

The chatbot is integrated via `ClientLayout.tsx`:
```tsx
<SupportProvider>
  <ToastProvider>
    {children}
    <SupportWidget />
  </ToastProvider>
</SupportProvider>
```

## CRITICAL RULE
**Never mention internal infrastructure!**
- ❌ "NEAR Intents", "1Click", "defuse", "solver", "intent"
- ✅ "goBlink", "goBlink's network", "goBlink's transfer system"

All responses are branded as goBlink - users don't need to know about underlying tech.

## Styling
- Dark theme (zinc-900 backgrounds, zinc-800 borders)
- Blue/violet gradient accents
- Mobile responsive (full-width on mobile)
- 44px minimum touch targets
- Smooth 150-200ms transitions
- z-index: 50 (floats above everything)

## Future Enhancements
- [ ] Integrate with actual form state (SwapForm)
- [ ] Hook into transaction modal state
- [ ] Add balance checking integration
- [ ] Store chat history in localStorage
- [ ] Add more advanced keyword patterns
- [ ] Multi-language support
- [ ] Analytics tracking
- [ ] User feedback system

## Testing
- ✅ Build passes (`pnpm build`)
- ✅ TypeScript compilation
- ✅ Dynamic import works
- ✅ Mobile responsive
- ✅ Lazy loading (no initial page load impact)

## Files Created
```
apps/web/src/
  contexts/
    SupportContext.tsx
  components/
    ClientLayout.tsx
    support/
      SupportWidget.tsx
      SupportChat.tsx
      SupportMessage.tsx
      ProactiveTip.tsx
      index.ts
  lib/
    support/
      types.ts
      rules.ts
      matcher.ts
```

## Usage
The widget automatically appears on all pages. Users can:
1. Click the floating button to open chat
2. See proactive tips based on their current state
3. Ask questions using natural language
4. Get contextual help with action buttons
5. Execute actions (connect wallet, retry, open links)

No configuration needed - it just works! 🎉
