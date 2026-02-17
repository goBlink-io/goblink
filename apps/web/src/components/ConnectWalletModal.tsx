'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWalletContext, ChainType } from '@/contexts/WalletContext';
import { useAppKit } from '@reown/appkit/react';
import { ConnectButton as SuiConnectButton } from '@mysten/dapp-kit';
import { connectNearWallet } from '@/lib/nearConnector';
import { X } from 'lucide-react';

export default function ConnectWalletModal() {
  const { 
    isModalOpen, 
    closeModal,
    isEvmConnected,
    isSolanaConnected,
    isSuiConnected,
    isNearConnected,
    isBitcoinConnected,
    evmAddress,
    solanaAddress,
    suiAddress,
    nearAddress,
    bitcoinAddress,
    disconnectChain,
  } = useWalletContext();
  
  const { open: openAppKit } = useAppKit();
  const [selectedChain, setSelectedChain] = useState<ChainType | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const previousSuiConnected = useRef(isSuiConnected);
  
  // Auto-close modal when Sui wallet connects
  useEffect(() => {
    if (!previousSuiConnected.current && isSuiConnected && selectedChain === 'sui' && !isClosing) {
      console.log('[ConnectWalletModal] Sui wallet connected, closing modal');
      setIsClosing(true);
      setTimeout(() => {
        closeModal();
        setSelectedChain(null);
        setIsClosing(false);
      }, 500); // Small delay to show the connection was successful
    }
    previousSuiConnected.current = isSuiConnected;
  }, [isSuiConnected, selectedChain, closeModal, isClosing]);
  
  // Reset closing state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setIsClosing(false);
      setSelectedChain(null);
    }
  }, [isModalOpen]);
  
  if (!isModalOpen) return null;
  
  const handleChainSelect = (chain: ChainType) => {
    setSelectedChain(chain);
  };
  
  const handleBack = () => {
    setSelectedChain(null);
  };
  
  const handleConnectMultiChain = () => {
    openAppKit();
    closeModal();
  };
  
  const handleConnectNear = async () => {
    try {
      await connectNearWallet();
      closeModal();
    } catch (error) {
      console.error('Failed to connect NEAR wallet:', error);
      // Error handled silently — user sees wallet popup failure
    }
  };
  
  const handleDisconnect = (chain: ChainType) => {
    disconnectChain(chain);
  };
  
  const formatAddress = (address: string) => {
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const chains = [
    {
      id: 'evm' as ChainType,
      name: 'EVM Chains',
      description: 'Ethereum, Base, Arbitrum, BNB, Polygon, Berachain, Monad',
      icon: '⟠',
      color: 'from-blue-500 to-purple-500',
      isConnected: isEvmConnected,
      address: evmAddress,
    },
    {
      id: 'solana' as ChainType,
      name: 'Solana',
      description: 'Fast & low-cost transactions',
      icon: '◎',
      color: 'from-purple-500 to-pink-500',
      isConnected: isSolanaConnected,
      address: solanaAddress,
    },
    {
      id: 'bitcoin' as ChainType,
      name: 'Bitcoin',
      description: 'Digital gold standard',
      icon: '₿',
      color: 'from-orange-500 to-yellow-500',
      isConnected: isBitcoinConnected,
      address: bitcoinAddress,
    },
    {
      id: 'sui' as ChainType,
      name: 'Sui',
      description: 'Next-gen blockchain',
      icon: '〰',
      color: 'from-cyan-500 to-blue-500',
      isConnected: isSuiConnected,
      address: suiAddress,
    },
    {
      id: 'near' as ChainType,
      name: 'NEAR',
      description: 'Simple, secure & scalable',
      icon: 'Ⓝ',
      color: 'from-green-500 to-teal-500',
      isConnected: isNearConnected,
      address: nearAddress,
    },
  ];
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end sm:items-center justify-center sm:p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={closeModal}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedChain ? 'Connect Wallet' : 'Select Chain'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedChain 
                  ? chains.find(c => c.id === selectedChain)?.description 
                  : 'Choose a blockchain to connect'
                }
              </p>
            </div>
            <button
              onClick={selectedChain ? handleBack : closeModal}
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
            >
              {selectedChain ? (
                <span className="text-gray-600">←</span>
              ) : (
                <X className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Content */}
          <div className="space-y-3">
            {!selectedChain ? (
              // Chain Selection View
              <>
                {chains.map((chain) => {
                  const Container = chain.isConnected ? 'div' : 'button';
                  const containerProps = chain.isConnected
                    ? {}
                    : { onClick: () => handleChainSelect(chain.id) };
                  
                  return (
                    <Container
                      key={chain.id}
                      {...containerProps}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        chain.isConnected
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${chain.color} flex items-center justify-center text-2xl`}>
                            {chain.icon}
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">{chain.name}</h3>
                            {chain.isConnected ? (
                              <p className="text-sm text-green-600 font-medium">
                                {formatAddress(chain.address || '')}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-600">{chain.description}</p>
                            )}
                          </div>
                        </div>
                        {chain.isConnected ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnect(chain.id);
                            }}
                            className="px-3 py-1 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <span className="text-gray-400">→</span>
                        )}
                      </div>
                    </Container>
                  );
                })}
              </>
            ) : (
              // Wallet Connection View
              <div className="space-y-4">
                {(selectedChain === 'evm' || selectedChain === 'solana' || selectedChain === 'bitcoin') && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      {selectedChain === 'evm' && 'Connect to Ethereum and EVM-compatible chains'}
                      {selectedChain === 'solana' && 'Connect your Solana wallet'}
                      {selectedChain === 'bitcoin' && 'Connect your Bitcoin wallet'}
                    </p>
                    <button
                      onClick={handleConnectMultiChain}
                      className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${
                        selectedChain === 'evm' ? 'from-blue-500 to-purple-500' :
                        selectedChain === 'solana' ? 'from-purple-500 to-pink-500' :
                        'from-orange-500 to-yellow-500'
                      } text-white font-semibold hover:opacity-90 transition-opacity`}
                    >
                      Connect Wallet
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Powered by ReOwn AppKit - supports 350+ wallets
                    </p>
                  </div>
                )}
                
                {selectedChain === 'sui' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      Connect your Sui wallet
                    </p>
                    <div className="flex justify-center">
                      <SuiConnectButton />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Supports Sui Wallet, Suiet, and more
                    </p>
                  </div>
                )}
                
                {selectedChain === 'near' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      Connect your NEAR wallet
                    </p>
                    <button
                      onClick={handleConnectNear}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                      Select Wallet
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Near Connect integration coming soon
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By connecting, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
