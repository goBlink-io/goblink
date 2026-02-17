'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKitAccount, useDisconnect as useAppKitDisconnect } from '@reown/appkit/react';
import { useCurrentAccount as useSuiAccount } from '@mysten/dapp-kit';
import { initNearConnector, disconnectNearWallet, getNearAccount } from '@/lib/nearConnector';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useAccount as useStarknetAccount, useDisconnect as useStarknetDisconnect } from '@starknet-react/core';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { useWallet as useTronWallet } from '@tronweb3/tronwallet-adapter-react-hooks';

export type ChainType = 'evm' | 'solana' | 'sui' | 'near' | 'bitcoin' | 'aptos' | 'starknet' | 'ton' | 'tron';

export interface WalletState {
  chain: ChainType | null;
  address: string | null;
  isConnected: boolean;
}

interface WalletContextType {
  walletState: WalletState;
  
  evmAddress: string | null;
  solanaAddress: string | null;
  suiAddress: string | null;
  nearAddress: string | null;
  bitcoinAddress: string | null;
  aptosAddress: string | null;
  starknetAddress: string | null;
  tonAddress: string | null;
  tronAddress: string | null;
  
  isEvmConnected: boolean;
  isSolanaConnected: boolean;
  isSuiConnected: boolean;
  isNearConnected: boolean;
  isBitcoinConnected: boolean;
  isAptosConnected: boolean;
  isStarknetConnected: boolean;
  isTonConnected: boolean;
  isTronConnected: boolean;
  
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  
  disconnectAll: () => void;
  disconnectChain: (chain: ChainType) => void;
  switchChain: (chain: ChainType) => void;
  getAddressForChain: (chain: ChainType) => string | null;
  getConnectedChains: () => Array<{ chain: ChainType; address: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nearAddress, setNearAddress] = useState<string | null>(null);
  const [isNearConnected, setIsNearConnected] = useState(false);
  const [activeChain, setActiveChain] = useState<ChainType | null>(null);
  
  // ReOwn AppKit (EVM, Solana, Bitcoin)
  const { address: appKitAddress, isConnected: appKitConnected, caipAddress } = useAppKitAccount();
  const { disconnect: appKitDisconnect } = useAppKitDisconnect();
  
  // Wagmi (EVM backup)
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  // Sui
  const suiAccount = useSuiAccount();
  const isSuiConnected = !!suiAccount;
  const suiAddress = suiAccount?.address || null;
  
  // Aptos
  const { account: aptosAccount, connected: isAptosConnected, disconnect: aptosDisconnect } = useAptosWallet();
  const aptosAddress = aptosAccount?.address?.toString() || null;
  
  // Starknet
  const { address: starknetAddr, isConnected: _isStarknetConnected } = useStarknetAccount();
  const { disconnect: starknetDisconnect } = useStarknetDisconnect();
  const isStarknetConnected = !!_isStarknetConnected;
  const starknetAddress = starknetAddr || null;
  
  // TON
  const [tonConnectUI] = useTonConnectUI();
  const tonAddr = useTonAddress();
  const isTonConnected = !!tonAddr;
  const tonAddress = tonAddr || null;
  
  // Tron
  const { address: tronAddr, connected: isTronConnected, disconnect: tronDisconnect } = useTronWallet();
  const tronAddress = tronAddr || null;
  
  // Determine chain from CAIP address
  const getChainFromCaip = (caip?: string): ChainType | null => {
    if (!caip) return null;
    if (caip.startsWith('eip155:')) return 'evm';
    if (caip.startsWith('solana:')) return 'solana';
    if (caip.startsWith('bip122:')) return 'bitcoin';
    return null;
  };
  
  const appKitChain = getChainFromCaip(caipAddress);
  
  const evmAddress: string | null = (appKitChain === 'evm' && appKitAddress) || (wagmiConnected && wagmiAddress) || null;
  const solanaAddress: string | null = (appKitChain === 'solana' && appKitAddress) || null;
  const bitcoinAddress: string | null = (appKitChain === 'bitcoin' && appKitAddress) || null;
  
  const isEvmConnected = appKitChain === 'evm' || wagmiConnected;
  const isSolanaConnected = appKitChain === 'solana';
  const isBitcoinConnected = appKitChain === 'bitcoin';
  
