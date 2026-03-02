import { OpenAPI, OneClickService, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';

// Initialize the API client
if (!process.env.ONE_CLICK_BASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('ONE_CLICK_BASE_URL environment variable is required');
}
OpenAPI.BASE = process.env.ONE_CLICK_BASE_URL || '';
if (process.env.ONE_CLICK_JWT) {
  OpenAPI.TOKEN = process.env.ONE_CLICK_JWT.trim();
}

export const getTokens = async () => {
  return await OneClickService.getTokens();
};

export const getQuote = async (request: QuoteRequest) => {
  return await OneClickService.getQuote(request);
};

export const submitDeposit = async (txHash: string, depositAddress: string) => {
  return await OneClickService.submitDepositTx({ txHash, depositAddress });
};

/**
 * Get real execution status from the 1Click API.
 * Public endpoint — no JWT required.
 * Statuses: PENDING_DEPOSIT | KNOWN_DEPOSIT_TX | INCOMPLETE_DEPOSIT | PROCESSING | SUCCESS | REFUNDED | FAILED
 */
export const getExecutionStatus = async (depositAddress: string, depositMemo?: string) => {
  return await OneClickService.getExecutionStatus(depositAddress, depositMemo);
};

export { QuoteRequest };
