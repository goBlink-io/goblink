'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AddressPurpose, BitcoinNetworkType, getAddress } from 'sats-connect';

interface BitcoinWalletContextType {
  address: string | null;
  paymentAddress: string | null;
  ordinalsAddress: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  network: BitcoinNetworkType;
  error: string | null;
}

const BitcoinWalletContext = createContext<BitcoinWalletContextType | undefined>(undefined);

export function BitcoinWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [paymentAddress, setPaymentAddress] = useState<string | null>(null);
  const [ordinalsAddress, setOrdinalsAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [network] = useState<BitcoinNetworkType>(BitcoinNetworkType.Mainnet);
  const [error, setError] = useState<string | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    // Bitcoin wallets don't maintain persistent connections
    // User must connect each session
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      
      // Request addresses using sats-connect
      const getAddressOptions = {
        payload: {
          purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
          message: 'Connect your Bitcoin wallet to Sapphire',
          network: {
            type: network,
          },
        },
        onFinish: (response: any) => {
          if (response.addresses && response.addresses.length > 0) {
            const paymentAddr = response.addresses.find(
              (addr: any) => addr.purpose === AddressPurpose.Payment
            );
            const ordinalsAddr = response.addresses.find(
              (addr: any) => addr.purpose === AddressPurpose.Ordinals
            );

            if (paymentAddr) {
              setPaymentAddress(paymentAddr.address);
              setAddress(paymentAddr.address); // Use payment address as primary
              setConnected(true);
            }
            if (ordinalsAddr) {
              setOrdinalsAddress(ordinalsAddr.address);
            }
          }
        },
        onCancel: () => {
          setError('User cancelled wallet connection');
        },
      };

      await getAddress(getAddressOptions);
    } catch (err: any) {
      console.error('Failed to connect Bitcoin wallet:', err);
      setError(err.message || 'Failed to connect to Bitcoin wallet. Please install Xverse, Leather, or Unisat wallet.');
      setAddress(null);
      setPaymentAddress(null);
      setOrdinalsAddress(null);
      setConnected(false);
    }
  }, [network]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setPaymentAddress(null);
    setOrdinalsAddress(null);
    setConnected(false);
    setError(null);
  }, []);

  return (
    <BitcoinWalletContext.Provider
      value={{
        address,
        paymentAddress,
        ordinalsAddress,
        isConnected: connected,
        connect,
        disconnect,
        network,
        error,
      }}
    >
      {children}
    </BitcoinWalletContext.Provider>
  );
}

export function useBitcoinWallet() {
  const context = useContext(BitcoinWalletContext);
  if (context === undefined) {
    throw new Error('useBitcoinWallet must be used within a BitcoinWalletProvider');
  }
  return context;
}
