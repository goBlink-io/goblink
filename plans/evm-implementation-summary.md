# EVM Integration - Implementation Summary

## Overview
Integrating 6 EVM chains into Sapphire with wallet-based transaction signing and backend balance fetching.

---

## Chain Status

### ✅ Production Ready (Implement First)
1. **Ethereum Mainnet** - Already configured, needs balance service
2. **Base (Coinbase L2)** - Already configured, needs balance service  
3. **Arbitrum One** - Already configured, needs balance service
4. **BNB Chain (BSC)** - Add configuration + balance service

### 🔜 Coming Soon (Prepare Config)
5. **Berachain** - Config ready, mark as "Coming Soon" in UI
6. **Monad** - Config ready, mark as "Coming Soon" in UI

---

## Implementation Phases

### Phase 1: Core Infrastructure (Day 1-2)
**Goal**: Set up EVM balance service and API endpoints

Files to create:
- `apps/api/src/services/evm.ts` - Balance fetching with viem
- Update `apps/api/src/routes/balances.ts` - Add EVM endpoints
- Add `viem` to `apps/api/package.json`

**Deliverable**: Working balance API for all EVM chains

---

### Phase 2: Frontend Integration (Day 2-3)
**Goal**: Connect UI to EVM balance service

Files to update:
- `apps/web/src/lib/balances.ts` - Add EVM balance functions
- `apps/web/src/lib/chains.ts` (new) - Chain metadata & configs
- `apps/web/src/components/SwapForm.tsx` - Map EVM chains

**Deliverable**: Real-time balance display for EVM tokens

---

### Phase 3: Chain Configurations (Day 3)
**Goal**: Complete chain setup with BNB, Berachain, Monad

Files to update:
- `apps/web/src/components/Web3Provider.tsx` - Add all 6 chains to wagmi
- `.env.example` - Add RPC URLs for new chains
- `apps/web/src/components/ConnectWalletModal.tsx` - Update chain descriptions

**Deliverable**: All 6 chains visible in wallet connection UI

---

### Phase 4: Polish & Testing (Day 4)
**Goal**: Explorer links, error handling, testing

Files to update:
- `apps/web/src/components/TransactionModal.tsx` - Chain-specific explorer links
- Add error boundaries and loading states
- Test all chains end-to-end

**Deliverable**: Production-ready EVM integration

---

## Key Technical Decisions

### ✅ Confirmed Approach
- **RPC Providers**: Free public RPCs (upgrade path to Alchemy/Infura later)
- **Transaction Signing**: Wallets handle everything (ReOwn AppKit)
- **Balance Fetching**: Backend API → viem PublicClient → RPC
- **Architecture**: Same pattern as Sui/Solana (proven)

### 🎯 "Coming Soon" Chains
- Berachain and Monad will be:
  - ✅ Configured in code
  - ✅ Visible in UI with "Coming Soon" badge
  - ✅ Ready to activate when mainnet launches
  - ❌ Not functional until mainnet is live

---

## Quick Start Commands

### Install Dependencies
```bash
cd apps/api
npm install viem

cd ../web  
# viem already installed via wagmi
```

### Test Balance Endpoints
```bash
# Native ETH balance
curl http://localhost:3001/api/balances/evm/ethereum/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# USDC on Base
curl "http://localhost:3001/api/balances/evm-token/base/0xYOUR_ADDRESS?tokenAddress=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&decimals=6"

# BNB balance
curl http://localhost:3001/api/balances/evm/bsc/0xYOUR_ADDRESS
```

---

## Code Architecture

### Backend Service Layer
```
apps/api/src/services/evm.ts
├── getNativeBalance(chain, address)
├── getTokenBalance(chain, address, tokenAddress)
└── getMultipleBalances(chain, address, tokenAddresses[])
```

### API Routes Layer
```
apps/api/src/routes/balances.ts
├── GET /api/balances/evm/:chain/:address
└── GET /api/balances/evm-token/:chain/:address?tokenAddress=...
```

### Frontend Integration
```
apps/web/src/lib/balances.ts
├── getEvmBalance(chain, address)
├── getEvmTokenBalance(chain, address, tokenAddress)
└── getTokenBalance() [updated to handle EVM]
```

---

## RPC Endpoints (Free Public)

### Production Chains
```bash
# Ethereum
https://eth.llamarpc.com
Rate limit: ~10-20 req/sec

# Base  
https://mainnet.base.org
Rate limit: ~10 req/sec

# Arbitrum
https://arb1.arbitrum.io/rpc
Rate limit: ~10 req/sec

# BNB Chain
https://bsc-dataseed1.binance.org
Rate limit: ~10 req/sec
```

### Upgrade Path
When you need more performance:
1. Sign up for Alchemy (300M compute units/month free)
2. Update RPC URLs in `.env`:
   ```bash
   ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
   BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
   ```
3. No code changes needed!

---

## Explorer URLs

| Chain | Explorer | Transaction Format |
|-------|----------|-------------------|
| Ethereum | etherscan.io | /tx/{hash} |
| Base | basescan.org | /tx/{hash} |
| Arbitrum | arbiscan.io | /tx/{hash} |
| BNB Chain | bscscan.com | /tx/{hash} |
| Berachain | artio.beratrail.io | /tx/{hash} |
| Monad | explorer.monad.xyz | /tx/{hash} |

---

## Testing Checklist

