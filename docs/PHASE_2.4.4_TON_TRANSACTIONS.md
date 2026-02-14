# Phase 2.4.4: TON Transaction Implementation

**Status**: ✅ Complete  
**Date**: 2026-02-14

## Overview

This phase adds full transaction capabilities to TON (The Open Network) wallet integration, enabling programmatic TON transfers, jetton (token) transfers, balance queries, and transaction tracking. This brings TON to feature parity with other implemented chains.

## Deliverables

### 1. TON Service Module ✅

**File**: [`apps/web/src/services/tonService.ts`](../apps/web/src/services/tonService.ts)

A comprehensive service module (~400 lines) providing:

#### Balance Management
- `getTonBalance(address)` - Fetch TON balance
- `getJettonBalance(ownerAddress, jettonMasterAddress)` - Fetch jetton balance
- `getJettonWalletAddress(ownerAddress, jettonMasterAddress)` - Get user's jetton wallet

#### Transaction Building
- `buildTonTransfer(toAddress, amount, memo?)` - Build TON transfer transaction
- `buildJettonTransfer(jettonWalletAddress, recipientAddress, amount)` - Build jetton transfer

#### Transaction Execution
- `waitForTransaction(transactionHash, timeout)` - Poll for transaction confirmation
- `getTransactionStatus(transactionHash)` - Get transaction details and status

#### Jetton Metadata
- `getJettonMetadata(jettonMasterAddress)` - Fetch jetton info

#### Utilities
- `parseAmount(amount, decimals)` - Convert to nanotons
- `formatAmount(amount, decimals)` - Convert to human-readable
- `isValidTonAddress(address)` - Validate TON address format
- `estimateTransactionFee()` - Get transaction fee estimate
- `hasSufficientBalance(address, amount, jettonAddress?)` - Balance checking
- `TON_JETTONS` - Common jetton addresses

### 2. Transaction Context Provider ✅

**File**: [`apps/web/src/components/TonTransactionProvider.tsx`](../apps/web/src/components/TonTransactionProvider.tsx)

React context provider (~220 lines) exposing transaction methods:

#### Context Methods
```typescript
interface TonTransactionContextType {
  // Balance methods
  getBalance(): Promise<TonBalance | null>;
  getJettonBalance(jettonMasterAddress: string): Promise<JettonBalance | null>;
  
  // Transfer methods
  sendTON(toAddress: string, amount: string, memo?: string): Promise<TransactionResult>;
  sendJetton(
    jettonMasterAddress: string,
    jettonWalletAddress: string,
    toAddress: string,
    amount: string
  ): Promise<TransactionResult>;
  
  // Utility methods
  waitForTx(transactionHash: string): Promise<boolean>;
  getTxStatus(transactionHash: string): Promise<any>;
  getJettonInfo(jettonMasterAddress: string): Promise<any>;
  estimateFee(): Promise<string>;
  checkSufficientBalance(amount: string, jettonAddress?: string): Promise<boolean>;
  
  // Helper methods
  parseAmount(amount: string, decimals?: number): string;
  formatAmount(amount: string, decimals?: number): string;
  validateAddress(address: string): boolean;
}
```

### 3. Web3Provider Integration ✅

**File**: [`apps/web/src/components/Web3Provider.tsx`](../apps/web/src/components/Web3Provider.tsx)

Updated to include `TonTransactionProvider` in the provider chain:

```tsx
<TonWalletProvider>
  <TonTransactionProvider>
    {/* Other providers */}
  </TonTransactionProvider>
</TonWalletProvider>
```

## Technical Implementation

### Architecture

The implementation follows the established pattern:

1. **Service Layer** - Pure functions for blockchain interactions using @ton/ton SDK
2. **Context Provider** - React hooks wrapping service functions with TONConnect integration
3. **Wallet Integration** - Uses existing `TonWalletProvider` with TONConnect UI

### Key Technologies

- **@tonconnect/ui-react v2.4.1** - TONConnect wallet integration
- **@ton/ton** - TON SDK for blockchain interactions
- **@ton/core** - Core TON utilities
- **@ton/crypto** - Cryptographic functions
- **TON API** - TonCenter API for RPC calls

### Transaction Flow

```
1. User initiates transfer
   ↓
2. Validate address and amount
   ↓
3. Build transaction (BOC - Bag of Cells)
   ↓
4. Send via TONConnect UI
   ↓
5. User confirms in wallet app
   ↓
6. Transaction broadcast to network
   ↓
7. Poll for confirmation
   ↓
8. Return BOC and status
```

### TON-Specific Features

#### BOC (Bag of Cells)
TON uses BOC encoding for transactions:
```typescript
const body = beginCell()
  .storeUint(0xf8a7ea5, 32) // transfer op code
  .storeUint(0, 64) // query_id
  .storeCoins(BigInt(amount))
  .storeAddress(recipient)
  .endCell();

const boc = body.toBoc().toString('base64');
```

#### Jetton Transfers (TEP-74)
Jetton transfers follow TEP-74 standard:
```typescript
const transaction = buildJettonTransfer(
  jettonWalletAddress,
  recipientAddress,
  amount
);

// Sends to user's jetton wallet contract, which forwards to recipient
```

