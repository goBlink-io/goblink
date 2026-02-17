'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWalletContext, ChainType } from '@/contexts/WalletContext';
import { useAppKit } from '@reown/appkit/react';
import { ConnectButton as SuiConnectButton } from '@mysten/dapp-kit';
import { connectNearWallet } from '@/lib/nearConnector';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useConnect as useStarknetConnect } from '@starknet-react/core';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useWallet as useTronWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { X } from 'lucide-react';

export default function ConnectWalletModal() {
  const { 
    isModalOpen, closeModal,
    isEvmConnected, isSolanaConnected, isSuiConnected, isNearConnected, isBitcoinConnected,
    isAptosConnected, isStarknetConnected, isTonConnected, isTronConnected,
    evmAddress, solanaAddress, suiAddress, nearAddress, bitcoinAddress,
    aptosAddress, starknetAddress, tonAddress, tronAddress,
    disconnectChain,
  } = useWalletContext();
  
  const { open: openAppKit } = useAppKit();
  const { connect: aptosConnect, wallets: aptosWallets } = useAptosWallet();
  const { connect: starknetConnect, connectors: starknetConnectors } = useStarknetConnect();
  const [tonConnectUI] = useTonConnectUI();
  const { select: tronSelect, wallets: tronWallets, connect: tronConnect } = useTronWallet();
  
  const [selectedChain, setSelectedChain] = useState<ChainType | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const previousSuiConnected = useRef(isSuiConnected);
  
  // Auto-close on Sui connect
  useEffect(() => {
    if (!previousSuiConnected.current && isSuiConnected && selectedChain === 'sui' && !isClosing) {
      setIsClosing(true);
      setTimeout(() => { closeModal(); setSelectedChain(null); setIsClosing(false); }, 500);
    }
    previousSuiConnected.current = isSuiConnected;
  }, [isSuiConnected, selectedChain, closeModal, isClosing]);
  
  useEffect(() => {
    if (!isModalOpen) { setIsClosing(false); setSelectedChain(null); }
  }, [isModalOpen]);
  
  if (!isModalOpen) return null;
  
  const handleConnectMultiChain = () => { openAppKit(); closeModal(); };
  
  const handleConnectNear = async () => {
    try { await connectNearWallet(); closeModal(); }
    catch (error) { console.error('Failed to connect NEAR wallet:', error); }
  };
  
  const handleConnectAptos = async (walletName?: string) => {
    try {
      if (walletName) {
        await aptosConnect(walletName);
      } else if (aptosWallets && aptosWallets.length > 0) {
        await aptosConnect((aptosWallets[0] as any).name || aptosWallets[0]);
      }
      closeModal();
    } catch (error) { console.error('Failed to connect Aptos wallet:', error); }
  };
  
  const handleConnectStarknet = async (connectorIndex: number) => {
    try {
      const connector = starknetConnectors[connectorIndex];
      if (connector) {
        starknetConnect({ connector });
        closeModal();
      }
    } catch (error) { console.error('Failed to connect Starknet wallet:', error); }
  };
  
  const handleConnectTon = async () => {
    try { await tonConnectUI.openModal(); closeModal(); }
    catch (error) { console.error('Failed to connect TON wallet:', error); }
  };
  
  const handleConnectTron = async () => {
    try {
      if (tronWallets && tronWallets.length > 0) {
        tronSelect(tronWallets[0].adapter.name);
        await tronConnect();
      }
      closeModal();
    } catch (error) { console.error('Failed to connect Tron wallet:', error); }
  };
  
  const formatAddress = (address: string) => {
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const chains = [
    { id: 'evm' as ChainType, name: 'EVM Chains', description: 'Ethereum, Base, Arbitrum, BNB, Polygon +9 more', icon: '⟠', color: 'from-blue-500 to-purple-500', isConnected: isEvmConnected, address: evmAddress },
    { id: 'solana' as ChainType, name: 'Solana', description: 'Fast & low-cost transactions', icon: '◎', color: 'from-purple-500 to-pink-500', isConnected: isSolanaConnected, address: solanaAddress },
    { id: 'bitcoin' as ChainType, name: 'Bitcoin', description: 'Digital gold standard', icon: '₿', color: 'from-orange-500 to-yellow-500', isConnected: isBitcoinConnected, address: bitcoinAddress },
    { id: 'sui' as ChainType, name: 'Sui', description: 'Next-gen blockchain', icon: '〰', color: 'from-cyan-500 to-blue-500', isConnected: isSuiConnected, address: suiAddress },
    { id: 'near' as ChainType, name: 'NEAR', description: 'Simple, secure & scalable', icon: 'Ⓝ', color: 'from-green-500 to-teal-500', isConnected: isNearConnected, address: nearAddress },
    { id: 'aptos' as ChainType, name: 'Aptos', description: 'Safe & scalable Layer 1', icon: '🔷', color: 'from-teal-500 to-green-500', isConnected: isAptosConnected, address: aptosAddress },
    { id: 'starknet' as ChainType, name: 'Starknet', description: 'ZK-rollup on Ethereum', icon: '⚡', color: 'from-indigo-500 to-purple-500', isConnected: isStarknetConnected, address: starknetAddress },
    { id: 'ton' as ChainType, name: 'TON', description: 'The Open Network', icon: '💎', color: 'from-sky-500 to-blue-500', isConnected: isTonConnected, address: tonAddress },
    { id: 'tron' as ChainType, name: 'Tron', description: 'Decentralized internet', icon: '🔴', color: 'from-red-500 to-rose-500', isConnected: isTronConnected, address: tronAddress },
  ];
  
  const renderWalletConnection = () => {
    if (!selectedChain) return null;
    
    switch (selectedChain) {
      case 'evm':
      case 'solana':
      case 'bitcoin':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">
              {selectedChain === 'evm' && 'Connect to Ethereum and EVM-compatible chains'}
              {selectedChain === 'solana' && 'Connect your Solana wallet'}
              {selectedChain === 'bitcoin' && 'Connect your Bitcoin wallet'}
            </p>
            <button onClick={handleConnectMultiChain}
              className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${chains.find(c => c.id === selectedChain)?.color} text-white font-semibold hover:opacity-90 transition-opacity`}>
              Connect Wallet
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">Powered by ReOwn AppKit — supports 350+ wallets</p>
          </div>
        );
      
      case 'sui':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Connect your Sui wallet</p>
            <div className="flex justify-center"><SuiConnectButton /></div>
            <p className="text-xs text-gray-500 text-center mt-2">Supports Sui Wallet, Suiet, and more</p>
          </div>
        );
      
      case 'near':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Connect your NEAR wallet</p>
            <button onClick={handleConnectNear}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold hover:opacity-90 transition-opacity">
              Select Wallet
            </button>
          </div>
        );
      
      case 'aptos':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Connect your Aptos wallet</p>
            {aptosWallets && aptosWallets.length > 0 ? (
              aptosWallets.map((wallet: any, i: number) => (
                <button key={i} onClick={() => handleConnectAptos(wallet.name || wallet)}
                  className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all flex items-center gap-3">
                  {wallet.icon && <img src={wallet.icon} alt="" className="w-8 h-8 rounded-lg" />}
                  <span className="font-semibold text-gray-900">{wallet.name || 'Aptos Wallet'}</span>
                </button>
              ))
            ) : (
              <button onClick={() => handleConnectAptos()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold hover:opacity-90 transition-opacity">
                Connect Petra / Aptos Wallet
              </button>
            )}
            <p className="text-xs text-gray-500 text-center mt-2">Supports Petra, Pontem, Martian</p>
          </div>
        );
      
      case 'starknet':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Connect your Starknet wallet</p>
            <button onClick={() => handleConnectStarknet(0)}
              className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center gap-3">
              <span className="text-2xl">🦊</span>
              <span className="font-semibold text-gray-900">Argent X</span>
            </button>
            <button onClick={() => handleConnectStarknet(1)}
              className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <span className="font-semibold text-gray-900">Braavos</span>
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">ZK-powered Ethereum L2</p>
          </div>
        );
      
      case 'ton':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Connect your TON wallet</p>
            <button onClick={handleConnectTon}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold hover:opacity-90 transition-opacity">
              Connect via TON Connect
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">Supports Tonkeeper, MyTonWallet, and more</p>
          </div>
        );
      
      case 'tron':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Connect your Tron wallet</p>
            <button onClick={handleConnectTron}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity">
              Connect TronLink
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">Supports TronLink browser extension</p>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end sm:items-center justify-center sm:p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeModal} />
        
        <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedChain ? 'Connect Wallet' : 'Select Chain'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedChain 
                  ? chains.find(c => c.id === selectedChain)?.description 
                  : 'Choose a blockchain to connect'}
              </p>
            </div>
            <button onClick={selectedChain ? () => setSelectedChain(null) : closeModal}
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
              {selectedChain ? <span className="text-gray-600">←</span> : <X className="h-5 w-5 text-gray-600" />}
            </button>
          </div>
          
          <div className="space-y-3">
            {!selectedChain ? (
              chains.map((chain) => {
                const Container = chain.isConnected ? 'div' : 'button';
                const containerProps = chain.isConnected ? {} : { onClick: () => setSelectedChain(chain.id) };
                
                return (
                  <Container key={chain.id} {...containerProps}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      chain.isConnected
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${chain.color} flex items-center justify-center text-2xl`}>
                          {chain.icon}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">{chain.name}</h3>
                          {chain.isConnected ? (
                            <p className="text-sm text-green-600 font-medium">{formatAddress(chain.address || '')}</p>
                          ) : (
                            <p className="text-sm text-gray-600">{chain.description}</p>
                          )}
                        </div>
                      </div>
                      {chain.isConnected ? (
                        <button onClick={(e) => { e.stopPropagation(); disconnectChain(chain.id); }}
                          className="px-3 py-1 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                          Disconnect
                        </button>
                      ) : (
                        <span className="text-gray-400">→</span>
                      )}
                    </div>
                  </Container>
                );
              })
            ) : (
              <div className="space-y-4">{renderWalletConnection()}</div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">By connecting, you agree to our Terms of Service</p>
          </div>
        </div>
      </div>
    </div>
  );
}
