# Sapphire Phase 1.6: End-to-End Integration Testing Guide

## Overview

Phase 1.6 implements comprehensive end-to-end testing capabilities for the Sapphire cross-chain swap platform. This document provides testing scenarios, procedures, and troubleshooting guidance.

---

## Prerequisites

### Required Setup
- [ ] Backend API running at `http://localhost:3001`
- [ ] Frontend running at `http://localhost:3000`
- [ ] Valid `ONE_CLICK_JWT` API key configured
- [ ] Database connection (optional for MVP)
- [ ] Redis connection (optional for MVP)

### Test Wallets Required
For comprehensive testing, you'll need:
- [ ] **EVM Wallet**: MetaMask, Rainbow, or compatible (Ethereum, Polygon, etc.)
- [ ] **Solana Wallet**: Phantom, Solflare
- [ ] **Sui Wallet**: Sui Wallet, Suiet
- [ ] **NEAR Wallet**: MyNearWallet, Meteor

### Test Funds
Small amounts of tokens for testing:
- 0.01 ETH or equivalent on target chains
- Test tokens from faucets when available

---

## Test Scenarios

### Test 1: Health Check & Basic Connectivity

**Objective**: Verify all services are running correctly

**Steps:**
1. Check backend health:
```bash
curl http://localhost:3001/health
```

**Expected Result:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-13T...",
  "database": "connected" | "not_configured",
  "cache": "connected" | "not_configured"
}
```

2. Open frontend at `http://localhost:3000`
3. Verify page loads without errors

**Pass Criteria:**
- ✅ Backend returns 200 OK
- ✅ Frontend loads successfully
- ✅ No console errors

---

### Test 2: Token List Retrieval

**Objective**: Verify token list is fetched and cached correctly

**Steps:**
1. Open browser DevTools (F12) → Network tab
2. Load the Sapphire frontend
3. Observe network request to `/api/tokens`

**Expected Result:**
- API returns 119+ tokens
- Tokens include: wNEAR, USDC, USDT, ETH, BTC, SOL, SUI
- Response time < 2 seconds

**Pass Criteria:**
- ✅ Token list loads successfully
- ✅ Dropdown menus populate with tokens
- ✅ Each token shows symbol and blockchain

---

### Test 3: Dry Run Quote (No Wallet)

**Objective**: Get a quote without wallet connection

**Steps:**
1. Open Sapphire frontend
2. Select **From**: wNEAR (NEAR)
3. Select **To**: USDC (NEAR)
4. Enter **Amount**: 1
5. Enter **Recipient Address**: `test.near` (or any valid NEAR address)
6. Enter **Refund Address**: `test.near`
7. Click **"Get Quote"**

**Expected Result:**
- Quote preview displays:
  - Amount you send (formatted)
  - Amount you receive (formatted)
  - Minimum received amount
  - Estimated time (seconds)
  - Platform fee (0.5% = 50 bps)
  - Max slippage (1%)
- USD values shown
- No errors in console

**Pass Criteria:**
- ✅ Quote returns within 3 seconds
- ✅ All amounts are properly formatted
- ✅ Fee calculation is correct
- ✅ Reset button works

**Test Data:**
```json
{
  "originAsset": "nep141:wrap.near",
  "destinationAsset": "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
  "amount": "1000000000000000000000000",
  "recipient": "test.near",
  "refundTo": "test.near",
  "dry": true
}
```

---

### Test 4: EVM Wallet Connection

**Objective**: Connect MetaMask or compatible EVM wallet

**Steps:**
1. Click **"Connect Wallet"** (EVM button)
2. Approve connection in MetaMask
3. Verify wallet address displays correctly

**Expected Result:**
- Wallet connects successfully
- Address shown in truncated format (0x1234...5678)
- Chain name displayed

**Pass Criteria:**
- ✅ Wallet connects without errors
- ✅ Address auto-fills in refund/recipient fields when appropriate
- ✅ Balance is detectable (bonus: if implemented)

---

### Test 5: Cross-Chain Quote (EVM → NEAR)

