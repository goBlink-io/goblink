import type { ConnectedWallet, ChainType, WalletState } from './types';

type Subscriber = () => void;

export function createWalletStore(initialState?: Partial<WalletState>) {
  let state: WalletState = {
    wallets: [],
    isModalOpen: false,
    ...initialState,
  };

  const subscribers = new Set<Subscriber>();

  function getState(): WalletState {
    return state;
  }

  function setState(partial: Partial<WalletState>): void {
    state = { ...state, ...partial };
    subscribers.forEach((sub) => sub());
  }

  function subscribe(listener: Subscriber): () => void {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  }

  function setWallets(wallets: ConnectedWallet[]): void {
    setState({ wallets });
  }

  function getAddress(chain: ChainType): string | null {
    return state.wallets.find((w) => w.chain === chain)?.address ?? null;
  }

  function isChainConnected(chain: ChainType): boolean {
    return state.wallets.some((w) => w.chain === chain);
  }

  function openModal(): void {
    setState({ isModalOpen: true });
  }

  function closeModal(): void {
    setState({ isModalOpen: false });
  }

  return {
    getState,
    setState,
    subscribe,
    setWallets,
    getAddress,
    isChainConnected,
    openModal,
    closeModal,
  };
}

export type WalletStore = ReturnType<typeof createWalletStore>;
