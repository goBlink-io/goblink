# Phase 2.4.2: Starknet Transaction Implementation

**Status**: ✅ Complete  
**Date**: 2026-02-14

## Overview

This phase adds full transaction capabilities to Starknet wallet integration, enabling programmatic ETH transfers, ERC-20 token transfers, balance queries, and transaction tracking. This brings Starknet to feature parity with Solana, NEAR, and Sui transaction implementations.

## Deliverables

### 1. Starknet Service Module ✅

**File**: [`apps/web/src/services/starknetService.ts`](../apps/web/src/services/starknetService.ts)

A comprehensive service module (~450 lines) providing:

#### Balance Management
- `getStarknetBalance(address)` - Fetch ETH balance
- `getStarknetTokenBalance(address, contractAddress)` - Fetch ERC-20 token balance

#### Transaction Operations
- `sendStarknetEth(account, recipient, amount)` - Transfer ETH
- `sendStarknetToken(account, contractAddress, recipient, amount)` - Transfer ERC-20 tokens

#### Transaction Confirmation
- `waitForTransaction(transactionHash, timeout)` - Poll for transaction confirmation
- `getTransactionStatus(transactionHash)` - Get transaction details and status

#### Token Metadata
- `getTokenMetadata(contractAddress)` - Fetch token symbol, name, decimals

#### Utilities
- `parseAmount(amount, decimals)` - Convert human-readable to smallest unit
- `formatAmount(amount, decimals)` - Convert smallest unit to human-readable
- `isValidStarknetAddress(address)` - Validate Starknet address format
- `estimateTransactionFee(account, calls)` - Estimate gas costs
- `hasSufficientBalance(address, amount, contractAddress?)` - Check balance

### 2. Transaction Context Provider ✅

**File**: [`apps/web/src/components/StarknetTransactionProvider.tsx`](../apps/web/src/components/StarknetTransactionProvider.tsx)

React context provider (~210 lines) exposing transaction methods:

#### Context Methods
```typescript
interface StarknetTransactionContextType {
  // Balance methods
  getBalance(): Promise<StarknetBalance | null>;
  getTokenBalance(contractAddress: string): Promise<StarknetTokenBalance | null>;
  
  // Transfer methods
  sendETH(toAddress: string, amount: string): Promise<TransactionResult>;
  sendToken(contractAddress: string, toAddress: string, amount: string): Promise<TransactionResult>;
  
  // Utility methods
  waitForTx(transactionHash: string): Promise<boolean>;
  getTxStatus(transactionHash: string): Promise<any>;
  getTokenInfo(contractAddress: string): Promise<any>;
  estimateFee(calls: any[]): Promise<string>;
  checkSufficientBalance(amount: string, contractAddress?: string): Promise<boolean>;
  
  // Helper methods
  parseAmount(amount: string, decimals: number): string;
  formatAmount(amount: string, decimals: number): string;
  validateAddress(address: string): boolean;
}
```

### 3. Web3Provider Integration ✅

**File**: [`apps/web/src/components/Web3Provider.tsx`](../apps/web/src/components/Web3Provider.tsx)

Updated to include `StarknetTransactionProvider` in the provider chain:

```tsx
<StarknetWalletProvider>
  <StarknetTransactionProvider>
    {/* Other providers */}
  </StarknetTransactionProvider>
</StarknetWalletProvider>
```

## Technical Implementation

### Architecture

The implementation follows the established pattern from Solana, NEAR, and Sui:

1. **Service Layer** - Pure functions for blockchain interactions
2. **Context Provider** - React hooks wrapping service functions
3. **Wallet Integration** - Uses existing `StarknetWalletProvider` for account access

### Key Technologies

- **starknet.js v9.2.1** - Starknet JavaScript SDK
- **RPC Provider** - Connects to Starknet mainnet via public endpoint
- **ERC-20 Standard** - Token interactions via standard ABI
- **Uint256 Handling** - Proper handling of Starknet's 256-bit integers

### Transaction Flow

```
1. User initiates transfer
   ↓
2. Validate address and amount
   ↓
3. Check sufficient balance
   ↓
4. Build transaction call
   ↓
5. Sign via wallet (Argent X / Braavos)
   ↓
6. Execute transaction
   ↓
7. Poll for confirmation
   ↓
8. Return transaction hash and status
```

### Starknet-Specific Features

#### ERC-20 ABI
```typescript
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt' }],
    outputs: [{ name: 'balance', type: 'Uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'felt' },
      { name: 'amount', type: 'Uint256' },
    ],
    outputs: [{ name: 'success', type: 'felt' }],
  },
  // ... more methods
];
```