**Objective**: Get quote for cross-chain swap

**Steps:**
1. Connect EVM wallet
2. Select **From**: ETH (Ethereum)
3. Enter **Amount**: 0.01
4. Select **To**: USDC (NEAR)
5. Enter **Recipient**: Your NEAR address
6. Refund address should auto-fill with your EVM address
7. Click **"Get Quote"**

**Expected Result:**
- Quote displays successfully
- Exchange rate shown
- Fees calculated correctly
- Different chain addresses validated

**Pass Criteria:**
- ✅ Cross-chain quote succeeds
- ✅ Addresses validated for correct chain formats
- ✅ Refund address is EVM format (0x...)
- ✅ Recipient address is NEAR format (.near or implicit)

---

### Test 6: Confirm Swap & Get Deposit Address

**Objective**: Convert dry run quote to actual swap with deposit address

**Steps:**
1. Complete Test 5 to get a quote
2. Review quote details carefully
3. Click **"Confirm Swap"** button
4. Wait for deposit address generation

**Expected Result:**
- Status changes to "Swap Status" screen
- Deposit address displayed
- Copy button available
- Timeline shows "Quote received" as complete
- Status shows "PENDING_DEPOSIT"

**Pass Criteria:**
- ✅ Deposit address generated (valid format for origin chain)
- ✅ Status tracker displays correctly
- ✅ Copy button copies address to clipboard
- ✅ Timeline visualization is accurate

**CRITICAL**: This step creates a real swap intent. Only proceed if you intend to test with actual funds.

---

### Test 7: Manual Deposit Flow

**Objective**: Test sending funds to deposit address manually

**Steps:**
1. Complete Test 6 to get deposit address
2. Copy the deposit address
3. Open your wallet (MetaMask, etc.)
4. Send the exact amount shown in the quote
5. Confirm transaction in wallet
6. Return to Sapphire status page

**Expected Result:**
- Transaction broadcasts successfully
- Status updates from PENDING_DEPOSIT → PROCESSING
- Timeline updates in real-time (every 5 seconds)
- Eventually reaches SUCCESS status

**Pass Criteria:**
- ✅ Deposit detected by 1Click API
- ✅ Status updates automatically
- ✅ Swap executes successfully
- ✅ Tokens arrive at recipient address
- ✅ "Start New Swap" button appears on success

**Note**: Swap completion time varies by chain but typically 30-120 seconds.

---

### Test 8: Status Polling

**Objective**: Verify real-time status updates work correctly

**Steps:**
1. Initiate a swap (complete Test 7)
2. Observe status tracker behavior
3. Check browser DevTools → Network tab
4. Monitor `/api/status/:depositAddress` requests

**Expected Result:**
- Status polls every 5 seconds
- No duplicate requests
- Status transitions follow expected lifecycle:
  - PENDING_DEPOSIT → PROCESSING → SUCCESS
- Visual indicators update correctly (colors, icons, timeline)

**Pass Criteria:**
- ✅ Polling interval is consistent (5s)
- ✅ Status updates reflected in UI immediately
- ✅ No memory leaks or polling after unmount
- ✅ Polling stops when final status reached (SUCCESS/FAILED/REFUNDED)

---

### Test 9: Error Handling - Invalid Addresses

**Objective**: Verify proper validation and error messages

**Test 9a: Invalid Refund Address**
1. Select ETH as origin
2. Enter invalid refund address (e.g., "invalid")
3. Try to get quote

**Expected Result:**
- Backend returns 400 error
- Frontend displays clear error message
- User can correct and retry

**Test 9b: Mismatched Address Format**
1. Select ETH as origin (needs 0x... address)
2. Enter NEAR address as refund (e.g., "test.near")
3. Try to get quote

**Expected Result:**
- Backend validation catches format mismatch
- Error message: "refundTo is not valid for origin chain"

**Pass Criteria:**
- ✅ All invalid inputs caught before API call (frontend validation)
- ✅ Backend validation catches remaining issues
- ✅ Error messages are clear and actionable
- ✅ Form remains editable after error

