// Core types
export type {
  ChainType,
  ConnectedWallet,
  BlinkConnectConfig,
  WalletState,
  ChainAdapter,
  ConnectOptions,
  AdapterHookResult,
  WalletEvent,
  WalletEventMap,
} from './core/types';
export { normalizeChainType } from './core/types';

// Core utilities
export { WalletEventEmitter, globalEvents } from './core/events';
export { createWalletStore } from './core/store';
export type { WalletStore } from './core/store';

// Utils
export { formatAddress, truncateAddress, validateAddress } from './utils/address';
export { getChainMeta, getAllChainMeta, getExplorerTxUrl, getExplorerAddressUrl } from './utils/chains';
export type { ChainMeta } from './utils/chains';
export { persistSession, loadSession, clearSession } from './utils/storage';
