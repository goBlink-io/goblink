/**
 * Unified Wallet Manager
 * 
 * Provides a chain-agnostic interface for wallet operations across all supported blockchains.
 * Acts as an orchestration layer that delegates to chain-specific implementations.
 */

import type {
  SupportedChain,
  WalletInfo,
  WalletConnectionState,
  ChainBalance,
  TokenBalance,
  TransactionRequest,
  TransactionResult,
  TransactionStatus,
  IUnifiedWallet,
} from '../types/wallet';

// ============================================================================
// Unified Wallet Manager
// ============================================================================

export class UnifiedWalletManager implements IUnifiedWallet {
  private wallets: Map<SupportedChain, WalletInfo> = new Map();
  private chainProviders: Map<SupportedChain, any> = new Map();
  
  constructor() {
    this.initializeWallets();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeWallets() {
    const chains: SupportedChain[] = [
      'evm',
      'solana',
      'near',
      'sui',
      'stellar',
      'starknet',
      'ton',
      'tron',
      'bitcoin',
    ];

    chains.forEach(chain => {
      this.wallets.set(chain, {
        chain,
        address: '',
        connectionState: 'disconnected',
      });
    });
  }

  // ============================================================================
  // Provider Registration
  // ============================================================================

  /**
   * Register a chain-specific provider
   */
  registerProvider(chain: SupportedChain, provider: any) {
    this.chainProviders.set(chain, provider);
  }

  /**
   * Get a chain-specific provider
   */
  getProvider(chain: SupportedChain): any {
    return this.chainProviders.get(chain);
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  async connect(chain: SupportedChain): Promise<void> {
    const provider = this.getProvider(chain);
    if (!provider) {
      throw new Error(`No provider registered for chain: ${chain}`);
    }

    try {
      this.updateWalletState(chain, { connectionState: 'connecting' });
      
      // Call chain-specific connect method
      await provider.connect?.();
      
      // Get address after connection
      const address = await this.getAddressFromProvider(chain, provider);
      
      this.updateWalletState(chain, {
        address: address || '',
        connectionState: 'connected',
        error: undefined,
      });
    } catch (error: any) {
      this.updateWalletState(chain, {
        connectionState: 'error',
        error: {
          code: 'CONNECTION_FAILED',
          message: error.message || 'Failed to connect wallet',
          details: error,
        },
      });
      throw error;
    }
  }

  async disconnect(chain: SupportedChain): Promise<void> {
    const provider = this.getProvider(chain);
    if (!provider) {
      return;
    }

    try {
      this.updateWalletState(chain, { connectionState: 'disconnecting' });
      
      // Call chain-specific disconnect method
      await provider.disconnect?.();
      
      this.updateWalletState(chain, {
        address: '',
        connectionState: 'disconnected',
        error: undefined,
      });
    } catch (error: any) {
      this.updateWalletState(chain, {
        connectionState: 'error',
        error: {
          code: 'DISCONNECTION_FAILED',
          message: error.message || 'Failed to disconnect wallet',
          details: error,
        },
      });
      throw error;
    }
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.wallets.keys()).map(chain =>
      this.disconnect(chain).catch(err => {
        console.error(`Failed to disconnect ${chain}:`, err);
      })
    );
    
    await Promise.all(disconnectPromises);
  }

  // ============================================================================
  // Wallet Info
  // ============================================================================

  getWalletInfo(chain: SupportedChain): WalletInfo | null {
    return this.wallets.get(chain) || null;
  }

  getAllWallets(): WalletInfo[] {
    return Array.from(this.wallets.values());
  }

  isConnected(chain: SupportedChain): boolean {
    const wallet = this.wallets.get(chain);
    return wallet?.connectionState === 'connected' && !!wallet?.address;
  }

  getConnectedChains(): SupportedChain[] {
    return Array.from(this.wallets.entries())
      .filter(([_, wallet]) => wallet.connectionState === 'connected' && wallet.address)
      .map(([chain]) => chain);
  }

  // ============================================================================
  // Balance Queries
  // ============================================================================

  async getBalance(chain: SupportedChain, address?: string): Promise<string> {
    const provider = this.getProvider(chain);
    if (!provider) {
      throw new Error(`No provider registered for chain: ${chain}`);
    }

    const targetAddress = address || this.wallets.get(chain)?.address;
    if (!targetAddress) {
      throw new Error(`No address available for chain: ${chain}`);
    }

    try {
      // Call chain-specific balance method
      if (provider.getBalance) {
        return await provider.getBalance();
      }
      
      throw new Error(`Balance query not supported for chain: ${chain}`);
    } catch (error: any) {
      console.error(`Failed to get balance for ${chain}:`, error);
      throw error;
    }
  }

  async getTokenBalance(
    chain: SupportedChain,
    tokenAddress: string,
    address?: string
  ): Promise<string> {
    const provider = this.getProvider(chain);
    if (!provider) {
      throw new Error(`No provider registered for chain: ${chain}`);
    }

    const targetAddress = address || this.wallets.get(chain)?.address;
    if (!targetAddress) {
      throw new Error(`No address available for chain: ${chain}`);
    }

    try {
      // Call chain-specific token balance method
      const methodMap: Record<string, string> = {
        solana: 'getSPLBalanceFor',
        near: 'getFTBalanceFor',
        sui: 'getTokenBalance',
        stellar: 'getAssetBalance',
        starknet: 'getTokenBalance',
        ton: 'getJettonBalance',
        tron: 'getTRC20Balance',
      };

      const method = methodMap[chain];
      if (method && provider[method]) {
        return await provider[method](tokenAddress);
      }
      
      throw new Error(`Token balance query not supported for chain: ${chain}`);
    } catch (error: any) {
      console.error(`Failed to get token balance for ${chain}:`, error);
      throw error;
    }
  }

  async getAllBalances(chain: SupportedChain): Promise<ChainBalance> {
    const provider = this.getProvider(chain);
    if (!provider) {
      throw new Error(`No provider registered for chain: ${chain}`);
    }

    try {
      const nativeBalance = await this.getBalance(chain);
      
      // Get chain configuration
      const nativeTokenSymbols: Record<SupportedChain, string> = {
        evm: 'ETH',
        solana: 'SOL',
        near: 'NEAR',
        sui: 'SUI',
        stellar: 'XLM',
        starknet: 'ETH',
        ton: 'TON',
        tron: 'TRX',
        bitcoin: 'BTC',
      };

      const nativeToken: TokenBalance = {
        symbol: nativeTokenSymbols[chain],
        balance: nativeBalance,
        decimals: this.getChainDecimals(chain),
      };

      // Get token balances if provider supports it
      let tokens: TokenBalance[] = [];
      if (provider.getAllBalances) {
        const allBalances = await provider.getAllBalances();
        tokens = allBalances.filter((b: any) => b.balance !== '0');
      }

      return {
        chain,
        nativeToken,
        tokens,
      };
    } catch (error: any) {
      console.error(`Failed to get all balances for ${chain}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // Transactions
  // ============================================================================

  async sendTransaction(request: TransactionRequest): Promise<TransactionResult> {
    const { chain, from, to, amount, token, memo } = request;
    const provider = this.getProvider(chain);
    
    if (!provider) {
      throw new Error(`No provider registered for chain: ${chain}`);
    }

    if (!this.isConnected(chain)) {
      throw new Error(`Wallet not connected for chain: ${chain}`);
    }

    try {
      let txHash: string;

      // Route to appropriate send method based on chain and token
      if (token) {
        // Token transfer
        const tokenMethodMap: Record<string, string> = {
          evm: 'sendToken',
          solana: 'sendSPL',
          near: 'sendFT',
          sui: 'sendToken',
          stellar: 'sendAsset',
          starknet: 'sendToken',
          ton: 'sendJetton',
          tron: 'sendTRC20',
        };

        const method = tokenMethodMap[chain];
        if (!method || !provider[method]) {
          throw new Error(`Token transfer not supported for chain: ${chain}`);
        }

        // Different chains have different parameter orders
        if (chain === 'stellar') {
          // Stellar needs asset code and issuer separated
          throw new Error('Stellar asset transfers require asset code and issuer');
        } else if (chain === 'ton') {
          // TON needs jetton wallet address
          throw new Error('TON jetton transfers require jetton wallet address');
        } else {
          txHash = await provider[method](token, to, amount);
        }
      } else {
        // Native token transfer
        const nativeMethodMap: Record<string, string> = {
          evm: 'sendETH',
          solana: 'sendSOL',
          near: 'sendNear',
          sui: 'sendSUI',
          stellar: 'sendXLM',
          starknet: 'sendETH',
          ton: 'sendTON',
          tron: 'sendTRX',
          bitcoin: 'sendBTC',
        };

        const method = nativeMethodMap[chain];
        if (!method || !provider[method]) {
          throw new Error(`Native transfer not supported for chain: ${chain}`);
        }

        if (memo) {
          txHash = await provider[method](to, amount, memo);
        } else {
          txHash = await provider[method](to, amount);
        }
      }

      const result: TransactionResult = {
        hash: txHash,
        status: 'pending',
        chain,
        from,
        to,
        amount,
        token,
        timestamp: Date.now(),
      };

      // Wait for transaction confirmation if provider supports it
      if (provider.waitForTx) {
        try {
          await provider.waitForTx(txHash);
          result.status = 'confirmed';
        } catch (error) {
          console.warn(`Transaction confirmation polling failed for ${chain}:`, error);
          // Don't throw - transaction was still sent
        }
      }

      return result;
    } catch (error: any) {
      const result: TransactionResult = {
        hash: '',
        status: 'failed',
        chain,
        from,
        to,
        amount,
        token,
        timestamp: Date.now(),
        error: {
          code: 'TRANSACTION_FAILED',
          message: error.message || 'Transaction failed',
          details: error,
        },
      };
      throw result;
    }
  }

  async signMessage(chain: SupportedChain, message: string): Promise<string> {
    const provider = this.getProvider(chain);
    if (!provider) {
      throw new Error(`No provider registered for chain: ${chain}`);
    }

    if (!this.isConnected(chain)) {
      throw new Error(`Wallet not connected for chain: ${chain}`);
    }

    try {
      if (provider.signMessage) {
        return await provider.signMessage(message);
      }
      
      throw new Error(`Message signing not supported for chain: ${chain}`);
    } catch (error: any) {
      console.error(`Failed to sign message for ${chain}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  validateAddress(chain: SupportedChain, address: string): boolean {
    const provider = this.getProvider(chain);
    if (provider?.validateAddress) {
      return provider.validateAddress(address);
    }
    
    // Fallback basic validation
    return address.length > 0;
  }

  formatAmount(chain: SupportedChain, amount: string, decimals: number): string {
    const provider = this.getProvider(chain);
    if (provider?.formatAmount) {
      return provider.formatAmount(amount, decimals);
    }
    
    // Fallback formatting
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;
    return `${whole}.${remainder.toString().padStart(decimals, '0')}`;
  }

  parseAmount(chain: SupportedChain, amount: string, decimals: number): string {
    const provider = this.getProvider(chain);
    if (provider?.parseAmount) {
      return provider.parseAmount(amount, decimals);
    }
    
    // Fallback parsing
    const parts = amount.split('.');
    const whole = parts[0] || '0';
    const fraction = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
    return (BigInt(whole) * BigInt(10 ** decimals) + BigInt(fraction)).toString();
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private updateWalletState(chain: SupportedChain, updates: Partial<WalletInfo>) {
    const current = this.wallets.get(chain);
    if (current) {
      this.wallets.set(chain, { ...current, ...updates });
    }
  }

  private async getAddressFromProvider(chain: SupportedChain, provider: any): Promise<string | null> {
    try {
      // Different chains store address in different ways
      if (provider.address) return provider.address;
      if (provider.publicKey) return provider.publicKey.toString();
      if (provider.accountId) return provider.accountId;
      if (provider.account?.address) return provider.account.address;
      
      // Try calling getter methods
      if (provider.getAddress) return await provider.getAddress();
      if (provider.getAccount) {
        const account = await provider.getAccount();
        return account?.address || null;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get address from provider for ${chain}:`, error);
      return null;
    }
  }

  private getChainDecimals(chain: SupportedChain): number {
    const decimalsMap: Record<SupportedChain, number> = {
      evm: 18,
      solana: 9,
      near: 24,
      sui: 9,
      stellar: 7,
      starknet: 18,
      ton: 9,
      tron: 6,
      bitcoin: 8,
    };
    
    return decimalsMap[chain] || 18;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const unifiedWalletManager = new UnifiedWalletManager();