#### Address Validation
```typescript
// Starknet addresses: 0x + up to 64 hex characters
function isValidStarknetAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{1,64}$/.test(address);
}
```

#### Transaction Polling
```typescript
// Starknet transactions are slower, use 5-second intervals
while (Date.now() - startTime < timeoutMs) {
  const receipt = await provider.getTransactionReceipt(transactionHash);
  if (receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
    return true;
  }
  await new Promise(resolve => setTimeout(resolve, 5000));
}
```

## Usage Examples

### Check ETH Balance

```typescript
import { useStarknetTransaction } from '@/components/StarknetTransactionProvider';

function MyComponent() {
  const { getBalance } = useStarknetTransaction();
  
  const checkBalance = async () => {
    const balance = await getBalance();
    if (balance) {
      console.log(`ETH Balance: ${balance.balance} ETH`);
      console.log(`Wei: ${balance.wei}`);
    }
  };
}
```

### Send ETH

```typescript
const { sendETH, parseAmount } = useStarknetTransaction();

const transferEth = async (recipient: string, amount: string) => {
  // Convert 1.5 ETH to wei
  const amountWei = parseAmount(amount, 18);
  
  const result = await sendETH(recipient, amountWei);
  
  if (result.success) {
    console.log('Transaction hash:', result.transactionHash);
  } else {
    console.error('Transfer failed:', result.error);
  }
};
```

### Send ERC-20 Token (USDC)

```typescript
const { sendToken, getTokenBalance, parseAmount } = useStarknetTransaction();

const transferUsdc = async (recipient: string, amount: string) => {
  const usdcAddress = '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';
  
  // Get token decimals
  const balance = await getTokenBalance(usdcAddress);
  if (!balance) return;
  
  // Convert amount to smallest unit
  const amountSmallest = parseAmount(amount, balance.decimals);
  
  const result = await sendToken(usdcAddress, recipient, amountSmallest);
  
  if (result.success) {
    console.log('USDC transfer successful');
  }
};
```

### Wait for Transaction Confirmation

```typescript
const { sendETH, waitForTx, getTxStatus } = useStarknetTransaction();

const transferAndWait = async (recipient: string, amount: string) => {
  const result = await sendETH(recipient, amount);
  
  if (result.success) {
    console.log('Transaction submitted:', result.transactionHash);
    
    // Wait for confirmation (up to 60 seconds)
    const confirmed = await waitForTx(result.transactionHash);
    
    if (confirmed) {
      const status = await getTxStatus(result.transactionHash);
      console.log('Transaction confirmed:', status);
    }
  }
};
```

### Get Token Metadata

```typescript
const { getTokenInfo } = useStarknetTransaction();

const fetchTokenInfo = async (contractAddress: string) => {
  const info = await getTokenInfo(contractAddress);
  
  if (info) {
    console.log('Token:', info.name);
    console.log('Symbol:', info.symbol);
    console.log('Decimals:', info.decimals);
  }
};
```

### Estimate Transaction Fee

```typescript
const { estimateFee, formatAmount } = useStarknetTransaction();

const estimateTransferFee = async () => {
  const calls = [{
    contractAddress: ethContractAddress,
    entrypoint: 'transfer',
    calldata: [recipient, amountLow, amountHigh]
  }];
  
  const feeWei = await estimateFee(calls);
  const feeEth = formatAmount(feeWei, 18);
  
  console.log(`Estimated fee: ${feeEth} ETH`);
};
```

## Common Token Contract Addresses

```typescript
export const STARKNET_TOKENS = {
  ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  USDC: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
  USDT: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
  DAI: '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3',
  WBTC: '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac',
};
```

## Transaction Costs

| Operation | Estimated Fee | Notes |
|-----------|--------------|-------|
| ETH Transfer | ~0.001-0.005 ETH | Depends on gas price |
| ERC-20 Transfer | ~0.002-0.008 ETH | Slightly higher than ETH |
| Token Approval | ~0.002-0.006 ETH | One-time per token |

**Note**: Starknet fees vary based on network congestion and L1 gas prices.

## Transaction Confirmation Times

- **RECEIVED**: Transaction received by sequencer (~instant)
- **PENDING**: Transaction being processed (~10-30 seconds)
- **ACCEPTED_ON_L2**: Accepted on Layer 2 (~1-2 minutes)
- **ACCEPTED_ON_L1**: Finalized on Ethereum L1 (~4-8 hours)

Most applications can consider transactions confirmed at `ACCEPTED_ON_L2`.

## Error Handling

### Common Errors

