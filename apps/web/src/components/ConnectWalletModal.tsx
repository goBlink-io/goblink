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
import { getChainLogo } from '@/lib/chain-logos';
import { X } from 'lucide-react';

interface ChainOption {
  id: ChainType;
  name: string;
  description: string;
  color: string;
}

const CHAINS: ChainOption[] = [
  { id: 'evm', name: 'EVM Chains', description: 'Ethereum, Base, Arbitrum, BNB +10 more', color: 'from-blue-500 to-purple-500' },
  { id: 'solana', name: 'Solana', description: 'Fast & low-cost transactions', color: 'from-purple-500 to-pink-500' },
  { id: 'bitcoin', name: 'Bitcoin', description: 'Digital gold standard', color: 'from-orange-500 to-yellow-500' },
  { id: 'sui', name: 'Sui', description: 'Next-gen blockchain', color: 'from-cyan-500 to-blue-500' },
  { id: 'near', name: 'NEAR', description: 'Simple, secure & scalable', color: 'from-green-500 to-teal-500' },
  { id: 'aptos', name: 'Aptos', description: 'Safe & scalable Layer 1', color: 'from-teal-500 to-green-500' },
  { id: 'starknet', name: 'Starknet', description: 'ZK-rollup on Ethereum', color: 'from-indigo-500 to-purple-500' },
  { id: 'ton', name: 'TON', description: 'The Open Network', color: 'from-sky-500 to-blue-500' },
  { id: 'tron', name: 'Tron', description: 'Decentralized internet', color: 'from-red-500 to-rose-500' },
];

function formatAddress(address: string) {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function ConnectWalletModal() {
  const { isModalOpen, closeModal, isChainConnected, getAddressForChain, disconnectChain } = useWalletContext();
  const { open: openAppKit } = useAppKit();
  const { connect: aptosConnect, wallets: aptosWallets } = useAptosWallet();
  const { connect: starknetConnect, connectors: starknetConnectors } = useStarknetConnect();
  const [tonConnectUI] = useTonConnectUI();
  const { select: tronSelect, wallets: tronWallets, connect: tronConnect } = useTronWallet();
  
  const [selectedChain, setSelectedChain] = useState<ChainType | null>(null);
  const previousSuiRef = useRef(isChainConnected('sui'));

  // Auto-close on Sui connect
  useEffect(() => {
    const nowConnected = isChainConnected('sui');
    if (!previousSuiRef.current && nowConnected && selectedChain === 'sui') {
      setTimeout(() => { closeModal(); setSelectedChain(null); }, 400);
    }
    previousSuiRef.current = nowConnected;
  }, [isChainConnected('sui'), selectedChain, closeModal]);

  useEffect(() => {
    if (!isModalOpen) setSelectedChain(null);
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const handleConnect = async (chain: ChainType) => {
    try {
      switch (chain) {
        case 'evm': case 'solana': case 'bitcoin':
          openAppKit(); closeModal(); break;
        case 'near':
          await connectNearWallet(); closeModal(); break;
        case 'aptos':
          if (aptosWallets?.length) await aptosConnect((aptosWallets[0] as any).name || aptosWallets[0]);
          closeModal(); break;
        case 'starknet':
          if (starknetConnectors[0]) starknetConnect({ connector: starknetConnectors[0] });
          closeModal(); break;
        case 'ton':
          await tonConnectUI.openModal(); closeModal(); break;
        case 'tron':
          if (tronWallets?.length) { tronSelect(tronWallets[0].adapter.name); await tronConnect(); }
          closeModal(); break;
        // sui handled via its own button
      }
    } catch (e) { console.error(`Connect ${chain} failed:`, e); }
  };

  const renderChainConnect = () => {
    if (!selectedChain) return null;
    const chain = CHAINS.find(c => c.id === selectedChain)!;

    if (selectedChain === 'sui') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Connect your Sui wallet</p>
          <div className="flex justify-center"><SuiConnectButton /></div>
          <p className="text-xs text-gray-500 text-center">Supports Sui Wallet, Suiet, and more</p>
        </div>
      );
    }

    if (selectedChain === 'starknet') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Connect your Starknet wallet</p>
          {starknetConnectors.map((connector, i) => (
            <button key={i} onClick={() => { starknetConnect({ connector }); closeModal(); }}
              className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-3">
              <span className="text-xl">{i === 0 ? '🦊' : '🛡️'}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{i === 0 ? 'Argent X' : 'Braavos'}</span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">{chain.description}</p>
        <button onClick={() => handleConnect(selectedChain)}
          className="btn btn-primary w-full py-3">
          Connect Wallet
        </button>
        {(selectedChain === 'evm' || selectedChain === 'solana' || selectedChain === 'bitcoin') && (
          <p className="text-xs text-gray-500 text-center">Powered by ReOwn AppKit — 350+ wallets</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end sm:items-center justify-center sm:p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedChain ? 'Connect Wallet' : 'Select Chain'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {selectedChain
                  ? CHAINS.find(c => c.id === selectedChain)?.description
                  : 'Choose a blockchain to connect'}
              </p>
            </div>
            <button onClick={selectedChain ? () => setSelectedChain(null) : closeModal}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {selectedChain
                ? <span className="text-gray-500 text-lg">←</span>
                : <X className="h-5 w-5 text-gray-500" />}
            </button>
          </div>

          {/* Content */}
          {!selectedChain ? (
            <div className="space-y-2">
              {CHAINS.map((chain) => {
                const connected = isChainConnected(chain.id);
                const address = getAddressForChain(chain.id);
                const logo = getChainLogo(chain.id === 'evm' ? 'ethereum' : chain.id);

                return (
                  <div key={chain.id}
                    className={`p-3.5 rounded-xl border-2 transition-all ${
                      connected
                        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                    }`}
                    {...(!connected ? { onClick: () => setSelectedChain(chain.id), role: 'button' } : {})}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: "var(--brand)" }}>
                          {logo ? (
                            <img src={logo.icon} alt="" className="w-6 h-6 rounded-full"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <span className="text-white font-bold text-sm">{chain.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">{chain.name}</div>
                          {connected && address ? (
                            <div className="text-xs text-green-600 dark:text-green-400 font-medium">{formatAddress(address)}</div>
                          ) : (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{chain.description}</div>
                          )}
                        </div>
                      </div>
                      {connected ? (
                        <button onClick={(e) => { e.stopPropagation(); disconnectChain(chain.id); }}
                          className="px-2.5 py-1 text-xs rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium">
                          Disconnect
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">→</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>{renderChainConnect()}</div>
          )}

          <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Connect multiple chains — they all stay connected simultaneously
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
