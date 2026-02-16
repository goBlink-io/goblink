# Sui RPC Integration with Blockvision

## Overview

This project now supports fetching Sui account balances and coins using Blockvision's gRPC API. The integration provides three endpoints to retrieve Sui blockchain data.

## Configuration

### 1. Get Your Blockvision API Key

1. Visit [Blockvision Documentation](https://docs.blockvision.org)
2. Create an account and obtain your API key
3. Add your API key to the `.env` file

### 2. Environment Variables

Add the following to your `.env` file:

```bash
# Sui Network Configuration
# Blockvision API Key (get from https://docs.blockvision.org)
BLOCKVISION_API_KEY=your_actual_api_key_here
```

**IMPORTANT**: Replace `your_actual_api_key_here` with your actual Blockvision API key.

## API Endpoints

### 1. Get Native SUI Balance

**Endpoint**: `GET /api/balances/sui/:address`

**Description**: Returns the native SUI token balance for a given address.

**Example Request**:
```bash
curl http://localhost:3001/api/balances/sui/0x1234567890abcdef
```

**Example Response**:
```json
{
  "balance": "10.5000",
  "balanceMist": "10500000000",
  "address": "0x1234567890abcdef"
}
```

**Notes**:
- Balance is returned in SUI (human-readable)
- balanceMist is the raw balance (1 SUI = 10^9 MIST)

---

### 2. Get All Tokens (Aggregated)

**Endpoint**: `GET /api/balances/sui-tokens/:address`

**Description**: Returns all coin types owned by the address with aggregated balances.

**Example Request**:
```bash
curl http://localhost:3001/api/balances/sui-tokens/0x1234567890abcdef
```

**Example Response**:
```json
{
  "address": "0x1234567890abcdef",
  "tokens": [
    {
      "coinType": "0x2::sui::SUI",
      "balance": "10500000000",
      "balanceRaw": "10500000000",
      "count": 5
    },
    {
      "coinType": "0x2::example::USDC",
      "balance": "1000000",
      "balanceRaw": "1000000",
      "count": 2
    }
  ],
  "count": 2
}
```

**Notes**:
- `count` indicates how many coin objects of that type the user owns
- Balances are aggregated across all coin objects of the same type

---

### 3. Get All Coin Objects

**Endpoint**: `GET /api/balances/sui-coins/:address?coinType=<optional>`

**Description**: Returns raw coin objects from Blockvision API. Optionally filter by coin type.

**Example Request** (all coins):
```bash
curl http://localhost:3001/api/balances/sui-coins/0x1234567890abcdef
```

**Example Request** (filter by SUI):
```bash
curl "http://localhost:3001/api/balances/sui-coins/0x1234567890abcdef?coinType=0x2::sui::SUI"
```

**Example Response**:
```json
{
  "address": "0x1234567890abcdef",
  "coinType": "all",
  "data": [
    {
      "coinType": "0x2::sui::SUI",
      "coinObjectId": "0xabcdef123456",
      "version": "12345",
      "digest": "ABC123",
      "balance": "5000000000",
      "previousTransaction": "0xtxhash"
    }
  ],
  "nextCursor": null,
  "hasNextPage": false
}
```

**Query Parameters**:
- `coinType` (optional): Filter by specific coin type (e.g., "0x2::sui::SUI")

---

## Implementation Details

### Service Layer

**File**: [`apps/api/src/services/sui.ts`](../apps/api/src/services/sui.ts)

The service provides three main functions:

1. **`getSuiBalance(address)`**: Returns native SUI balance
2. **`getSuiAccountTokens(address)`**: Returns all tokens aggregated by type
3. **`getSuiAccountCoins(address, coinType?)`**: Returns raw coin objects

### Route Layer

**File**: [`apps/api/src/routes/balances.ts`](../apps/api/src/routes/balances.ts)

Three new routes added:
- `/sui/:address` - Native SUI balance
- `/sui-tokens/:address` - All tokens aggregated
- `/sui-coins/:address` - Raw coin objects with optional filtering

### Error Handling

All endpoints include proper error handling:
- Missing API key returns 500 with clear error message
- Invalid addresses return appropriate error responses
- Blockvision API errors are caught and logged

## Integration with Frontend

### Using the Sui Tokens Endpoint for "From Token" List

To populate the Sui token list in your frontend:

```typescript
async function fetchSuiTokens(address: string) {
  const response = await fetch(
    `${API_URL}/api/balances/sui-tokens/${address}`
  );
  const data = await response.json();
  
  // Transform to your token format
  return data.tokens.map(token => ({
    symbol: parseCoinType(token.coinType),
    address: token.coinType,
    balance: token.balance,
    decimals: getCoinDecimals(token.coinType),
  }));
}
```

## Blockvision API Documentation

- **gRPC Overview**: https://docs.blockvision.org/reference/grpc-for-sui
- **Retrieve Account Coins**: https://docs.blockvision.org/reference/retrieve-account-coins

## Network Support

Currently configured for **Sui Mainnet**. The Blockvision API endpoint is:
```
https://api.blockvision.org/v2/sui/account/coins
```

## Testing

To test the integration:

1. Add your Blockvision API key to `.env`
2. Restart the API server (it will pick up the new environment variable)
3. Test with a valid Sui address:

```bash
# Test native SUI balance
curl http://localhost:3001/api/balances/sui/0xYOUR_TEST_ADDRESS

# Test all tokens
curl http://localhost:3001/api/balances/sui-tokens/0xYOUR_TEST_ADDRESS
```

## Rate Limits

Blockvision has rate limits based on your API tier. Refer to their documentation for specific limits.

## Next Steps

1. **Add your Blockvision API key** to `.env`
2. **Test the endpoints** with a valid Sui address
3. **Integrate with frontend** to populate the Sui token dropdown
4. **Add coin metadata** (symbols, decimals, logos) for better UX
5. **Consider caching** token balances to reduce API calls