  // NEAR
  useEffect(() => {
    const connector = initNearConnector();
    if (!connector) return;
    
    const checkNearConnection = async () => {
      try {
        const account = await getNearAccount();
        if (account) {
          setNearAddress(account);
          setIsNearConnected(true);
        }
      } catch (error) {
        console.error('[NEAR] Failed to check connection:', error);
      }
    };
    
    const timer = setTimeout(() => checkNearConnection(), 500);
    
    const handleSignIn = async () => {
      try {
        const account = await getNearAccount();
        if (account) {
          setNearAddress(account);
          setIsNearConnected(true);
        }
      } catch (error) {
        console.error('[NEAR] Error in handleSignIn:', error);
      }
    };
    
    const handleSignOut = () => {
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
  
  const [walletState, setWalletState] = useState<WalletState>({
    chain: null, address: null, isConnected: false,
  });
  
  const getAddressForChain = (chain: ChainType): string | null => {
    switch (chain) {
      case 'evm': return evmAddress;
      case 'solana': return solanaAddress;
      case 'bitcoin': return bitcoinAddress;
      case 'sui': return suiAddress;
      case 'near': return nearAddress;
      case 'aptos': return aptosAddress;
      case 'starknet': return starknetAddress;
      case 'ton': return tonAddress;
      case 'tron': return tronAddress;
      default: return null;
    }
  };
  
  const isChainConnected = (chain: ChainType): boolean => {
    switch (chain) {
      case 'evm': return isEvmConnected;
      case 'solana': return isSolanaConnected;
      case 'bitcoin': return isBitcoinConnected;
      case 'sui': return isSuiConnected;
      case 'near': return isNearConnected;
      case 'aptos': return isAptosConnected;
      case 'starknet': return isStarknetConnected;
      case 'ton': return isTonConnected;
      case 'tron': return isTronConnected;
      default: return false;
    }
  };
  
  // Update wallet state
  useEffect(() => {
    if (activeChain) {
      const address = getAddressForChain(activeChain);
      if (isChainConnected(activeChain) && address) {
        setWalletState({ chain: activeChain, address, isConnected: true });
        return;
      } else {
        setActiveChain(null);
      }
    }
    
    // Auto-select priority order
    const priority: ChainType[] = ['near', 'evm', 'solana', 'bitcoin', 'sui', 'aptos', 'starknet', 'ton', 'tron'];
    for (const chain of priority) {
      const addr = getAddressForChain(chain);
      if (isChainConnected(chain) && addr) {
        setWalletState({ chain, address: addr, isConnected: true });
        if (!activeChain) setActiveChain(chain);
        return;
      }
    }
    
    setWalletState({ chain: null, address: null, isConnected: false });
  }, [evmAddress, solanaAddress, bitcoinAddress, suiAddress, nearAddress,
      aptosAddress, starknetAddress, tonAddress, tronAddress,
      isEvmConnected, isSolanaConnected, isBitcoinConnected, isSuiConnected, isNearConnected,
      isAptosConnected, isStarknetConnected, isTonConnected, isTronConnected]);
  
  useEffect(() => {
    if (!activeChain) return;
    const address = getAddressForChain(activeChain);
    if (isChainConnected(activeChain) && address) {
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
      case 'aptos':
        await aptosDisconnect();
        break;
      case 'starknet':
        starknetDisconnect();
        break;
      case 'ton':
        await tonConnectUI.disconnect();
        break;
      case 'tron':
        await tronDisconnect();
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
    if (isAptosConnected) await aptosDisconnect();
    if (isStarknetConnected) starknetDisconnect();
    if (isTonConnected) await tonConnectUI.disconnect();
    if (isTronConnected) await tronDisconnect();
    setActiveChain(null);
  };
  
  const switchChain = async (chain: ChainType) => {
    const address = getAddressForChain(chain);
    if (!address) {
      console.warn(`Cannot switch to ${chain}: wallet not connected`);
      return;
    }
    if (activeChain && activeChain !== chain) {
      await disconnectChain(activeChain);
    }
    setActiveChain(chain);
  };
  
  const getConnectedChains = () => {
    const chains: Array<{ chain: ChainType; address: string }> = [];
    const allChains: ChainType[] = ['evm', 'solana', 'bitcoin', 'sui', 'near', 'aptos', 'starknet', 'ton', 'tron'];
    for (const chain of allChains) {
      const addr = getAddressForChain(chain);
      if (isChainConnected(chain) && addr) {
        chains.push({ chain, address: addr });
      }
    }
    return chains;
  };
  
  return (
    <WalletContext.Provider
      value={{
        walletState,
        evmAddress, solanaAddress, suiAddress, nearAddress, bitcoinAddress,
        aptosAddress, starknetAddress, tonAddress, tronAddress,
        isEvmConnected, isSolanaConnected, isSuiConnected, isNearConnected, isBitcoinConnected,
        isAptosConnected, isStarknetConnected, isTonConnected, isTronConnected,
        isModalOpen, openModal, closeModal,
        disconnectAll, disconnectChain, switchChain, getAddressForChain, getConnectedChains,
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
