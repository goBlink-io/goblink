'use client';

import { getNearConnector } from './nearConnector';
// import { parseNearAmount } from 'near-api-js/lib/utils/format'; // TODO: Re-enable when needed

export interface TransactionParams {
  chain: string;
  tokenAddress: string;
  recipientAddress: string;
  amount: string; // Amount in smallest unit (e.g., yoctoNEAR, wei)
  decimals: number;
}

/**
 * Trigger a token transfer transaction for NEAR
 */
export async function sendNearTransaction(params: TransactionParams): Promise<string> {
  const { tokenAddress, recipientAddress, amount } = params;
  
  const connector = getNearConnector();
  if (!connector) {
    throw new Error('NEAR connector not initialized');
  }

  try {
    const wallet = await connector.wallet();
    if (!wallet) {
      throw new Error('NEAR wallet not connected');
    }

    // Check if it's a native NEAR transfer or NEP-141 token transfer
    const isNativeNear = tokenAddress === 'wrap.near' || tokenAddress === 'near';
    
    if (isNativeNear) {
      // For native NEAR, use simple transfer
      const transaction = {
        receiverId: recipientAddress,
        actions: [
          {
            type: 'Transfer',
            params: {
              deposit: amount, // Amount in yoctoNEAR
            },
          },
        ],
      };

      const result = await (wallet as any).signAndSendTransaction(transaction);
      return result?.transaction?.hash || result?.hash || 'unknown';
    } else {
      // For NEP-141 tokens, call ft_transfer on the token contract
      const transaction = {
        receiverId: tokenAddress,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'ft_transfer',
              args: {
                receiver_id: recipientAddress,
                amount: amount,
                memo: 'goBlink cross-chain transfer',
              },
              gas: '30000000000000', // 30 TGas
              deposit: '1', // 1 yoctoNEAR for storage
            },
          },
        ],
      };

      const result = await (wallet as any).signAndSendTransaction(transaction);
      return result?.transaction?.hash || result?.hash || 'unknown';
    }
  } catch (error) {
    console.error('NEAR transaction failed:', error);
    throw error;
  }
}

/**
 * Trigger a token transfer transaction for EVM chains
 */
export async function sendEvmTransaction(
  params: TransactionParams,
  provider: any
): Promise<string> {
  const { tokenAddress, recipientAddress, amount } = params;

  if (!provider) {
    throw new Error('EVM provider not available');
  }

  try {
    const signer = await provider.getSigner();
    void signer.getAddress(); // Validates signer is available

    // Check if it's a native token transfer or ERC-20
    const isNativeToken = tokenAddress === '0x0000000000000000000000000000000000000000' || 
                          tokenAddress.toLowerCase() === 'eth';

    if (isNativeToken) {
      // Native token transfer (ETH, MATIC, etc.)
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: amount,
      });
      
      await tx.wait();
      return tx.hash;
    } else {
      // ERC-20 token transfer
      const { ethers } = await import('ethers');
      const erc20Abi = [
        'function transfer(address to, uint256 amount) returns (bool)',
      ];
      
      const contract = new ethers.Contract(tokenAddress, erc20Abi, signer);
      const tx = await contract.transfer(recipientAddress, amount);
      
      await tx.wait();
      return tx.hash;
    }
  } catch (error) {
    console.error('EVM transaction failed:', error);
    throw error;
  }
}

/**
 * Trigger a token transfer transaction for Solana
 */
export async function sendSolanaTransaction(
  params: TransactionParams,
  connection: any,
  wallet: any
): Promise<string> {
  const { tokenAddress, recipientAddress, amount } = params;

  if (!wallet || !wallet.publicKey) {
    throw new Error('Solana wallet not connected');
  }

  try {
    const { PublicKey, Transaction, SystemProgram } = await import('@solana/web3.js');
    const recipientPubkey = new PublicKey(recipientAddress);

    // Check if it's native SOL or SPL token
    const isNativeSol = tokenAddress === 'native' || tokenAddress === 'sol';

    if (isNativeSol) {
      // Native SOL transfer
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: recipientPubkey,
          lamports: BigInt(amount),
        })
      );

      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);
      
      return signature;
    } else {
      // SPL token transfer
      const { getAssociatedTokenAddress, createTransferInstruction } = await import('@solana/spl-token');
      const tokenMint = new PublicKey(tokenAddress);
      
      const fromTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        wallet.publicKey
      );
      
      const toTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        recipientPubkey
      );

      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          wallet.publicKey,
          BigInt(amount)
        )
      );

      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);
      
      return signature;
    }
  } catch (error) {
    console.error('Solana transaction failed:', error);
    throw error;
  }
}

