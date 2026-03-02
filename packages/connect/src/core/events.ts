import type { WalletEvent, WalletEventMap } from './types';

type Listener<T> = (data: T) => void;

export class WalletEventEmitter {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<E extends WalletEvent>(event: E, listener: Listener<WalletEventMap[E]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
  }

  off<E extends WalletEvent>(event: E, listener: Listener<WalletEventMap[E]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<E extends WalletEvent>(event: E, data: WalletEventMap[E]): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error(`[BlinkConnect] Event listener error (${event}):`, err);
      }
    });
  }

  removeAllListeners(event?: WalletEvent): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const globalEvents = new WalletEventEmitter();
