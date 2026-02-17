// Re-export from shared package for consistency
// This file exists for backward compatibility — prefer importing from @sapphire/shared directly
export {
  EVM_CHAINS,
  EVM_CHAIN_NAMES,
  NATIVE_TOKEN_SYMBOLS,
  isEvmChain,
  isNativeToken,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from '@sapphire/shared';

export type { ChainConfig } from '@sapphire/shared';