/**
 * Trigger a token transfer transaction for Sui
 */
export async function sendSuiTransaction(
  params: TransactionParams,
  suiClient: any,
  currentAccount: any,
  signAndExecuteTransaction: any
): Promise<string> {
  const { tokenAddress, recipientAddress, amount } = params;
  void suiClient; // Reserved for direct Sui RPC calls

  if (!currentAccount) {
    throw new Error('Sui wallet not connected');
  }

  try {
    const { Transaction } = await import('@mysten/sui/transactions');
    const txb = new Transaction();

    // Check if it's native SUI or custom token
    const isNativeSui = tokenAddress === 'native' || tokenAddress === 'sui' ||
                        tokenAddress === '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';

    if (isNativeSui) {
      // Native SUI transfer
      // Convert the amount string to a number (amount is in MIST - smallest unit)
      const amountInMist = BigInt(amount);
      const [coin] = txb.splitCoins(txb.gas, [amountInMist]);
      txb.transferObjects([coin], recipientAddress);
    } else {
      // Custom token transfer would go here
      // This requires more complex logic with coin selection
      throw new Error('Custom Sui token transfers not yet implemented');
    }

    // Sign and execute transaction using the hook
    const result = await signAndExecuteTransaction({
      transaction: txb,
    });

    return result.digest;
  } catch (error) {
    console.error('Sui transaction failed:', error);
    throw error;
  }
}

/**
 * Trigger a token transfer transaction for Aptos
 */
export async function sendAptosTransaction(
  params: TransactionParams,
  signAndSubmitTransaction: any
): Promise<string> {
  const { tokenAddress, recipientAddress, amount } = params;

  if (!signAndSubmitTransaction) {
    throw new Error('Aptos wallet not connected');
  }

  try {
    const isNativeApt = tokenAddress === 'native' || tokenAddress === 'apt' ||
                        tokenAddress === '0x1::aptos_coin::AptosCoin';

    if (isNativeApt) {
      const payload = {
        type: 'entry_function_payload',
        function: '0x1::aptos_account::transfer',
        type_arguments: [],
        arguments: [recipientAddress, amount],
      };
      const result = await signAndSubmitTransaction({ payload });
      return result.hash;
    } else {
      // Fungible asset transfer
      const payload = {
        type: 'entry_function_payload',
        function: '0x1::primary_fungible_store::transfer',
        type_arguments: [tokenAddress],
        arguments: [recipientAddress, amount],
      };
      const result = await signAndSubmitTransaction({ payload });
      return result.hash;
    }
  } catch (error) {
    console.error('Aptos transaction failed:', error);
    throw error;
  }
}

/**
 * Trigger a token transfer transaction for Starknet
 */
export async function sendStarknetTransaction(
  params: TransactionParams,
  account: any
): Promise<string> {
  const { tokenAddress, recipientAddress, amount } = params;

  if (!account) {
    throw new Error('Starknet wallet not connected');
  }

  try {
    const { uint256, CallData } = await import('starknet');
    const amountUint256 = uint256.bnToUint256(amount);

    const result = await account.execute({
      contractAddress: tokenAddress,
      entrypoint: 'transfer',
      calldata: CallData.compile({
        recipient: recipientAddress,
        amount: amountUint256,
      }),
    });

    return result.transaction_hash;
  } catch (error) {
    console.error('Starknet transaction failed:', error);
    throw error;
  }
}

/**
 * Trigger a token transfer transaction for TON
 */
export async function sendTonTransaction(
  params: TransactionParams,
  tonConnectUI: any
): Promise<string> {
  const { recipientAddress, amount, tokenAddress } = params;

  if (!tonConnectUI) {
    throw new Error('TON wallet not connected');
  }

  try {
    const isNativeTon = tokenAddress === 'native' || tokenAddress === 'ton';

    if (isNativeTon) {
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 min
        messages: [{
          address: recipientAddress,
          amount: amount, // in nanotons
        }],
      });
      return result.boc; // TON returns BOC (Bag of Cells)
    } else {
      // Jetton transfer — requires calling the jetton wallet contract
      // For now, encode a simple jetton transfer
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: tokenAddress, // Jetton wallet address
          amount: '50000000', // 0.05 TON for gas
          payload: '', // TODO: Encode jetton transfer payload
        }],
      });
      return result.boc;
    }
  } catch (error) {
    console.error('TON transaction failed:', error);
    throw error;
  }
}

