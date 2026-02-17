import { OpenAPI, OneClickService, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';

// Initialize the API client
OpenAPI.BASE = process.env.ONE_CLICK_BASE_URL || 'https://1click.chaindefuser.com';
if (process.env.ONE_CLICK_JWT) {
  OpenAPI.TOKEN = process.env.ONE_CLICK_JWT;
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

export { QuoteRequest };
