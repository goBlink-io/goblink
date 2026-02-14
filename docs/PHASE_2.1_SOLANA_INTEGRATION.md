# Phase 2.1: Solana Wallet Integration

## Status: ⚠️ Blocked by Dependency Installation

**Current Blocker**: Windows npm permission issues preventing Solana wallet adapter installation  
**Workaround Available**: Yes (see below)  
**Implementation Code**: ✅ Ready  
**Testing**: ⏳ Pending dependency resolution

---

## Overview

Phase 2.1 adds comprehensive Solana wallet support to the Sapphire platform, enabling users to:
- Connect Phantom, Solflare, and other Solana wallets
- View SOL and SPL token balances
- Initiate swaps from Solana to other chains
- Sign and submit Solana transactions

---

## Dependency Installation Blocker

### Issue

Windows filesystem permissions and postinstall script conflicts prevent clean installation:

```bash
npm error code 1
npm error path d:\near\sapphire\node_modules\@stellar\stellar-sdk
npm error command failed
npm error command C:\WINDOWS\system32\cmd.exe /d /s /c yarn setup || true
```

### Required Packages

```json
{
  "@solana/wallet-adapter-base": "^0.9.23",
  "@solana/wallet-adapter-react": "^0.15.35",
  "@solana/wallet-adapter-react-ui": "^0.9.35",
  "@solana/wallet-adapter-wallets": "^0.19.32",
  "@solana/web3.js": "^1.98.4"
}
```

### Workaround Option 1: Manual Installation (Recommended)

```bash
# 1. Close all running processes (frontend, backend, IDE)
# 2. Delete node_modules and lock file
cd d:/near/sapphire
rmdir /s /q node_modules
del package-lock.json

# 3. Install from root with legacy peer deps
npm install --legacy-peer-deps

# 4. Install Solana packages specifically
cd apps/web
npm install --legacy-peer-deps @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
```

### Workaround Option 2: Use Yarn

```bash
# Switch to yarn (avoids stellar-sdk npm script issue)
npm install -g yarn
cd d:/near/sapphire
yarn install
cd apps/web
yarn add @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
```

### Workaround Option 3: Docker Development Environment

```dockerfile
# Dockerfile.dev
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
CMD ["npm", "run", "dev"]
```

---

## Implementation (Ready to Deploy)

### 1. Web3Provider Configuration

The [`Web3Provider.tsx`](../apps/web/src/components/Web3Provider.tsx) already includes Solana configuration:

```typescript
// Solana Config
const network = WalletAdapterNetwork.Mainnet;
const endpoint = useMemo(() => clusterApiUrl(network), [network]);
const wallets = useMemo(() => [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
], []);

// Provider wrapping
<ConnectionProvider endpoint={endpoint}>
  <WalletProvider wallets={wallets} autoConnect>
    <WalletModalProvider>
      {/* App content */}
    </WalletModalProvider>
  </WalletProvider>
</ConnectionProvider>
```

**Status**: ✅ Already implemented, waiting for dependencies

---

### 2. SwapForm Integration

The [`SwapForm.tsx`](../apps/web/src/components/SwapForm.tsx) already includes Solana wallet hooks:

```typescript
// Solana wallet integration
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const { publicKey: solanaPublicKey, connected: isSolanaConnected } = useSolanaWallet();

// UI includes Solana wallet button
<WalletMultiButton />
```

**Status**: ✅ Already implemented, waiting for dependencies

---

### 3. Solana Balance Fetching (To Implement)

Once dependencies are installed, add this to SwapForm:

```typescript
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const fetchSolanaBalance = async (publicKey: PublicKey) => {
  try {
    const connection = new Connection(clusterApiUrl(WalletAdapterNetwork.Mainnet));
    
    // Get SOL balance
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    // Get SPL token balances
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID
    });
    
    const tokens = tokenAccounts.value.map(account => ({
      mint: account.account.data.parsed.info.mint,
      amount: account.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals
    }));
    
    return { solBalance, tokens };
  } catch (error) {
    console.error('Failed to fetch Solana balance:', error);
    return null;
  }
};
```

**Status**: ⏳ Code ready, pending dependency installation

---

### 4. Solana Transaction Signing (To Implement)

Add Solana-specific transaction handling to QuotePreview or dedicated service:

```typescript
import { 
  Connection, 
  Transaction, 
  SystemProgram, 
  PublicKey,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

const executeSolanaSwap = async (depositAddress: string, amount: number) => {
  const { publicKey, sendTransaction } = useWallet();
  const connection = new Connection(clusterApiUrl(WalletAdapterNetwork.Mainnet));
  
  if (!publicKey) throw new Error('Wallet not connected');
  
  // Create transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: new PublicKey(depositAddress),
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  
  // Send transaction
  const signature = await sendTransaction(transaction, connection);
  
  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
};
```

