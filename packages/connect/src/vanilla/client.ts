import type { BlinkConnectConfig, ChainType, ConnectedWallet, WalletEvent, WalletEventMap } from '../core/types';
import { WalletEventEmitter } from '../core/events';
import { createWalletStore } from '../core/store';

/**
 * Framework-agnostic BlinkConnect client.
 *
 * For non-React applications (vanilla JS, Vue, Svelte, etc.).
 * Provides the same wallet state management without React hooks.
 *
 * @example
 * ```ts
 * import { BlinkConnect } from '@goblink/connect/vanilla';
 *
 * const client = new BlinkConnect({ projectId: 'xxx' });
 *
 * client.on('connect', (wallet) => {
 *   console.log('Connected:', wallet.chain, wallet.address);
 * });
 *
 * // Get current state
 * const wallets = client.getWallets();
 * ```
 *
 * Note: The vanilla client provides state management and events.
 * Actual wallet connections in non-React apps require additional
 * setup with the underlying wallet SDKs, as most wallet adapters
 * are React-based. See docs for framework-specific guides.
 */
export class BlinkConnect {
  private config: BlinkConnectConfig;
  private store;
  private events: WalletEventEmitter;

  constructor(config: BlinkConnectConfig) {
    this.config = config;
    this.store = createWalletStore();
    this.events = new WalletEventEmitter();
  }

  /** Get all connected wallets */
  getWallets(): ConnectedWallet[] {
    return this.store.getState().wallets;
  }

  /** Get address for a specific chain */
  getAddress(chain: ChainType): string | null {
    return this.store.getAddress(chain);
  }

  /** Check if any wallet is connected */
  get isConnected(): boolean {
    return this.store.getState().wallets.length > 0;
  }

  /** Check if a specific chain is connected */
  isChainConnected(chain: ChainType): boolean {
    return this.store.isChainConnected(chain);
  }

  /** Subscribe to state changes */
  subscribe(listener: () => void): () => void {
    return this.store.subscribe(listener);
  }

  /** Listen to wallet events */
  on<E extends WalletEvent>(event: E, listener: (data: WalletEventMap[E]) => void): void {
    this.events.on(event, listener);
  }

  /** Remove event listener */
  off<E extends WalletEvent>(event: E, listener: (data: WalletEventMap[E]) => void): void {
    this.events.off(event, listener);
  }

  /** Update wallets (used internally or for manual state management) */
  setWallets(wallets: ConnectedWallet[]): void {
    const prev = this.store.getState().wallets;
    this.store.setWallets(wallets);

    // Emit events for new connections
    for (const wallet of wallets) {
      if (!prev.find((w) => w.chain === wallet.chain)) {
        this.events.emit('connect', wallet);
        this.config.onConnect?.(wallet);
      }
    }

    // Emit events for disconnections
    for (const wallet of prev) {
      if (!wallets.find((w) => w.chain === wallet.chain)) {
        this.events.emit('disconnect', wallet.chain);
        this.config.onDisconnect?.(wallet.chain);
      }
    }
  }

  /** Get the config */
  getConfig(): BlinkConnectConfig {
    return this.config;
  }

  /** Destroy the client and clean up */
  destroy(): void {
    this.events.removeAllListeners();
  }
}
