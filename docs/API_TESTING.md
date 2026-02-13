# Sapphire API Testing Guide

## Backend API Endpoints

The Sapphire backend API is running at `http://localhost:3001`

### 1. Health Check

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-13T08:12:45.371Z"
}
```

---

### 2. Get Supported Tokens

```bash
curl http://localhost:3001/api/tokens
```

**Expected Response:**
Returns array of 119+ tokens across 20+ chains including:
- NEAR (wNEAR, USDC, USDT, etc.)
- Ethereum (ETH, USDC, USDT, WBTC, etc.)
- Solana (SOL, USDC, USDT, etc.)
- Bitcoin (BTC)
- And many more...

---

### 3. Get Swap Quote

#### Example 1: NEAR → USDC (Same Chain)

```bash
curl -X POST http://localhost:3001/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "originAsset": "nep141:wrap.near",
    "destinationAsset": "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
    "amount": "1000000000000000000000000",
    "recipient": "your-account.near",
    "refundTo": "your-account.near",
    "dry": true
  }'
```

**Parameters:**
- `originAsset`: Asset ID from `/api/tokens`
- `destinationAsset`: Asset ID from `/api/tokens`
- `amount`: Amount in smallest unit (e.g., 1 wNEAR = 1e24 yoctoNEAR)
- `recipient`: Destination address (must match destination chain format)
- `refundTo`: Refund address (must match origin chain format)
- `dry`: `true` for quote only, `false` to create actual deposit address

**Expected Response:**
```json
{
  "quote": {
    "amountIn": "1000000000000000000000000",
    "amountInFormatted": "1.0",
    "amountInUsd": "0.9769",
    "amountOut": "973795",
    "amountOutFormatted": "0.973795",
    "amountOutUsd": "0.9736",
    "minAmountOut": "964057",
    "timeEstimate": 20
  },
  "quoteRequest": {
    "dry": true,
    "originAsset": "nep141:wrap.near",
    "destinationAsset": "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
    "amount": "1000000000000000000000000",
    "recipient": "your-account.near",
    "refundTo": "your-account.near"
  }
}
```

#### Example 2: Cross-Chain Swap (Ethereum → NEAR)

```bash
curl -X POST http://localhost:3001/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "originAsset": "nep141:eth.omft.near",
    "destinationAsset": "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
    "amount": "1000000000000000000",
    "recipient": "your-account.near",
    "refundTo": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
    "dry": true
  }'
```

**Important:** For cross-chain swaps:
- `refundTo` must be a valid address for the **origin chain**
- `recipient` must be a valid address for the **destination chain**
- Example: ETH → NEAR requires `refundTo` as Ethereum address and `recipient` as NEAR address

---

### 4. Submit Deposit Transaction

After user sends funds to the deposit address:

```bash
curl -X POST http://localhost:3001/api/deposit/submit \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0x1234567890abcdef..."
  }'
```

---

### 5. Check Swap Status

```bash
curl http://localhost:3001/api/status/DEPOSIT_ADDRESS_HERE
```

**Expected Response:**
```json
{
  "status": "PENDING_DEPOSIT" | "PROCESSING" | "SUCCESS" | "FAILED" | "REFUNDED",
  "transactions": [...],
  "quote": {...}
}
```

---

## Common Asset IDs

| Token | Asset ID | Decimals |
|-------|----------|----------|
| wNEAR | `nep141:wrap.near` | 24 |
| NEAR USDC | `nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1` | 6 |
| NEAR USDT | `nep141:usdt.tether-token.near` | 6 |
| ETH (OMFT) | `nep141:eth.omft.near` | 18 |
| BTC (OMFT) | `nep141:btc.omft.near` | 8 |
| SOL (OMFT) | `nep141:sol.omft.near` | 9 |

Get full list from `/api/tokens` endpoint.

---

## Testing Tips

1. **Use dry=true for testing**: Always test with `dry: true` first to avoid creating actual deposit addresses
2. **Check decimals**: Make sure amounts match the token's decimals (get from `/api/tokens`)
3. **Validate addresses**: Ensure `refundTo` and `recipient` match their respective chain formats
4. **Monitor terminal**: Watch the API server logs for detailed error messages
5. **Rate limits**: Your API key has 30,000 tokens/minute limit

---

## Error Handling

### "refundTo is not valid"
- Ensure `refundTo` address format matches the origin chain
- ETH swaps need Ethereum addresses (0x...)
- NEAR swaps need NEAR addresses (account.near)

### "Failed to fetch tokens"
- Check your `ONE_CLICK_JWT` environment variable
- Verify API key is valid

### "Internal Server Error"
- Check server logs in terminal
- Verify request format matches API expectations
