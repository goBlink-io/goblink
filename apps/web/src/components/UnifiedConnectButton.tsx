'use client';

import React, { useState } from 'react';
import { useWalletContext, ChainType } from '@/contexts/WalletContext';
import { ChevronDown, Wallet, Check, Network, X } from 'lucide-react';

export default function UnifiedConnectButton() {
  const {
    walletState,
    openModal,
    disconnectAll,
    disconnectChain,
    switchChain,
    getConnectedChains,
  } = useWalletContext();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const connectedChains = getConnectedChains();
  
  const formatAddress = (address: string) => {
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const getChainLabel = (chain: ChainType) => {
    switch (chain) {
      case 'evm':
        return 'EVM';
      case 'solana':
        return 'Solana';
      case 'sui':
        return 'Sui';
      case 'near':
        return 'NEAR';
      case 'bitcoin':
        return 'Bitcoin';
      default:
        return '';
    }
  };
  
  const getChainColor = (chain: ChainType) => {
    switch (chain) {
      case 'evm':
        return 'text-purple-600 bg-purple-50';
      case 'solana':
        return 'text-green-600 bg-green-50';
      case 'sui':
        return 'text-blue-600 bg-blue-50';
      case 'near':
        return 'text-teal-600 bg-teal-50';
      case 'bitcoin':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };
  
  const handleChainSwitch = async (chain: ChainType) => {
    await switchChain(chain);
    setIsDropdownOpen(false);
  };
  
  return (
    <div className="flex items-center space-x-2">
      {/* Always visible chain manager dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
        >
          <Network className="h-4 w-4" />
          <span>{connectedChains.length} Chain{connectedChains.length !== 1 ? 's' : ''}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Chain Manager Dropdown */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center justify-between">
                <span>Connected Chains</span>
                {connectedChains.length > 0 && (
                  <span className="text-blue-600">{connectedChains.length}</span>
                )}
              </div>
              
              {connectedChains.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  <Wallet className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No chains connected</p>
                  <button
                    onClick={() => {
                      openModal();
                      setIsDropdownOpen(false);
                    }}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <>
                  {connectedChains.map(({ chain, address }) => (
                    <div
                      key={chain}
                      className={`w-full px-3 py-2 rounded-lg transition-colors ${
                        walletState.chain === chain
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleChainSwitch(chain)}
                          className="flex-1 flex items-center space-x-2 text-left"
                        >
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getChainColor(chain)}`}>
                            {getChainLabel(chain)}
                          </span>
                          {walletState.chain === chain && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            disconnectChain(chain);
                          }}
                          className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title={`Disconnect ${getChainLabel(chain)}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-0.5">
                        {formatAddress(address)}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={() => {
                        openModal();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Wallet className="h-4 w-4" />
                      <span>Connect Another Chain</span>
                    </button>
                    <button
                      onClick={() => {
                        disconnectAll();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Disconnect All</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Active wallet display - only show when connected */}
      {walletState.isConnected && (
        <div className="flex items-center space-x-3 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white">
          <div className="flex flex-col items-start">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${walletState.chain ? getChainColor(walletState.chain) : ''}`}>
              {walletState.chain ? getChainLabel(walletState.chain) : 'Unknown'}
            </span>
            <span className="text-sm font-semibold text-gray-900 mt-1">
              {formatAddress(walletState.address || '')}
            </span>
          </div>
        </div>
      )}
      
      {/* Connect wallet button - only show when nothing connected */}
      {!walletState.isConnected && (
        <button
          onClick={openModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </button>
      )}
    </div>
  );
}