### Backend Tests
- [ ] GET `/api/balances/evm/ethereum/0x...` returns ETH balance
- [ ] GET `/api/balances/evm/base/0x...` returns ETH balance
- [ ] GET `/api/balances/evm/bsc/0x...` returns BNB balance
- [ ] GET `/api/balances/evm-token/base/0x...?tokenAddress=USDC` returns balance
- [ ] Invalid chain returns 400 error
- [ ] Invalid address returns 500 error with message

### Frontend Tests
- [ ] Connect wallet via ReOwn AppKit
- [ ] Switch between EVM chains in wallet
- [ ] Balance updates when chain switches
- [ ] Balance displays correctly for native tokens
- [ ] Balance displays correctly for ERC-20 tokens
- [ ] "Coming Soon" badge shows for Berachain/Monad
- [ ] Explorer links open correctly for each chain

### Integration Tests
- [ ] Select token on Ethereum → shows ETH balance
- [ ] Select USDC on Base → shows USDC balance
- [ ] Switch wallet → balance updates
- [ ] Sign transaction → wallet prompts correctly
- [ ] Transaction completes → correct explorer link

---

## Security Notes

### ✅ Safe Practices (Already Implemented)
- Wallets handle all private keys
- Backend only reads blockchain data
- No transaction construction in backend
- CORS restricted to your frontend

### 📋 Additional Recommendations
1. **Rate Limiting**: Add to balance endpoints (100 req/min per IP)
2. **Caching**: Cache balances for 10-30 seconds
3. **Input Validation**: Validate addresses with viem's `isAddress()`
4. **Error Handling**: Don't expose internal errors to frontend

---

## File Checklist

### Files to Create
- [ ] `apps/api/src/services/evm.ts`
- [ ] `apps/web/src/lib/chains.ts`

### Files to Update
- [ ] `apps/api/src/routes/balances.ts`
- [ ] `apps/api/package.json`
- [ ] `apps/web/src/lib/balances.ts`
- [ ] `apps/web/src/components/Web3Provider.tsx`
- [ ] `apps/web/src/components/SwapForm.tsx`
- [ ] `apps/web/src/components/TransactionModal.tsx`
- [ ] `apps/web/src/components/ConnectWalletModal.tsx`
- [ ] `.env.example`

### Documentation to Create/Update
- [ ] `docs/EVM_INTEGRATION.md` (new)
- [ ] `README.md` (add EVM chains to supported chains list)
- [ ] `docs/API_TESTING.md` (add EVM endpoints)

---

## Success Criteria

### Minimum Viable Product (MVP)
✅ 4 production chains working (ETH, Base, Arbitrum, BNB)
✅ Native token balances displayed correctly
✅ ERC-20 token balances displayed correctly
✅ Wallet-based transaction signing working
✅ Correct explorer links for all chains

### Nice to Have
✅ Berachain/Monad configs ready ("Coming Soon")
✅ Caching for better performance
✅ Batch balance fetching for multiple tokens
✅ Fallback RPC URLs for reliability

---

## Rollback Plan

If something goes wrong:

### Backend Rollback
```bash
# Comment out EVM routes in balances.ts
# Remove evm.ts service file
# Remove viem from package.json
```

### Frontend Rollback
```bash
# Remove EVM balance functions from balances.ts
# Remove chains.ts file
# Revert Web3Provider.tsx to original chains
```

**Impact**: No impact on existing chains (NEAR, Sui, Solana)

---

## Next Steps After EVM Integration

### Phase 2 Enhancements
1. **Token Discovery**: Auto-detect ERC-20 tokens in wallet
2. **Price Feeds**: Add USD prices for better UX
3. **Transaction History**: Show past swaps per chain
4. **Gas Estimation**: Show estimated gas fees

### Advanced Features
1. **Multi-hop Swaps**: ETH → Base → Arbitrum
2. **Batch Operations**: Multiple swaps in one transaction
3. **NFT Support**: Cross-chain NFT transfers
4. **DeFi Integration**: Stake, farm, borrow across chains

---

## Support Resources

### Documentation
- [Viem Docs](https://viem.sh) - RPC client library
- [Wagmi Docs](https://wagmi.sh) - React hooks
- [ReOwn AppKit](https://docs.reown.com/appkit) - Wallet connection
- [ChainList](https://chainlist.org) - Chain IDs and RPCs

### Community
- [Berachain Discord](https://discord.gg/berachain)
- [Monad Discord](https://discord.gg/monad)
- [NEAR Discord](https://discord.gg/near) - For intents protocol

---

## Questions & Answers

**Q: Why not use ethers.js instead of viem?**  
A: Viem is TypeScript-first, tree-shakeable, and more modern. Better performance and DX.

**Q: Do we need to handle gas fees in the backend?**  
A: No! Wallets estimate and handle all gas. We only fetch balances.

**Q: What if public RPCs go down?**  
A: Plan includes easy upgrade to paid providers (Alchemy/Infura) with zero code changes.

**Q: How do we add more EVM chains later?**  
A: Just add to `CHAIN_CONFIGS` in `evm.ts` and wagmi config. Same code works for all EVM chains.

**Q: When should we add Berachain/Monad?**  
A: Monitor their mainnet launch announcements. When live, change "Coming Soon" flag to active.

---

## Ready to Implement?

You now have:
- ✅ Complete technical plan
- ✅ Code examples for all components
- ✅ Testing strategy
- ✅ Security considerations
- ✅ Rollback plan

**Estimated Implementation Time**: 3-4 days for full integration and testing

Would you like to proceed with implementation in Code mode?