/**
 * Trigger a token transfer transaction for Tron
 */
export async function sendTronTransaction(
  params: TransactionParams,
  signTransaction: any,
  address: string
): Promise<string> {
  const { tokenAddress, recipientAddress, amount } = params;

  if (!signTransaction || !address) {
    throw new Error('Tron wallet not connected');
  }

  try {
    const isNativeTrx = tokenAddress === 'native' || tokenAddress === 'trx';

    // Access TronWeb from window (injected by TronLink)
    const tronWeb = (window as any).tronWeb;
    if (!tronWeb) {
      throw new Error('TronWeb not available. Please install TronLink.');
    }

    if (isNativeTrx) {
      const tx = await tronWeb.transactionBuilder.sendTrx(recipientAddress, parseInt(amount), address);
      const signedTx = await signTransaction(tx);
      const result = await tronWeb.trx.sendRawTransaction(signedTx);
      return result.txid || result.transaction?.txID || 'unknown';
    } else {
      // TRC-20 transfer
      const contract = await tronWeb.contract().at(tokenAddress);
      const result = await contract.transfer(recipientAddress, amount).send();
      return result;
    }
  } catch (error) {
    console.error('Tron transaction failed:', error);
    throw error;
  }
}

/**
 * Main function to send a transaction based on chain type
 */
export async function sendTransaction(
  params: TransactionParams,
  chainContext?: {
    evmProvider?: any;
    solanaConnection?: any;
    solanaWallet?: any;
    suiClient?: any;
    suiAccount?: any;
    suiSignAndExecute?: any;
    aptosSignAndSubmit?: any;
    starknetAccount?: any;
    tonConnectUI?: any;
    tronSignTransaction?: any;
    tronAddress?: string;
  }
): Promise<string> {
  const chain = params.chain.toLowerCase();

  if (chain === 'near') {
    return sendNearTransaction(params);
  } else if (['ethereum', 'polygon', 'optimism', 'arbitrum', 'base', 'bsc', 'berachain', 'monad', 'avalanche', 'gnosis', 'aurora', 'plasma', 'xlayer', 'adi'].includes(chain)) {
    if (!chainContext?.evmProvider) {
      throw new Error('EVM provider not available');
    }
    return sendEvmTransaction(params, chainContext.evmProvider);
  } else if (chain === 'solana') {
    if (!chainContext?.solanaConnection || !chainContext?.solanaWallet) {
      throw new Error('Solana connection or wallet not available');
    }
    return sendSolanaTransaction(params, chainContext.solanaConnection, chainContext.solanaWallet);
  } else if (chain === 'sui') {
    if (!chainContext?.suiClient || !chainContext?.suiAccount || !chainContext?.suiSignAndExecute) {
      throw new Error('Sui client, account, or sign function not available');
    }
    return sendSuiTransaction(params, chainContext.suiClient, chainContext.suiAccount, chainContext.suiSignAndExecute);
  } else if (chain === 'aptos') {
    if (!chainContext?.aptosSignAndSubmit) {
      throw new Error('Aptos wallet not available');
    }
    return sendAptosTransaction(params, chainContext.aptosSignAndSubmit);
  } else if (chain === 'starknet') {
    if (!chainContext?.starknetAccount) {
      throw new Error('Starknet wallet not available');
    }
    return sendStarknetTransaction(params, chainContext.starknetAccount);
  } else if (chain === 'ton') {
    if (!chainContext?.tonConnectUI) {
      throw new Error('TON wallet not available');
    }
    return sendTonTransaction(params, chainContext.tonConnectUI);
  } else if (chain === 'tron') {
    if (!chainContext?.tronSignTransaction || !chainContext?.tronAddress) {
      throw new Error('Tron wallet not available');
    }
    return sendTronTransaction(params, chainContext.tronSignTransaction, chainContext.tronAddress);
  } else {
    throw new Error(`Unsupported chain: ${chain}`);
  }
}
