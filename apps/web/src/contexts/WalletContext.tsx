'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKitAccount, useDisconnect as useAppKitDisconnect } from '@reown/appkit/react';
import { useCurrentAccount as useSuiAccount, useDisconnectWallet as useSuiDisconnect } from '@mysten/dapp-kit';
import { initNearConnector, disconnectNearWallet, getNearAccount } from '@/lib/nearConnector';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useAccount as useStarknetAccount, useDisconnect as useStarknetDisconnect } from '@starknet-react/core';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { useWallet as useTronWallet } from '@tronweb3/tronwallet-adapter-react-hooks';

export type ChainType = 'evm' | 'solana' | 'sui' | 'near' | 'bitcoin' | 'aptos' | 'starknet' | 'ton' | 'tron';

interface ConnectedWallet {
  chain: ChainType;
  address: string;
}

interface WalletContextType {
  // All connected wallets (multiple can be connected simultaneously)
  connectedWallets: ConnectedWallet[];
  
  // Quick lookups
  getAddressForChain: (chain: ChainType) => string | null;
  isChainConnected: (chain: ChainType) => boolean;
  
  // Modal
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  
  // Disconnect
  disconnectChain: (chain: ChainType) => Promise<void>;
  disconnectAll: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nearAddress, setNearAddress] = useState<string | null>(null);
  
  // ── Wallet SDKs ──
  
  // ReOwn AppKit (EVM + Solana + Bitcoin — shared connection)
  const { address: appKitAddress, isConnected: appKitConnected, caipAddress } = useAppKitAccount();
  const { disconnect: appKitDisconnect } = useAppKitDisconnect();
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  // Sui
  const suiAccount = useSuiAccount();
  const { mutate: suiDisconnect } = useSuiDisconnect();
  
  // Aptos
  const { account: aptosAccount, connected: aptosConnected, disconnect: aptosDisconnect } = useAptosWallet();
  
  // Starknet
  const { address: starknetAddr, isConnected: _starknetConnected } = useStarknetAccount();
  const { disconnect: starknetDisconnect } = useStarknetDisconnect();
  
  // TON
  const [tonConnectUI] = useTonConnectUI();
  const tonAddr = useTonAddress();
  
  // Tron
  const { address: tronAddr, connected: tronConnected, disconnect: tronDisconnect } = useTronWallet();
  
  // ── Derive connection states ──
  
  const appKitChain = (() => {
    if (!caipAddress) return null;
    if (caipAddress.startsWith('eip155:')) return 'evm' as ChainType;
    if (caipAddress.startsWith('solana:')) return 'solana' as ChainType;
    if (caipAddress.startsWith('bip122:')) return 'bitcoin' as ChainType;
    return null;
  })();
  
  // Build the wallet map — each chain independently
  const walletMap: Record<ChainType, string | null> = {
    evm: (appKitChain === 'evm' && appKitAddress) || (wagmiConnected && wagmiAddress) || null,
    solana: (appKitChain === 'solana' && appKitAddress) || null,
    bitcoin: (appKitChain === 'bitcoin' && appKitAddress) || null,
    sui: suiAccount?.address || null,
    near: nearAddress,
    aptos: aptosConnected ? (aptosAccount?.address?.toString() || null) : null,
    starknet: _starknetConnected ? (starknetAddr || null) : null,
    ton: tonAddr || null,
    tron: tronConnected ? (tronAddr || null) : null,
  };
  
  // ── NEAR init ──
  useEffect(() => {
    const connector = initNearConnector();
    if (!connector) return;
    
    const checkConnection = async () => {
      try {
        const account = await getNearAccount();
        if (account) setNearAddress(account);
      } catch (e) {
        console.error('[NEAR] check failed:', e);
      }
    };
    
    const timer = setTimeout(checkConnection, 500);
    
    const onSignIn = async () => {
      const account = await getNearAccount().catch(() => null);
      if (account) setNearAddress(account);
    };
    const onSignOut = () => setNearAddress(null);
    
    connector.on('wallet:signIn', onSignIn);
    connector.on('wallet:signOut', onSignOut);
    return () => { clearTimeout(timer); connector.off('wallet:signIn', onSignIn); connector.off('wallet:signOut', onSignOut); };
  }, []);
  
  // ── Build connected wallets list ──
  const connectedWallets: ConnectedWallet[] = [];
  for (const [chain, address] of Object.entries(walletMap)) {
    if (address) connectedWallets.push({ chain: chain as ChainType, address });
  }
  
  const getAddressForChain = useCallback((chain: ChainType): string | null => {
    return walletMap[chain] || null;
  }, [walletMap.evm, walletMap.solana, walletMap.bitcoin, walletMap.sui, walletMap.near,
      walletMap.aptos, walletMap.starknet, walletMap.ton, walletMap.tron]);
  
  const isChainConnected = useCallback((chain: ChainType): boolean => {
    return !!walletMap[chain];
  }, [walletMap.evm, walletMap.solana, walletMap.bitcoin, walletMap.sui, walletMap.near,
      walletMap.aptos, walletMap.starknet, walletMap.ton, walletMap.tron]);
  
  // ── Disconnect ──
  // Note: EVM, Solana, Bitcoin share AppKit — disconnecting one disconnects all three.
  // This is an AppKit limitation. We warn the user in the UI.
  
  const disconnectChain = useCallback(async (chain: ChainType) => {
    try {
      switch (chain) {
        case 'evm':
        case 'solana':
        case 'bitcoin':
          // AppKit shares session — disconnects all three
          if (appKitConnected) await appKitDisconnect();
          if (wagmiConnected) wagmiDisconnect();
          break;
        case 'sui':
          suiDisconnect();
          break;
        case 'near':
          await disconnectNearWallet();
          setNearAddress(null);
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
    } catch (e) {
      console.error(`Failed to disconnect ${chain}:`, e);
    }
  }, [appKitConnected, appKitDisconnect, wagmiConnected, wagmiDisconnect,
      suiDisconnect, aptosDisconnect, starknetDisconnect, tonConnectUI, tronDisconnect]);
  
  const disconnectAll = useCallback(async () => {
    try { if (appKitConnected) await appKitDisconnect(); } catch {}
    try { if (wagmiConnected) wagmiDisconnect(); } catch {}
    try { suiDisconnect(); } catch {}
    try { if (aptosConnected) aptosDisconnect(); } catch {}
    try { if (_starknetConnected) starknetDisconnect(); } catch {}
    try { if (tonAddr) await tonConnectUI.disconnect(); } catch {}
    try { if (tronConnected) await tronDisconnect(); } catch {}
    try { await disconnectNearWallet(); } catch {}
    setNearAddress(null);
  }, [appKitConnected, wagmiConnected, aptosConnected, _starknetConnected, tonAddr, tronConnected]);
  
  return (
    <WalletContext.Provider value={{
      connectedWallets,
      getAddressForChain,
      isChainConnected,
      isModalOpen,
      openModal: () => setIsModalOpen(true),
      closeModal: () => setIsModalOpen(false),
      disconnectChain,
      disconnectAll,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used within WalletProvider');
  return ctx;
}