#### Address Validation
```typescript
function isValidTonAddress(address: string): boolean {
  try {
    Address.parse(address);
    return true;
  } catch {
    return false;
  }
}
```

#### Memo Support
TON supports memos in transaction comments:
```typescript
const payload = memo
  ? beginCell()
      .storeUint(0, 32)
      .storeStringTail(memo)
      .endCell()
      .toBoc()
      .toString('base64')
  : '';
```

## Usage Examples

### Check TON Balance

```typescript
import { useTonTransaction } from '@/components/TonTransactionProvider';

function MyComponent() {
  const { getBalance } = useTonTransaction();
  
  const checkBalance = async () => {
    try {
      const balance = await getBalance();
      if (balance) {
        console.log(`TON Balance: ${balance.balance} TON`);
        console.log(`Nanotons: ${balance.nanotons}`);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };
}
```

### Send TON

```typescript
const { sendTON, validateAddress } = useTonTransaction();

const transferTon = async (recipient: string, amount: string) => {
  if (!validateAddress(recipient)) {
    console.error('Invalid TON address');
    return;
  }
  
  try {
    // Amount in nanotons (1 TON = 10^9 nanotons)
    const result = await sendTON(recipient, amount, 'Payment');
    
    if (result.success) {
      console.log('Transaction successful');
      console.log('BOC:', result.boc);
    }
  } catch (error) {
    console.error('Transfer failed:', error);
  }
};
```

### Send Jetton (USDT)

```typescript
const { sendJetton, getJettonBalance } = useTonTransaction();

const transferUSDT = async (recipient: string, amount: string) => {
  const usdtMaster = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
  
  try {
    // Get jetton wallet address for this user
    const jettonWalletAddress = await getJettonWalletAddress(
      myAddress,
      usdtMaster
    );
    
    if (!jettonWalletAddress) {
      console.error('No jetton wallet found');
      return;
    }
    
    // Send jetton
    const result = await sendJetton(
      usdtMaster,
      jettonWalletAddress,
      recipient,
      amount // Amount in smallest unit
    );
    
    if (result.success) {
      console.log('USDT transfer successful');
      console.log('BOC:', result.boc);
    }
  } catch (error) {
    console.error('Transfer failed:', error);
  }
};
```

### Wait for Transaction Confirmation

```typescript
const { sendTON, waitForTx, getTxStatus } = useTonTransaction();

const transferAndWait = async (recipient: string, amount: string) => {
  try {
    const result = await sendTON(recipient, amount);
    
    if (result.success) {
      console.log('Transaction submitted, BOC:', result.boc);
      
      // Wait for confirmation
      const confirmed = await waitForTx(result.boc);
      
      if (confirmed) {
        const status = await getTxStatus(result.boc);
        console.log('Transaction confirmed:', status);
      }
    }
  } catch (error) {
    console.error('Transaction failed:', error);
  }
};
```

### Get Jetton Balance

```typescript
const { getJettonBalance } = useTonTransaction();

const checkJettonBalance = async (jettonMasterAddress: string) => {
  try {
    const balance = await getJettonBalance(jettonMasterAddress);
    
    if (balance) {
      console.log(`Balance: ${balance.balance}`);
      console.log(`Decimals: ${balance.decimals}`);
      
      // Convert to human-readable
      const formatted = formatAmount(balance.balance, balance.decimals);
      console.log(`Formatted: ${formatted}`);
    }
  } catch (error) {
    console.error('Failed to fetch jetton balance:', error);
  }
};
```

## Common Jetton Addresses

```typescript
export const TON_JETTONS = {
  USDT: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
  USDC: 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA',
  NOTCOIN: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT',
};
```

**Note**: These addresses are examples. Verify actual jetton master addresses from official sources.

## Transaction Costs

| Operation | Estimated Fee | Notes |
|-----------|--------------|-------|
| TON Transfer | 0.01-0.05 TON | Depends on network load |
| Jetton Transfer | 0.05-0.1 TON | Includes wallet contract call |
| Wallet Creation | ~1 TON | One-time jetton wallet deployment |

**Fees**: TON uses dynamic fees based on network congestion and computation costs.

## Transaction Confirmation Times

- **Block Time**: ~5 seconds
- **Typical Confirmation**: 5-15 seconds
- **Finality**: After masterchain confirmation (~30 seconds for full finality)

TON transactions are usually confirmed within 1-3 blocks (5-15 seconds).

## Error Handling

### Common Errors

```typescript
// Insufficient balance
{
  success: false,
  boc: '',
  error: 'Insufficient TON balance for transaction'
}

// Invalid address
{
  success: false,
  boc: '',
  error: 'Invalid recipient address'
}

// User rejected transaction
{
  success: false,
  boc: '',
  error: 'User rejected transaction'
}

// Jetton wallet not found
{
  success: false,
  boc: '',
  error: 'No jetton wallet found for this address'
}
```

### Best Practices