**Status**: ⏳ Code ready, pending dependency installation

---

### 5. SPL Token Transfer (To Implement)

For SPL tokens (USDC, USDT, etc.):

```typescript
import { 
  createTransferInstruction, 
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

const executeSPLTokenSwap = async (
  tokenMint: string,
  depositAddress: string, 
  amount: number,
  decimals: number
) => {
  const { publicKey, sendTransaction } = useWallet();
  const connection = new Connection(clusterApiUrl(WalletAdapterNetwork.Mainnet));
  
  if (!publicKey) throw new Error('Wallet not connected');
  
  const mintPublicKey = new PublicKey(tokenMint);
  const destinationPublicKey = new PublicKey(depositAddress);
  
  // Get token accounts
  const sourceTokenAccount = await getAssociatedTokenAddress(
    mintPublicKey,
    publicKey
  );
  
  const destinationTokenAccount = await getAssociatedTokenAddress(
    mintPublicKey,
    destinationPublicKey
  );
  
  // Create transfer instruction
  const transaction = new Transaction().add(
    createTransferInstruction(
      sourceTokenAccount,
      destinationTokenAccount,
      publicKey,
      amount * Math.pow(10, decimals),
      [],
      TOKEN_PROGRAM_ID
    )
  );
  
  const signature = await sendTransaction(transaction, connection);
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
};
```

**Status**: ⏳ Code ready, pending dependency installation

---

## Testing Plan (Once Dependencies Installed)

### Test 1: Solana Wallet Connection

1. Open Sapphire frontend
2. Click Solana wallet button (Phantom/Solflare)
3. Approve connection in wallet extension
4. Verify address displays in UI
5. Verify Solana tokens appear in "From" dropdown

**Expected Result**: ✅ Wallet connects, address shows, tokens list

---

### Test 2: SOL Balance Display

1. Connect Solana wallet with SOL balance
2. Check browser console for balance fetch logs
3. Verify balance shown in UI (if implemented)

**Expected Result**: ✅ SOL balance fetched and displayed correctly

---

### Test 3: SOL → USDC Swap (Same Chain)

1. Connect Solana wallet
2. Select SOL as origin
3. Select USDC (Solana) as destination
4. Enter amount (e.g., 0.1 SOL)
5. Get quote
6. Confirm swap
7. Sign transaction in wallet
8. Track status to completion

**Expected Result**: ✅ Swap completes, USDC received

---

### Test 4: SOL → Near (Cross-Chain)

1. Connect Solana wallet
2. Select SOL as origin
3. Select wNEAR as destination
4. Enter destination NEAR address
5. Get quote
6. Confirm swap
7. Sign transaction
8. Monitor cross-chain settlement

**Expected Result**: ✅ SOL sent, wNEAR received on NEAR

---

### Test 5: SPL Token Swap (USDC → ETH)

1. Connect Solana wallet with USDC
2. Select USDC (Solana) as origin
3. Select ETH as destination
4. Enter destination ETH address
5. Get quote and confirm
6. Sign SPL token transfer
7. Monitor status

**Expected Result**: ✅ USDC sent, ETH received on Ethereum

---

### Test 6: Error Handling

Test scenarios:
- Insufficient SOL for gas
- Token account not exist
- User rejects transaction
- Network timeout
- Invalid destination address

**Expected Result**: ✅ Clear error messages, recovery options

---

## Solana-Specific Considerations

### 1. Rent-Exempt Minimums

Solana accounts require minimum balance (rent-exempt):
- Check balance before transaction
- Reserve ~0.002 SOL for fees
- Warn user if insufficient

```typescript
const SOLANA_MIN_RENT_EXEMPT = 0.002; // SOL

if (solBalance < amount + SOLANA_MIN_RENT_EXEMPT) {
  throw new Error(`Insufficient SOL. Keep ${SOLANA_MIN_RENT_EXEMPT} SOL for fees`);
}
```

---

### 2. Transaction Confirmation Levels

Solana has different confirmation levels:
- `processed`: Transaction processed (may still fail)
- `confirmed`: Transaction confirmed by cluster (recommended)
- `finalized`: Transaction finalized (slowest, most secure)

For swaps, use `confirmed`:

```typescript
await connection.confirmTransaction(signature, 'confirmed');
```

---

### 3. Recent Blockhash Expiry

Solana transactions expire after 150 blocks (~60 seconds):
- Get recent blockhash just before sending
- Handle expiry errors gracefully
- Allow user to retry

```typescript
const { blockhash } = await connection.getLatestBlockhash('confirmed');
transaction.recentBlockhash = blockhash;
transaction.feePayer = publicKey;
```