```typescript
// Insufficient balance
{
  success: false,
  transactionHash: '',
  error: 'Insufficient balance for transaction'
}

// Invalid address
{
  success: false,
  transactionHash: '',
  error: 'Invalid recipient address'
}

// Transaction rejected
{
  success: false,
  transactionHash: '',
  error: 'User rejected transaction'
}

// Network error
{
  success: false,
  transactionHash: '',
  error: 'Network request failed'
}
```

### Best Practices

1. **Always validate addresses** before sending
2. **Check sufficient balance** including gas fees
3. **Handle user rejection** gracefully
4. **Show transaction status** to users during confirmation
5. **Implement timeout handling** for slow confirmations
6. **Store transaction hashes** for later reference

## Testing

### Manual Testing Checklist

- [ ] Connect Argent X wallet
- [ ] Connect Braavos wallet
- [ ] Check ETH balance
- [ ] Check USDC balance
- [ ] Send ETH transaction
- [ ] Send USDC transaction
- [ ] Wait for transaction confirmation
- [ ] Check transaction status
- [ ] Validate addresses
- [ ] Handle insufficient balance
- [ ] Handle user rejection
- [ ] Test with different amounts
- [ ] Test fee estimation
- [ ] Test token metadata fetch

### Test on Testnet First

Before using on mainnet, test on Starknet Goerli testnet:

```typescript
const STARKNET_RPC_URL = 'https://starknet-goerli.public.blastapi.io';
```

## Comparison with Other Chains

| Feature | Solana | NEAR | Sui | Starknet |
|---------|--------|------|-----|----------|
| Native Token | SOL | NEAR | SUI | ETH |
| Token Standard | SPL | FT | Coins | ERC-20 |
| Address Format | Base58 | account.near | 0x + 64 hex | 0x + 64 hex |
| Confirmation | ~0.4s | ~1-2s | ~1-2s | ~1-2 min (L2) |
| Avg Fee | 0.000005 SOL | 0.0005 NEAR | 0.001 SUI | 0.002 ETH |
| Account Model | UTXO-like | Named | Object | Account |

## Security Considerations

1. **Address Validation**: Always validate addresses before transactions
2. **Amount Validation**: Ensure amounts are within safe ranges
3. **Slippage**: Consider implementing slippage protection for swaps
4. **User Confirmation**: Always show clear transaction details before signing
5. **Error Messages**: Don't expose sensitive information in error messages
6. **RPC Endpoint**: Use reliable, secure RPC endpoints

## Limitations

1. **L1 Finality**: Full finality requires L1 confirmation (4-8 hours)
2. **Gas Estimation**: Estimates may not be 100% accurate
3. **Token Discovery**: No automatic token discovery implemented
4. **Contract Verification**: No automatic contract verification
5. **Multi-call**: Advanced multi-call transactions not fully supported

## Future Enhancements

### Phase 2.4.3+ Potential Features

1. **Account Abstraction**: Leverage Starknet's native account abstraction
2. **Multi-call Transactions**: Batch multiple calls in one transaction
3. **Swap Integration**: Direct DEX integration (e.g., JediSwap, mySwap)
4. **NFT Support**: Handle ERC-721 and ERC-1155 tokens
5. **Token Discovery**: Automatic token list loading
6. **Gas Optimization**: Advanced gas estimation and optimization
7. **Signature Types**: Support multiple signature schemes
8. **Session Keys**: Implement session key functionality

## Resources

### Documentation
- [Starknet.js Documentation](https://www.starknetjs.com/)
- [Starknet Documentation](https://docs.starknet.io/)
- [Argent X Wallet](https://www.argent.xyz/argent-x/)
- [Braavos Wallet](https://braavos.app/)

### Block Explorers
- [Starkscan](https://starkscan.co/)
- [Voyager](https://voyager.online/)

### Tools
- [Starknet Devnet](https://github.com/0xSpaceShard/starknet-devnet)
- [Starknet Foundry](https://foundry-rs.github.io/starknet-foundry/)

## Support

For issues or questions:
1. Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide
2. Review Starknet.js documentation
3. Check wallet-specific documentation (Argent X, Braavos)
4. Test on testnet before mainnet

## Conclusion

Phase 2.4.2 successfully implements full transaction capabilities for Starknet, bringing it to feature parity with Solana, NEAR, and Sui. Users can now programmatically send ETH, transfer ERC-20 tokens, query balances, and track transactions - enabling seamless cross-chain swaps with Starknet tokens.

**Next Phase**: [Phase 2.4.3](./PHASE_2.4.3_STELLAR_TRANSACTIONS.md) - Stellar Transaction Implementation
