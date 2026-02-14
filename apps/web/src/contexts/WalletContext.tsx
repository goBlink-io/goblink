'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKitAccount, useDisconnect as useAppKitDisconnect } from '@reown/appkit/react';
import { useCurrentAccount as useSuiAccount } from '@mysten/dapp-kit';
import { initNearConnector, disconnectNearWallet, getNearAccount } from '@/lib/nearConnector';

export type ChainType = 'evm' | 'solana' | 'sui' | 'near' | 'bitcoin';

export interface WalletState {
  chain: ChainType | null;
  address: string | null;
  isConnected: boolean;
}

interface WalletContextType {
  // Current connected wallet
  walletState: WalletState;
  
  // Individual chain states
  evmAddress: string | null;
  solanaAddress: string | null;
  suiAddress: string | null;
  nearAddress: string | null;
  bitcoinAddress: string | null;
  
  // Connection states
  isEvmConnected: boolean;
  isSolanaConnected: boolean;
  isSuiConnected: boolean;
  isNearConnected: boolean;
  isBitcoinConnected: boolean;
  
  // Modal control
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  
  // Disconnect functions
  disconnectAll: () => void;
  disconnectChain: (chain: ChainType) => void;
  
  // Chain switching
  switchChain: (chain: ChainType) => void;
  
  // Get address for specific chain
  getAddressForChain: (chain: ChainType) => string | null;
  
  // Get all connected chains
  getConnectedChains: () => Array<{ chain: ChainType; address: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nearAddress, setNearAddress] = useState<string | null>(null);
  const [isNearConnected, setIsNearConnected] = useState(false);
  const [activeChain, setActiveChain] = useState<ChainType | null>(null);
  
  // ReOwn AppKit account (handles EVM, Solana, Bitcoin)
  const { address: appKitAddress, isConnected: appKitConnected, caipAddress } = useAppKitAccount();
  const { disconnect: appKitDisconnect } = useAppKitDisconnect();
  
  // Legacy Wagmi for EVM (backup)
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  // Determine chain type from CAIP address
  const getChainFromCaip = (caip?: string): ChainType | null => {
    if (!caip) return null;
    if (caip.startsWith('eip155:')) return 'evm';
    if (caip.startsWith('solana:')) return 'solana';
    if (caip.startsWith('bip122:')) return 'bitcoin';
    return null;
  };
  
  const appKitChain = getChainFromCaip(caipAddress);
  
  // Extract addresses by chain
  const evmAddress: string | null = (appKitChain === 'evm' && appKitAddress) || (wagmiConnected && wagmiAddress) || null;
  const solanaAddress: string | null = (appKitChain === 'solana' && appKitAddress) || null;
  const bitcoinAddress: string | null = (appKitChain === 'bitcoin' && appKitAddress) || null;
  
  const isEvmConnected = appKitChain === 'evm' || wagmiConnected;
  const isSolanaConnected = appKitChain === 'solana';
  const isBitcoinConnected = appKitChain === 'bitcoin';
  
  // Sui
  const suiAccount = useSuiAccount();
  const isSuiConnected = !!suiAccount;
  const suiAddress = suiAccount?.address || null;
  
  // NEAR - Initialize connector and listen for account changes
  useEffect(() => {
    const connector = initNearConnector();
    if (!connector) return;
    
    // Check initial connection state
    const checkNearConnection = async () => {
      try {
        // Check if wallet is already connected using the helper function
        const account = await getNearAccount();
        
        console.log('[NEAR] Checking connection, accountId:', account);
        
        if (account) {
          console.log('[NEAR] Found connected account:', account);
          setNearAddress(account);
          setIsNearConnected(true);
        } else {
          console.log('[NEAR] No connected account found');
        }
      } catch (error) {
        console.error('[NEAR] Failed to check NEAR connection:', error);
      }
    };
    
    // Wait a bit for connector to fully initialize
    const timer = setTimeout(() => {
      checkNearConnection();
    }, 500);
    
    // Subscribe to NEAR wallet events
    const handleSignIn = async () => {
      console.log('[NEAR] Sign in event triggered');
      try {
        const account = await getNearAccount();
        if (account) {
          console.log('[NEAR] Setting account from signIn:', account);
          setNearAddress(account);
          setIsNearConnected(true);
        }
      } catch (error) {
        console.error('[NEAR] Error in handleSignIn:', error);
      }
    };
    
    const handleSignOut = () => {
      console.log('[NEAR] Sign out event triggered');
      setNearAddress(null);
      setIsNearConnected(false);
    };
    
    connector.on('wallet:signIn', handleSignIn);
    connector.on('wallet:signOut', handleSignOut);
    
    return () => {
      clearTimeout(timer);
      connector.off('wallet:signIn', handleSignIn);
      connector.off('wallet:signOut', handleSignOut);
    };
  }, []);
  
  // Determine primary connected wallet
  const [walletState, setWalletState] = useState<WalletState>({
    chain: null,
    address: null,
    isConnected: false,
  });
  
  // Helper function to get address for a chain
  const getAddressForChain = (chain: ChainType): string | null => {
    switch (chain) {
      case 'evm':
        return evmAddress;
      case 'solana':
        return solanaAddress;
      case 'bitcoin':
        return bitcoinAddress;
      case 'sui':
        return suiAddress;
      case 'near':
        return nearAddress;
      default:
        return null;
    }
  };
  
