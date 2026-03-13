import type { ChainType, AdapterHookResult, ConnectOptions } from '../core/types';

/**
 * Default no-op adapter returned when a chain's peer dependency is not installed.
 */
export function createNoopAdapter(chain: ChainType): AdapterHookResult {
  return {
    chain,
    address: null,
    connected: false,
    connect: async () => {
      console.warn(
        `[BlinkConnect] ${chain} adapter dependencies not installed. Skipping connect.`
      );
    },
    disconnect: async () => {},
  };
}

/**
 * Check if a module is available at runtime (for optional peer deps).
 */
/**
 * Check if a module is available at runtime (for optional peer deps).
 * NOTE: In bundled environments, dynamic require() detection does not work.
 * The adapters handle missing deps via try/catch at the hook level instead.
 * This function is kept as a no-op placeholder for API compatibility.
 */
export function isModuleAvailable(_moduleName: string): boolean {
  return false;
}