1. **Validate addresses** before building transactions
2. **Check sufficient balance** including gas fees
3. **Handle user rejection** gracefully
4. **Wait for confirmation** before showing success
5. **Use proper decimals** for jetton amounts
6. **Store BOC** for transaction tracking

## Testing

### Manual Testing Checklist

- [ ] Connect wallet (Tonkeeper, MyTonWallet, etc.)
- [ ] Check TON balance
- [ ] Send TON transaction
- [ ] Check jetton balance (USDT, USDC)
- [ ] Send jetton transaction
- [ ] Wait for transaction confirmation
- [ ] Check transaction status
- [ ] Test with memos
- [ ] Validate addresses
- [ ] Handle insufficient balance
- [ ] Handle user rejection
- [ ] Test fee estimation
- [ ] Verify on TON Explorer

### Test on Testnet First

Before using on mainnet, test on TON testnet:

```typescript
const TON_API_ENDPOINT = 'https://testnet.toncenter.com/api/v2/jsonRPC';
```

Get testnet TON from: https://t.me/testgiver_ton_bot

## Comparison with Other Chains

| Feature | Solana | NEAR | Sui | Starknet | Stellar | TON |
|---------|--------|------|-----|----------|---------|-----|
| Native Token | SOL | NEAR | SUI | ETH | XLM | TON |
| Token Standard | SPL | FT | Coins | ERC-20 | Assets | Jettons |
| Address Format | Base58 | account.near | 0x + 64 hex | 0x + 64 hex | G + 55 | EQ... (48) |
| Confirmation | ~0.4s | ~1-2s | ~1-2s | ~1-2 min | ~5-10s | ~5-15s |
| Avg Fee | 0.000005 SOL | 0.0005 NEAR | 0.001 SUI | 0.002 ETH | 0.00001 XLM | 0.01 TON |
| Account Model | UTXO-like | Named | Object | Account | Account | Actor (contract) |

## Security Considerations

1. **Address Validation**: Always validate TON addresses before transactions
2. **Amount Validation**: Ensure amounts are within safe ranges
3. **Jetton Verification**: Verify jetton master addresses from official sources
4. **User Confirmation**: Always show clear transaction details before signing
5. **Error Messages**: Don't expose sensitive information
6. **Network Selection**: Ensure correct network (mainnet vs testnet)

## TON-Specific Considerations

### Actor Model
TON uses an actor model where every account and smart contract is an independent actor that processes messages asynchronously.

### Jetton Wallets
Each user has a separate jetton wallet contract for each jetton type. These must be deployed before receiving jettons.

### BOC Encoding
All transactions are encoded as Bags of Cells (BOC), a tree-like data structure unique to TON.

### Sharding
TON uses dynamic sharding for scalability. Transactions might span multiple shards.

## Limitations

1. **Jetton Wallet Deployment**: Users need TON for initial jetton wallet deployment (~1 TON)
2. **Complex Address Format**: TON addresses can be in multiple formats (raw, user-friendly)
3. **Transaction Tracking**: Limited transaction indexing compared to other chains
4. **Jetton Standards**: Multiple jetton standards (TEP-74, TEP-89)
5. **Wallet Support**: Currently only supports TONConnect-compatible wallets

## Future Enhancements

### Phase 2.4.5+ Potential Features

1. **NFT Support**: Handle TON NFTs (TEP-62, TEP-64)
2. **TON DNS**: Resolve .ton domain names
3. **Subscriptions**: Recurring payment support
4. **Multisig**: Multi-signature wallet support
5. **DEX Integration**: Swap via DeDust, STON.fi
6. **Staking**: Nominator pool interactions
7. **Advanced Jettons**: TEP-89 wrapped tokens

## Resources

### Documentation
- [TON Documentation](https://docs.ton.org/)
- [TON SDK Documentation](https://github.com/ton-org/ton)
- [TONConnect Documentation](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [Jetton Standard (TEP-74)](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)

### Block Explorers
- [TONScan](https://tonscan.org/)
- [TON Explorer](https://explorer.toncoin.org/)
- [TON NFT Explorer](https://getgems.io/)

### Tools
- [TON Center API](https://toncenter.com/api/v2/)
- [TON Connect](https://ton-connect.github.io/sdk/)
- [TON CLI](https://github.com/ton-blockchain/ton/tree/master/tonlib-cli)

### Wallets
- [Tonkeeper](https://tonkeeper.com/)
- [MyTonWallet](https://mytonwallet.io/)
- [OpenMask](https://www.openmask.app/)
- [Tonhub](https://tonhub.com/)

## Support

For issues or questions:
1. Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide
2. Review TON documentation
3. Check TONConnect documentation
4. Test on testnet before mainnet
5. Verify jetton addresses from official sources

## Conclusion

Phase 2.4.4 successfully implements full transaction capabilities for TON, bringing it to feature parity with other chains. Users can now programmatically send TON, transfer jettons (USDT, USDC, NOTCOIN), query balances, and track transactions - enabling seamless cross-chain swaps with TON tokens.

**Next Phase**: [Phase 2.4.5](./PHASE_2.4.5_TRON_TRANSACTIONS.md) - TRON Transaction Implementation
