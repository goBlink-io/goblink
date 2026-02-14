# Sapphire Troubleshooting Guide

This guide covers common issues encountered during development, testing, and operation of the Sapphire cross-chain swap platform.

---

## Table of Contents

1. [Setup Issues](#setup-issues)
2. [Backend API Issues](#backend-api-issues)
3. [Frontend Issues](#frontend-issues)
4. [Wallet Connection Issues](#wallet-connection-issues)
5. [Quote & Swap Issues](#quote--swap-issues)
6. [Status Tracking Issues](#status-tracking-issues)
7. [Performance Issues](#performance-issues)
8. [1Click API Issues](#1click-api-issues)

---

## Setup Issues

### Issue: `npm install` fails with dependency errors

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**
1. Clear npm cache:
```bash
npm cache clean --force
```

2. Delete node_modules and package-lock.json:
```bash
rm -rf node_modules package-lock.json
npm install
```

3. Use `--legacy-peer-deps`:
```bash
npm install --legacy-peer-deps
```

4. Check Node.js version (requires v18+):
```bash
node --version
```

---

### Issue: Turbo commands not working

**Symptoms:**
```
turbo: command not found
```

**Solution:**
Install turbo globally:
```bash
npm install -g turbo
```

Or use via npx:
```bash
npx turbo dev
```

---

### Issue: `.env` file not loading

**Symptoms:**
- Backend reports missing `ONE_CLICK_JWT`
- Database/Redis connections fail silently

**Solutions:**
1. Verify `.env` file exists in project root (not in apps/ subdirectories)
2. Check file name is exactly `.env` (not `.env.txt` or `.env.example`)
3. Restart both backend and frontend after changing `.env`
4. Verify environment variables load:
```bash
# In backend
console.log('JWT loaded:', !!process.env.ONE_CLICK_JWT);
```

---

## Backend API Issues

### Issue: "Failed to fetch tokens"

**Error Response:**
```json
{
  "error": "Failed to fetch tokens",
  "message": "Request failed with status code 401"
}
```

**Causes & Solutions:**

**Cause 1: Missing or invalid API key**
- Check `.env` has `ONE_CLICK_JWT=your_jwt_here`
- Verify JWT is valid at https://partners.near-intents.org
- Ensure no extra spaces or quotes in `.env`

**Cause 2: API key expired**
- JWT tokens may have expiration
- Generate new token from Partners Portal
- Update `.env` and restart backend

**Cause 3: Network/firewall blocking**
- Test 1Click API directly:
```bash
curl https://1click.chaindefuser.com/v0/tokens \
  -H "Authorization: Bearer YOUR_JWT"
```
- Check corporate firewall settings
- Try from different network

---

### Issue: Backend won't start - Port already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**

**On Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**On Mac/Linux:**
```bash
lsof -i :3001
kill -9 <PID>
```

**Or change port in `.env`:**
```
API_PORT=3002
```

---

### Issue: Database connection fails

**Error:**
```
health: {
  database: "error"
}
```

**Solutions:**
1. Check `DATABASE_URL` format:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

2. Verify PostgreSQL is running:
```bash
# Mac
brew services list

# Linux
sudo systemctl status postgresql

# Windows
# Check Services app for PostgreSQL
```

3. Test connection manually:
```bash
psql $DATABASE_URL
```

4. Run without database (MVP supports this):
```bash
# Remove DATABASE_URL from .env or set:
DATABASE_URL=
```

---

### Issue: Redis connection fails

**Error:**
```
health: {
  cache: "error"
}
```

**Solutions:**
1. Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

2. Check `REDIS_URL` format:
```
REDIS_URL=redis://localhost:6379
```

3. Run without Redis (MVP supports this):
```bash
# Remove REDIS_URL from .env
```

---

## Frontend Issues

### Issue: "Failed to fetch" errors in browser

**Symptoms:**
- Console shows `TypeError: Failed to fetch`
- Network tab shows CORS errors

**Solutions:**

**Cause 1: Backend not running**
```bash
# Start backend
cd apps/api
npm run dev
```

**Cause 2: Wrong backend URL**
- Check frontend is calling `http://localhost:3001`
- Verify `CORS_ORIGIN` in backend `.env` includes `http://localhost:3000`

**Cause 3: CORS misconfiguration**
- Ensure backend has correct CORS settings:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
```

---

### Issue: Wallet buttons not appearing

**Symptoms:**
- Connect wallet buttons are missing
- Console shows React hydration errors

**Solutions:**

**Cause 1: Provider not wrapped correctly**
- Check `Web3Provider.tsx` wraps the app
- Verify RainbowKit setup in `layout.tsx`

**Cause 2: Client-side only components**
- Ensure components use `'use client'` directive:
```typescript
'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
```

**Cause 3: Missing dependencies**
```bash
cd apps/web
npm install @rainbow-me/rainbowkit wagmi viem
```

---

### Issue: Page styles not loading

**Symptoms:**
- Unstyled HTML appears
- Tailwind classes not applied

**Solutions:**
1. Check `tailwind.config.ts` content paths include all component directories
2. Restart dev server after Tailwind config changes
3. Verify `globals.css` imports Tailwind:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Wallet Connection Issues

### Issue: MetaMask not connecting

**Symptoms:**
- "Connect Wallet" does nothing
- MetaMask doesn't prompt

**Solutions:**

**Cause 1: Wrong network**
- MetaMask may be on unsupported network
- Switch to Ethereum Mainnet or supported testnet

**Cause 2: Site not trusted**
- Open MetaMask → Settings → Connected sites
- Remove and re-add localhost:3000

**Cause 3: Browser extension conflicts**
- Disable other wallet extensions temporarily
- Try in incognito mode

**Cause 4: RainbowKit configuration issue**
- Check wagmi config includes correct chains:
```typescript
const chains = [mainnet, polygon, optimism, arbitrum, base];
```

---

### Issue: Wallet connects but address not showing

**Symptoms:**
- Wallet shows as connected
- Address field remains empty

**Solutions:**
1. Check `useAccount()` hook is called correctly:
```typescript
const { address, isConnected } = useAccount();
```

2. Verify state updates in parent component
3. Check browser console for React errors

---

### Issue: "Unsupported chain" error

**Symptoms:**
- Wallet connects but shows warning
- Can't proceed with transaction

**Solutions:**
1. Add chain to wagmi config:
```typescript
import { avalanche } from 'wagmi/chains';
const chains = [mainnet, polygon, avalanche];
```

2. Or switch wallet to supported chain
3. Check 1Click API supports the chain

---

## Quote & Swap Issues

### Issue: "refundTo is not valid"

**Error:**
```json
{
  "error": "Invalid address format",
  "message": "refundTo is not valid"
}
```

**Solutions:**

**Cause 1: Address format mismatch**
- Origin chain is EVM, but refundTo is NEAR address
- Solution: Use address format matching origin chain
  - EVM: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5`
  - NEAR: `account.near` or 64-char hex
  - Solana: Base58 address
  - Bitcoin: Legacy, SegWit, or Taproot

**Cause 2: Typo in address**
- Verify address is complete and correctly formatted
- Copy directly from wallet instead of typing

**Cause 3: Test address for wrong chain**
- Don't use `test.near` for EVM swaps
- Use chain-specific addresses

---

### Issue: "Invalid amount" error

**Symptoms:**
- Quote request fails with amount error
- Amount shows as NaN or undefined

**Solutions:**

**Cause 1: Decimal mismatch**
- Amount must be in smallest unit (wei, yocto, etc.)
- Example: 1 NEAR = 1e24 yoctoNEAR
```typescript
// Correct
const amount = (1 * 10**24).toString();

// Wrong
const amount = "1";
```

**Cause 2: Number too large**
- JavaScript number precision issues
- Use string representation:
```typescript
const amount = "1000000000000000000000000"; // Good
const amount = 1e24; // May lose precision
```

---

### Issue: Quote returns very different amounts

**Symptoms:**
- Output amount much lower than expected
- Large price impact

**Solutions:**

**Cause 1: Low liquidity pair**
- Some token pairs have limited liquidity
- Try more popular pairs (USDC, ETH, wNEAR)

**Cause 2: Large trade size**
- Large trades have higher slippage
- Consider splitting into smaller swaps

**Cause 3: Incorrect decimal handling**
- Verify decimals used match token:
```typescript
// wNEAR has 24 decimals
// USDC has 6 decimals
```

---

### Issue: No deposit address received

**Error:**
```json
{
  "error": "No deposit address received"
}
```

**Solutions:**

**Cause 1: Using dry: true**
- Dry runs don't generate deposit addresses
- Solution: Set `dry: false` in quote request

**Cause 2: API rate limiting**
- Too many requests in short time
- Wait 30 seconds and retry

**Cause 3: Invalid quote parameters**
- Check all required fields present and valid
- Verify deadline is in future

---

## Status Tracking Issues

### Issue: Status stuck on "PENDING_DEPOSIT"

**Symptoms:**
- Status doesn't update after sending funds
- Polling continues but no change

**Solutions:**

**Cause 1: Funds not yet confirmed**
- Wait for blockchain confirmation (varies by chain)
- Ethereum: 1-2 minutes
- Bitcoin: 10-60 minutes
- NEAR: 5-10 seconds

**Cause 2: Wrong deposit address**
- Verify sent to exact address shown
- Check transaction on block explorer

**Cause 3: Wrong amount sent**
- Must send exact amount from quote
- Even 1 wei difference can cause issues

**Cause 4: Wrong token sent**
- Verify sent correct token type
- Example: Sent USDT instead of USDC

---

### Issue: Status shows 404 "Swap not found"

**Symptoms:**
```json
{
  "error": "Swap not found",
  "message": "No swap found for this deposit address"
}
```

**Solutions:**

**Cause 1: Invalid deposit address**
- Double-check address is correct
- Address must be from confirmed quote (dry: false)

**Cause 2: Swap expired**
- Deadline passed before deposit
- Create new quote

**Cause 3: Network delay**
- Wait 1-2 minutes and retry
- 1Click API may be processing

---

### Issue: Status polling stops working

**Symptoms:**
- Network requests stop appearing
- Status frozen at old value

**Solutions:**

**Cause 1: Component unmounted**
- User navigated away
- Normal behavior - polling stops on unmount

**Cause 2: Error in polling loop**
- Check browser console for errors
- Network request failing silently

**Cause 3: Rate limiting**
- Too many status checks
- Current interval: 5 seconds (acceptable)

---

## Performance Issues

### Issue: Slow token list loading

**Symptoms:**
- Takes > 5 seconds to load tokens
- Page feels unresponsive

**Solutions:**

**Cause 1: No caching**
- Redis not configured
- Solution: Set up Redis for caching:
```bash
# Install Redis
brew install redis  # Mac
sudo apt-get install redis  # Linux

# Start Redis
redis-server

# Configure in .env
REDIS_URL=redis://localhost:6379
```

**Cause 2: Slow network**
- 1Click API responds slowly
- Check network latency
- Consider CDN or edge caching

---

### Issue: Frontend slow to render

**Symptoms:**
- Laggy interactions
- Slow dropdown rendering

**Solutions:**
1. Check for unnecessary re-renders:
```typescript
// Use React DevTools Profiler
```

2. Memoize expensive computations:
```typescript
const filteredTokens = useMemo(
  () => tokens.filter(t => t.blockchain === chain),
  [tokens, chain]
);
```

3. Lazy load components:
```typescript
const QuotePreview = lazy(() => import('./QuotePreview'));
```

---

## 1Click API Issues

### Issue: Rate limit exceeded

**Error:**
```
429 Too Many Requests
```

**Solutions:**
1. Check current rate limits:
   - With API key: 30,000 tokens/minute
   - Without API key: Much lower

2. Implement request throttling:
```typescript
// Debounce quote requests
const debouncedQuote = debounce(getQuote, 1000);
```

3. Cache responses when possible

---

### Issue: 1Click API returns 500 error

**Symptoms:**
- Intermittent failures
- Works sometimes, fails other times

**Solutions:**
1. Check 1Click status page: https://status.near-intents.org
2. Implement retry logic:
```typescript
const fetchWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
```

3. Report persistent issues to 1Click support

---

### Issue: Unexpected swap status values

**Symptoms:**
- Status shows undefined or unexpected values
- Timeline doesn't render correctly

**Solutions:**
1. Check status matches expected enum:
```typescript
type SwapStatus = 
  | 'PENDING_QUOTE'
  | 'PENDING_DEPOSIT'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'INCOMPLETE_DEPOSIT';
```

2. Add fallback handling:
```typescript
const getStatusColor = (status: SwapStatus) => {
  switch (status) {
    case 'SUCCESS':
      return 'green';
    // ... other cases
    default:
      console.warn('Unknown status:', status);
      return 'gray';
  }
};
```

---

## General Debugging Tips

### Enable verbose logging

**Backend:**
```typescript
// In services/oneclick.ts
console.log('Quote request:', JSON.stringify(quoteRequest, null, 2));
console.log('Quote response:', JSON.stringify(quote, null, 2));
```

**Frontend:**
```typescript
// In components
useEffect(() => {
  console.log('State updated:', { quoteData, depositAddress, status });
}, [quoteData, depositAddress, status]);
```

---

### Use browser DevTools effectively

1. **Network Tab**: Monitor API calls, response times, errors
2. **Console**: Check for JavaScript errors and warnings
3. **React DevTools**: Inspect component props and state
4. **Application Tab**: Check localStorage, sessionStorage

---

### Test in isolation

When debugging, test components in isolation:
```typescript
// Test backend API directly
curl -X POST http://localhost:3001/api/quote \
  -H "Content-Type: application/json" \
  -d '{"originAsset":"...","dry":true,...}'

// Test quote without full flow
const testQuote = () => {
  const quote = await fetch('/api/quote', {...});
  console.log(quote);
};
```

---

### Common Environment Issues

| Issue | Check | Solution |
|-------|-------|----------|
| Port conflicts | `netstat -ano \| findstr :3000` | Kill process or change port |
| Memory issues | Task Manager/Activity Monitor | Restart dev servers |
| Cache issues | Browser DevTools → Network | Disable cache, hard refresh |
| Stale builds | Check file timestamps | `rm -rf .next`, rebuild |

---

## Getting Help

If issues persist after trying these solutions:

1. **Check project documentation**:
   - [`README.md`](../README.md)
   - [`API_TESTING.md`](./API_TESTING.md)
   - [`E2E_TESTING.md`](./E2E_TESTING.md)

2. **Review 1Click API docs**:
   - https://docs.near-intents.org

3. **Check GitHub issues**:
   - Sapphire repository (if public)
   - 1Click SDK repository

4. **Backend logs**:
   - Always check terminal output for detailed errors
   - Enable `NODE_ENV=development` for stack traces

5. **Frontend errors**:
   - Open browser console (F12)
   - Check for React errors and warnings
   - Use React DevTools for component debugging

---

**Last Updated**: Phase 1.6 Implementation
**Maintained by**: Sapphire Development Team