---

### Test 10: Error Handling - Network Issues

**Objective**: Test resilience to network failures

**Steps:**
1. Start getting a quote
2. Stop backend server mid-request
3. Observe frontend behavior

**Expected Result:**
- Frontend shows loading state
- After timeout, displays error message
- "Try again" or "Reset" option available
- No crash or blank screen

**Pass Criteria:**
- ✅ Graceful error handling
- ✅ No unhandled promise rejections in console
- ✅ User can retry after error

---

### Test 11: Refund Flow Testing

**Objective**: Verify refund mechanism works for failed swaps

**Note**: This requires deliberate failure conditions which are difficult to trigger in production. Best tested in staging/testnet.

**Scenarios that trigger refunds:**
1. **Incomplete deposit**: Send less than quoted amount
2. **Deadline exceeded**: Wait past deadline timestamp before depositing
3. **Network failure**: Destination chain temporarily unavailable

**Expected Result:**
- Status transitions to FAILED
- Then to REFUNDED
- Funds returned to refundTo address
- Clear message explaining why refund occurred

**Pass Criteria:**
- ✅ Refund initiated automatically
- ✅ Funds arrive at original refundTo address
- ✅ Status tracker shows REFUNDED state
- ✅ Timeline indicates refund completion

---

### Test 12: Multiple Wallet Types

**Objective**: Test wallet switching between different chains

**Steps:**
1. Connect MetaMask (EVM)
2. Get quote for ETH swap
3. Disconnect MetaMask
4. Connect Phantom (Solana)
5. Get quote for SOL swap

**Expected Result:**
- Wallet switching works smoothly
- Addresses auto-fill for correct chain
- No conflicts between wallet connections

**Pass Criteria:**
- ✅ Can connect/disconnect wallets without errors
- ✅ Address fields update appropriately
- ✅ Token lists filter by connected wallet (future enhancement)

---

### Test 13: Large Amount Handling

**Objective**: Test system behavior with large transaction amounts

**Steps:**
1. Request quote for large amount (e.g., 100 ETH)
2. Observe quote response
3. Check if any warnings or limits displayed

**Expected Result:**
- Quote returns successfully
- Large numbers formatted correctly (commas, decimals)
- Fee calculations accurate
- No overflow errors

**Pass Criteria:**
- ✅ Large amounts handled correctly
- ✅ No JavaScript number precision issues
- ✅ USD values calculated accurately
- ✅ Future: High-value transaction warnings (not yet implemented)

---

### Test 14: Concurrent Swaps

**Objective**: Test handling multiple swaps in progress

**Steps:**
1. Initiate first swap, get deposit address
2. Reset and initiate second swap, get different deposit address
3. Monitor both transactions (use multiple browser tabs)

**Expected Result:**
- Each swap gets unique deposit address
- No cross-contamination of swap data
- Status tracking works independently for each

**Pass Criteria:**
- ✅ Unique deposit addresses per swap
- ✅ Status polling tracks correct swap
- ✅ No session conflicts

---

## Performance Benchmarks

| Operation | Target | Acceptable | Unacceptable |
|-----------|--------|------------|--------------|
| Token list load | < 1s | < 2s | > 3s |
| Dry quote | < 2s | < 3s | > 5s |
| Actual quote (with deposit address) | < 3s | < 5s | > 8s |
| Status poll response | < 500ms | < 1s | > 2s |
| Page load (initial) | < 2s | < 3s | > 5s |

---

## Known Limitations in Phase 1.6

1. **ERC20 Token Swaps**: Requires approve() step - not yet implemented
2. **Solana Transactions**: Wallet signing not yet implemented
3. **Sui Transactions**: Wallet signing not yet implemented
4. **NEAR Integration**: Wallet selector not yet integrated
5. **Transaction History**: No persistent storage of past swaps
6. **Balance Display**: Token balances not yet fetched/displayed
7. **Slippage Configuration**: Fixed at 1%, not user-configurable

---

## Troubleshooting

### Issue: "Failed to fetch tokens"

