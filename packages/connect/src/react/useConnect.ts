import { useBlinkWalletContext } from './BlinkConnectProvider';
import type { ChainType } from '../core/types';

export interface UseConnectReturn {
  /** Open the connect modal */
  openModal: () => void;

  /** Close the connect modal */
  closeModal: () => void;

  /** Whether the modal is currently open */
  isModalOpen: boolean;

  /** Connect a specific chain directly (bypasses modal) */
  connectChain: (chain: ChainType) => Promise<void>;

  /** Disconnect a specific chain */
  disconnectChain: (chain: ChainType) => Promise<void>;

  /** Disconnect all chains */
  disconnectAll: () => Promise<void>;
}

/**
 * Hook for connection management (modal, connect, disconnect).
 *
 * @example
 * ```tsx
 * const { openModal, isModalOpen, connectChain } = useConnect();
 *
 * <button onClick={openModal}>Open Wallet Modal</button>
 * <button onClick={() => connectChain('evm')}>Connect EVM</button>
 * ```
 */
export function useConnect(): UseConnectReturn {
  const ctx = useBlinkWalletContext();

  return {
    openModal: ctx.openModal,
    closeModal: ctx.closeModal,
    isModalOpen: ctx.isModalOpen,
    connectChain: async (chain: ChainType) => ctx.connect(chain),
    disconnectChain: async (chain: ChainType) => ctx.disconnect(chain),
    disconnectAll: ctx.disconnectAll,
  };
}
