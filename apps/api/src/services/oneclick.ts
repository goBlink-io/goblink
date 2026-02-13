import { OpenAPI, OneClickService, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';

// Initialize the API client
OpenAPI.BASE = process.env.ONE_CLICK_BASE_URL || 'https://1click.chaindefuser.com';
if (process.env.ONE_CLICK_JWT) {
  OpenAPI.TOKEN = process.env.ONE_CLICK_JWT;
}

export const getTokens = async () => {
  try {
    return await OneClickService.getTokens();
  } catch (error) {
    console.error('Error fetching tokens from 1Click:', error);
    throw error;
  }
};

export const getQuote = async (request: QuoteRequest) => {
  try {
    return await OneClickService.getQuote(request);
  } catch (error) {
    console.error('Error fetching quote from 1Click:', error);
    throw error;
  }
};

export const submitDeposit = async (txHash: string) => {
  try {
    return await OneClickService.submitDeposit({ txHash });
  } catch (error) {
    console.error('Error submitting deposit to 1Click:', error);
    throw error;
  }
};

export const getStatus = async (depositAddress: string) => {
  try {
    return await OneClickService.getStatus({ depositAddress });
  } catch (error) {
    console.error('Error fetching status from 1Click:', error);
    throw error;
  }
};