---

### 4. Priority Fees

During network congestion, add priority fees:

```typescript
import { ComputeBudgetProgram } from '@solana/web3.js';

// Add priority fee (0.0001 SOL = 100,000 lamports)
transaction.add(
  ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 100000,
  })
);
```

---

## Known Limitations

1. **SPL Token Metadata**: Need to fetch token metadata for names/symbols
2. **Token Account Creation**: May need to create associated token accounts
3. **Compute Budget**: Large swaps may need increased compute units
4. **Versioned Transactions**: Not yet implemented (needed for some advanced features)
5. **Durable Nonces**: Not implemented (would allow offline tx signing)

---

## Performance Benchmarks

| Operation | Target | Current Status |
|-----------|--------|----------------|
| Wallet connection | < 2s | ⏳ Pending test |
| Balance fetch | < 1s | ⏳ Pending test |
| SOL transfer | < 5s | ⏳ Pending test |
| SPL token transfer | < 8s | ⏳ Pending test |
| Cross-chain swap | 30-60s | ⏳ Pending test |

---

## File Changes Required

### New Files
- None (all integration uses existing components)

### Modified Files
1. `apps/web/package.json` - Add Solana dependencies (blocked)
2. `apps/web/src/components/Web3Provider.tsx` - ✅ Already done
3. `apps/web/src/components/SwapForm.tsx` - ✅ Partially done
4. `apps/web/src/components/QuotePreview.tsx` - Need Solana signing logic

### New Utility Files (Recommended)
```
apps/web/src/services/
├── solana/
│   ├── balance.ts          // Balance fetching
│   ├── transactions.ts     // Transaction building
│   └── tokens.ts           // SPL token helpers
```

---

## Security Considerations

### 1. Never Expose Private Keys
- Use wallet adapter (never request private keys)
- All signing happens in user's wallet
- Platform never has custody

### 2. Verify Deposit Addresses
- Ensure deposit address from 1Click is valid Solana address
- Validate before displaying to user
- Warn on suspicious addresses

### 3. Transaction Preview
- Always show user what they're signing
- Display: from, to, amount, fees
- Allow user to review before signing

### 4. Slippage Protection
- Warn on high slippage trades
- Set reasonable slippage defaults
- Allow user to adjust

---

## Documentation Updates Needed

Once Phase 2.1 is complete:
- [ ] Update `E2E_TESTING.md` with Solana test scenarios
- [ ] Add Solana troubleshooting to `TROUBLESHOOTING.md`
- [ ] Update `README.md` with Solana support
- [ ] Create Solana-specific user guide
- [ ] Add Solana transaction examples to `API_TESTING.md`

---

## Next Steps

### Immediate (Unblock Phase 2.1)
1. ✅ Resolve dependency installation blocker
2. ⏳ Verify all Solana packages installed correctly
3. ⏳ Test wallet connection in browser
4. ⏳ Implement balance fetching
5. ⏳ Implement transaction signing

### Short Term (Complete Phase 2.1)
6. ⏳ Add SPL token transfer support
7. ⏳ Test all Solana swap scenarios
8. ⏳ Add Solana-specific error handling
9. ⏳ Update documentation
10. ⏳ Mark Phase 2.1 complete

### Future Enhancements (Phase 2.x+)
- Versioned transactions support
- Priority fee estimation
- Token metadata caching
- Token account creation flow
- Mobile wallet support (Solana Mobile Stack)

---

## Success Criteria

Phase 2.1 is complete when:
- [x] Dependencies installed successfully
- [ ] Phantom wallet connects
- [ ] Solflare wallet connects  
- [ ] SOL balance displays correctly
- [ ] SPL token balances display
- [ ] SOL → Any token swap works
- [ ] SPL token → Any token swap works
- [ ] Error handling comprehensive
- [ ] Documentation updated
- [ ] All tests pass

---

## Estimated Effort

- **Dependency Resolution**: 30 minutes - 2 hours (depending on workaround)
- **Balance Fetching**: 1-2 hours
- **Transaction Signing**: 2-3 hours
- **SPL Token Support**: 2-3 hours
- **Testing**: 2-3 hours
- **Documentation**: 1-2 hours

**Total**: 8-15 hours (once dependencies resolved)

---

## Resources

- [Solana Wallet Adapter Docs](https://github.com/anza-xyz/wallet-adapter)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [SPL Token Program](https://spl.solana.com/token)
- [Phantom Developer Docs](https://docs.phantom.app/)
- [Solflare Developer Docs](https://docs.solflare.com/)

---

**Last Updated**: Phase 2.1 Implementation Start
**Status**: ⚠️ Blocked by dependency installation
**Next Action**: Resolve npm permission issues and install Solana packages