  // Update wallet state based on active chain or first available connection
  useEffect(() => {
    // If we have an active chain set, use it (if still connected)
    if (activeChain) {
      const address = getAddressForChain(activeChain);
      const isConnected = (() => {
        switch (activeChain) {
          case 'evm': return isEvmConnected;
          case 'solana': return isSolanaConnected;
          case 'bitcoin': return isBitcoinConnected;
          case 'sui': return isSuiConnected;
          case 'near': return isNearConnected;
          default: return false;
        }
      })();
      
      if (isConnected && address) {
        setWalletState({ chain: activeChain, address, isConnected: true });
        return;
      } else {
        // Active chain is no longer connected, clear it and fall through to auto-select
        setActiveChain(null);
      }
    }
    
    // Auto-select first connected wallet (priority order)
    if (isNearConnected && nearAddress) {
      setWalletState({ chain: 'near', address: nearAddress, isConnected: true });
      if (!activeChain) setActiveChain('near');
    } else if (isEvmConnected && evmAddress) {
      setWalletState({ chain: 'evm', address: evmAddress, isConnected: true });
      if (!activeChain) setActiveChain('evm');
    } else if (isSolanaConnected && solanaAddress) {
      setWalletState({ chain: 'solana', address: solanaAddress, isConnected: true });
      if (!activeChain) setActiveChain('solana');
    } else if (isBitcoinConnected && bitcoinAddress) {
      setWalletState({ chain: 'bitcoin', address: bitcoinAddress, isConnected: true });
      if (!activeChain) setActiveChain('bitcoin');
    } else if (isSuiConnected && suiAddress) {
      setWalletState({ chain: 'sui', address: suiAddress, isConnected: true });
      if (!activeChain) setActiveChain('sui');
    } else {
      setWalletState({ chain: null, address: null, isConnected: false });
    }
  }, [evmAddress, solanaAddress, bitcoinAddress, suiAddress, nearAddress,
      isEvmConnected, isSolanaConnected, isBitcoinConnected, isSuiConnected, isNearConnected]);
  
  // Separate effect to handle activeChain changes (for manual switching)
  useEffect(() => {
    if (!activeChain) return;
    
    const address = getAddressForChain(activeChain);
    const isConnected = (() => {
      switch (activeChain) {
        case 'evm': return isEvmConnected;
        case 'solana': return isSolanaConnected;
        case 'bitcoin': return isBitcoinConnected;
        case 'sui': return isSuiConnected;
        case 'near': return isNearConnected;
        default: return false;
      }
    })();
    
    if (isConnected && address) {
      setWalletState({ chain: activeChain, address, isConnected: true });
    }
  }, [activeChain]);
  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  const disconnectChain = async (chain: ChainType) => {
    switch (chain) {
      case 'evm':
      case 'solana':
      case 'bitcoin':
        await appKitDisconnect();
        if (wagmiConnected) wagmiDisconnect();
        break;
      case 'sui':
        console.log('Sui: disconnect from wallet extension');
        break;
      case 'near':
        await disconnectNearWallet();
        setNearAddress(null);
        setIsNearConnected(false);
        break;
    }
  };
  
  const disconnectAll = async () => {
    if (appKitConnected) await appKitDisconnect();
    if (wagmiConnected) wagmiDisconnect();
    if (isNearConnected) {
      await disconnectNearWallet();
      setNearAddress(null);
      setIsNearConnected(false);
    }
    setActiveChain(null);
  };
  
  const switchChain = async (chain: ChainType) => {
    // Check if the target chain is connected
    const address = getAddressForChain(chain);
    if (!address) {
      console.warn(`Cannot switch to ${chain}: wallet not connected`);
      return;
    }
    
    // Disconnect the current active chain if different
    if (activeChain && activeChain !== chain) {
      await disconnectChain(activeChain);
    }
    
    // Set the new active chain
    setActiveChain(chain);
  };
  
  const getConnectedChains = () => {
    const chains: Array<{ chain: ChainType; address: string }> = [];
    if (isEvmConnected && evmAddress) chains.push({ chain: 'evm', address: evmAddress });
    if (isSolanaConnected && solanaAddress) chains.push({ chain: 'solana', address: solanaAddress });
    if (isBitcoinConnected && bitcoinAddress) chains.push({ chain: 'bitcoin', address: bitcoinAddress });
    if (isSuiConnected && suiAddress) chains.push({ chain: 'sui', address: suiAddress });
    if (isNearConnected && nearAddress) chains.push({ chain: 'near', address: nearAddress });
    return chains;
  };
  
  return (
    <WalletContext.Provider
      value={{
        walletState,
        evmAddress,
        solanaAddress,
        suiAddress,
        nearAddress,
        bitcoinAddress,
        isEvmConnected,
        isSolanaConnected,
        isSuiConnected,
        isNearConnected,
        isBitcoinConnected,
        isModalOpen,
        openModal,
        closeModal,
        disconnectAll,
        disconnectChain,
        switchChain,
        getAddressForChain,
        getConnectedChains,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