**Possible Causes:**
- `ONE_CLICK_JWT` not set or invalid
- 1Click API is down
- Network connectivity issue

**Resolution:**
1. Check `.env` file for `ONE_CLICK_JWT`
2. Verify API key at partners.near-intents.org
3. Check backend logs for detailed error
4. Test 1Click API directly:
```bash
curl https://1click.chaindefuser.com/v0/tokens \
  -H "Authorization: Bearer YOUR_JWT"
```

---

### Issue: "refundTo is not valid"

**Possible Causes:**
- Address format doesn't match origin chain
- Typo in address
- Using test address for wrong chain

**Resolution:**
1. Verify origin chain selected
2. Ensure address format matches:
   - EVM: 0x... (42 chars)
   - NEAR: *.near or 64-char hex
   - Solana: Base58 (32-44 chars)
3. Use address from connected wallet for accuracy

---

### Issue: Quote shows $0.00 USD values

**Possible Causes:**
- Price feed unavailable for token
- New/low-liquidity token
- Temporary API issue

**Resolution:**
- This is informational only, swap can still proceed
- Verify amounts in token units are correct
- Consider using more liquid token pairs for testing

---

### Issue: Status stuck on PENDING_DEPOSIT

**Possible Causes:**
- Funds not yet sent to deposit address
- Sent wrong amount
- Sent wrong token
- Sent to wrong address

**Resolution:**
1. Verify transaction on block explorer
2. Check sent amount matches quote exactly
3. Confirm correct deposit address
4. Wait up to 5 minutes for confirmation
5. If timeout, may transition to REFUNDED

---

### Issue: Status stuck on PROCESSING

**Possible Causes:**
- Cross-chain settlement in progress (normal)
- Destination chain congestion
- Solver execution delay

**Resolution:**
- Wait 2-5 minutes (cross-chain swaps take time)
- Check 1Click status page: status.near-intents.org
- If > 10 minutes, contact support with deposit address

---

### Issue: Swap shows FAILED status

**Possible Causes:**
- Slippage exceeded
- Liquidity insufficient
- Deadline passed
- Network error

**Resolution:**
1. Check if refund initiated (should transition to REFUNDED)
2. Review quote parameters (slippage, deadline)
3. Try again with adjusted parameters
4. Check backend logs for specific error

---

## Test Checklist Summary

Use this checklist to verify Phase 1.6 completion:

### Core Functionality
- [ ] Health check endpoint responds
- [ ] Token list loads successfully
- [ ] Dry run quotes work
- [ ] Wallet connection (at least EVM) works
- [ ] Cross-chain quotes work
- [ ] Deposit address generation works
- [ ] Status tracker displays correctly
- [ ] Status polling works
- [ ] Timeline visualization accurate

### Error Handling
- [ ] Invalid address validation
- [ ] Network error handling
- [ ] Loading states display correctly
- [ ] Error messages are clear
- [ ] Reset/retry functionality works

### UI/UX
- [ ] Responsive design (mobile-friendly)
- [ ] No console errors in happy path
- [ ] Copy button works
- [ ] Quote details formatted correctly
- [ ] Status icons and colors appropriate

### Documentation
- [ ] API_TESTING.md covers all endpoints
- [ ] E2E_TESTING.md provides comprehensive guide
- [ ] README.md updated with testing instructions
- [ ] Known limitations documented

---

## Next Phase Preview: Phase 2.1+

Future testing will include:
- Solana wallet integration tests
- NEAR wallet integration tests
- Sui wallet integration tests
- ERC20 token approval flow
- Database persistence validation
- Redis caching validation
- Fee consolidation testing
- Multi-wallet concurrent connection tests

---

## Support

For issues during testing:
1. Check browser console for errors
2. Check backend terminal logs
3. Review relevant troubleshooting section above
4. Check 1Click API docs: docs.near-intents.org
5. Verify .env configuration

---

**Last Updated**: Phase 1.6 Implementation
**Next Review**: Phase 2.1 Multi-Chain Wallet Expansion
