# Near Intents Explorer API Integration

## Overview

The Near Intents Explorer API has been integrated into Sapphire to enable transaction tracking for 1Click Swap transactions. This API provides programmatic access to historical swap transactions and their statuses.

## What is Intents Explorer API?

The **Intents Explorer API** provides programmatic access to historical 1Click Swap transactions and their statuses, mirroring the data available on the [NEAR Intents Explorer](https://explorer.near-intents.org/). This API is read-only and features a single HTTP GET endpoint designed specifically for distribution channels and analytical services to fetch and filter 1Click Swap history.

### Key Features

- Tailored exclusively for 1Click Swap transactions (not general NEAR Intents activity)
- Retrieve and filter swaps by token symbols, transaction hashes, timestamps, status, and more
- Precise integration with analytics or dashboarding tools
- Mirrors real-time and historical swap data shown in the NEAR Intents Explorer

## Integration Details

### Files Added/Modified

1. **`apps/api/src/services/intentsExplorer.ts`** - New service for Intents Explorer API
   - Provides methods to query transactions by deposit address
   - Supports filtering by status, referral, affiliate, tokens, and timestamps
   - Handles authentication with JWT token

2. **`apps/api/src/routes/swap.ts`** - Updated status endpoint
   - Now uses Intents Explorer API to track transaction status
   - Returns comprehensive transaction details including deposit/fulfillment tx hashes
   - Provides helpful error messages when service is not configured

3. **`.env.example` and `.env`** - Added configuration for JWT token
   - New environment variable: `INTENTS_EXPLORER_JWT`

4. **`apps/api/package.json`** - Added axios dependency for HTTP requests

## Configuration

### 🔑 Where to Add Your API Key

**IMPORTANT**: Add your Intents Explorer JWT token to the `.env` file in the ROOT of your project:

**File Location**: `d:/near/sapphire/.env` (or `./.env` from your project root)

**What to Add**:
```bash
# Near Intents Explorer API (for transaction tracking)
INTENTS_EXPLORER_JWT=your_jwt_token_here
```

### Getting Your API Key

To obtain a JWT token for the Intents Explorer API:

1. **Fill out the API Key Request Form:**
   - URL: https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform
   
2. **Add the JWT token to your `.env` file** (see above for exact location)

3. **Restart your API server:**
   ```bash
   yarn workspace @sapphire/api dev
   ```

4. **Verify Configuration:**
   - Check your API server logs when making a swap
   - You should see messages like: `Searching for deposit address ... in transactions from the last 24 hours`
   - If you see "JWT token not configured", double-check the `.env` file location and restart the server

## API Usage

### Status Endpoint

**Endpoint:** `GET /api/status/:depositAddress`

**Description:** Check the status of a swap transaction using its deposit address.

**Response (Success):**
```json
{
  "depositAddress": "0x1234...",
  "status": "COMPLETED",
  "originAsset": "near:NEAR",
  "destinationAsset": "eth:USDC",
  "amountIn": "10000000000000000000",
  "amountOut": "25000000",
  "recipient": "0x5678...",
  "refundTo": "user.near",
  "depositTxHash": "0xabc...",
  "fulfillmentTxHash": "0xdef...",
  "refundTxHash": null,
  "createdAt": "2026-02-15T00:00:00.000Z",
  "updatedAt": "2026-02-15T00:05:00.000Z",
  "referral": "sapphire",
  "affiliate": null
}
```

**Response (Not Configured):**
```json
{
  "error": "Transaction tracking not available",
  "message": "Transaction tracking service is not configured. Please contact support."
}
```

**Response (Not Found):**
```json
{
  "error": "Swap not found",
  "message": "No swap found for this deposit address",
  "depositAddress": "0x1234..."
}
```

## Service Methods

The `intentsExplorer` service provides several methods:

### `getTransactionByDepositAddress(depositAddress: string)`
Fetches a specific transaction by its deposit address.

```typescript
import { intentsExplorer } from '../services/intentsExplorer';

const transaction = await intentsExplorer.getTransactionByDepositAddress('0x1234...');
if (transaction) {
  console.log('Status:', transaction.status);
  console.log('Amount In:', transaction.amountIn);
  console.log('Amount Out:', transaction.amountOut);
}
```

### `getTransactionsByReferral(referral: string, limit?: number)`
Gets transactions filtered by your referral code.

```typescript
const transactions = await intentsExplorer.getTransactionsByReferral('sapphire', 100);
```

### `getTransactionsByStatus(statuses: string[], limit?: number)`
Gets transactions filtered by status (e.g., PENDING, COMPLETED, FAILED).

```typescript
const pendingTxs = await intentsExplorer.getTransactionsByStatus(['PENDING'], 50);
```

### `getTransactions(params?: {...})`
Advanced query with multiple filters (tokens, timestamps, affiliate, etc.).

```typescript
const result = await intentsExplorer.getTransactions({
  numberOfTransactions: 50,
  fromChainId: 'near',
  toChainId: 'eth',
  statuses: ['COMPLETED'],
  minUsdPrice: 10,
  maxUsdPrice: 1000
});
```

## Transaction Status Values

The API returns the following status values:

- `PENDING_DEPOSIT` - Waiting for user deposit
- `DEPOSIT_RECEIVED` - Deposit transaction detected
- `PROCESSING` - Swap is being processed
- `COMPLETED` - Swap successfully completed
- `FAILED` - Swap failed
- `REFUNDED` - Funds refunded to user
- `EXPIRED` - Transaction expired

## Benefits

1. **Real-time Transaction Tracking:** Monitor swap progress from deposit to completion
2. **Historical Data:** Access past transactions for analytics and reporting
3. **Status Updates:** Get detailed status information including transaction hashes
4. **Error Handling:** Clear error messages when transactions aren't found
5. **Analytics Ready:** Filter by referral/affiliate codes to track your application's usage

## Troubleshooting

### "Transaction tracking not available" Error

**Cause:** The `INTENTS_EXPLORER_JWT` environment variable is not set.

**Solution:**
1. Request an API key from the form (see Configuration section)
2. Add the JWT token to your `.env` file
3. Restart the API server

### "Swap not found" Error

**Cause:** The transaction doesn't exist or hasn't been indexed yet.

**Solution:**
- Wait a few moments for recent transactions to be indexed
- Verify the deposit address is correct
- Check that the transaction was actually submitted

### Authentication Errors

**Cause:** Invalid or expired JWT token.

**Solution:**
1. Request a new JWT token from the API key form
2. Update your `.env` file with the new token
3. Restart the API server

## Documentation

- **API Documentation:** https://docs.near-intents.org/near-intents/integration/distribution-channels/intents-explorer-api
- **Swagger UI:** https://explorer.near-intents.org/api/docs
- **OpenAPI Spec:** https://explorer.near-intents.org/api/v0/openapi.yaml

## Next Steps

1. **Request your API key** using the form linked above
2. **Add the JWT token** to your `.env` file as `INTENTS_EXPLORER_JWT`
3. **Test the integration** by submitting a swap and checking its status
4. **Monitor your transactions** using the referral code filters

## Example Usage Flow

1. User initiates a swap through your application
2. User deposits funds to the deposit address
3. Your application polls `/api/status/:depositAddress` to track progress
4. API returns real-time status updates from Intents Explorer
5. User sees live updates as swap progresses from DEPOSIT_RECEIVED → PROCESSING → COMPLETED

---

**Note:** The Intents Explorer API is read-only and does not allow submitting new transactions. Use the 1Click SDK for transaction submission.
