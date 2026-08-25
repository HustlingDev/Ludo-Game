import { Request, Response } from 'express';
import { ALLOWED_STAKES, GAME_ECONOMICS } from '../../src/types/platform.js';


export interface PesapalConfig {
  consumerKey: string;
  consumerSecret: string;
  ipnId: string;
  callbackUrl: string;
  cancellationUrl: string;
  baseUrl: string;
}

export function getPesapalConfig(): PesapalConfig {
  const isProd = process.env.PESAPAL_ENVIRONMENT === 'production';
  return {
    consumerKey: process.env.PESAPAL_CONSUMER_KEY || '',
    consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || '',
    ipnId: process.env.PESAPAL_IPN_ID || '',
    callbackUrl: process.env.PESAPAL_CALLBACK_URL || '',
    cancellationUrl: process.env.PESAPAL_CANCELLATION_URL || '',
    baseUrl: isProd
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3',
  };
}

/**
 * Server-authoritative Stake validator
 */
export function validateStakeAmount(amount: number): boolean {
  return (ALLOWED_STAKES as readonly number[]).includes(amount);
}

/**
 * Server-authoritative Fee and Prize calculator
 */
export function calculateMatchPrizeAndFee(stake: number, playerCount: number) {
  const totalPot = stake * playerCount;
  const platformFee = Math.round((totalPot * GAME_ECONOMICS.platformFeePercentage) / 100);
  const prizeAmount = totalPot - platformFee;
  return {
    totalPot,
    platformFee,
    prizeAmount,
  };
}
