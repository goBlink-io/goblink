'use client';

// Get API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetch NEAR account balance using backend API
 * @param accountId - NEAR account ID
 * @returns Balance in NEAR (not yoctoNEAR)
 */
export async function getNearBalance(accountId: string): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/api/balances/near/${accountId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.balance;
  } catch (error) {
    console.error('Failed to fetch NEAR balance:', error);
    return '0.00';
  }
}

/**
 * Fetch NEAR token balance (FT tokens) using backend API
 * @param accountId - NEAR account ID
 * @param contractAddress - Token contract address
 * @param decimals - Token decimals
 * @returns Token balance formatted
 */
export async function getNearTokenBalance(
  accountId: string,
  contractAddress: string,
  decimals: number
): Promise<string> {
  try {
    const params = new URLSearchParams({
      contractAddress,
      decimals: decimals.toString(),
    });
    
    const response = await fetch(
      `${API_URL}/api/balances/near-token/${accountId}?${params}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token balance: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.balance;
  } catch (error) {
    console.error('Failed to fetch NEAR token balance:', error);
    return '0.00';
  }
}

/**
 * Fetch balance for any token based on its configuration
 * @param address - Wallet address
 * @param token - Token configuration
 * @returns Balance as string
 */
export async function getTokenBalance(
  address: string,
  token: {
    blockchain?: string;
    contractAddress?: string;
    decimals: number;
    symbol: string;
  }
): Promise<string> {
  const blockchain = (token.blockchain || 'near').toLowerCase();
  
  if (blockchain === 'near') {
    // Native NEAR token
    if (token.symbol === 'NEAR' || token.symbol === 'wNEAR') {
      return getNearBalance(address);
    }
    
    // NEAR FT token
    if (token.contractAddress) {
      return getNearTokenBalance(address, token.contractAddress, token.decimals);
    }
  }
  
  // Add other blockchain balance fetching here (EVM, Solana, etc.)
  // For now, return placeholder
  return '0.00';
}
