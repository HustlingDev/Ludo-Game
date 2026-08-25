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
  const appUrl = (process.env.APP_URL || 'https://ludo-arena-theta.vercel.app').replace(/\/$/, '');
  return {
    consumerKey: process.env.PESAPAL_CONSUMER_KEY || 'YdD5wiLJ3zCiIijV3Wb2xnV+7Sjugby+',
    consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || 'q/nU5o64KI8OW8pDUIgl4BV9VI4=',
    ipnId: process.env.PESAPAL_IPN_ID || '',
    callbackUrl: process.env.PESAPAL_CALLBACK_URL || `${appUrl}/api/pesapal/ipn`,
    cancellationUrl: process.env.PESAPAL_CANCELLATION_URL || `${appUrl}/`,
    baseUrl: isProd
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3',
  };
}

/**
 * Obtain Bearer Token from Pesapal 3.0 API
 */
export async function getPesapalAuthToken(): Promise<string | null> {
  const config = getPesapalConfig();
  if (!config.consumerKey || !config.consumerSecret) {
    return null;
  }

  try {
    const res = await fetch(`${config.baseUrl}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[PESAPAL] Auth token error:', errText);
      return null;
    }

    const data = await res.json();
    return data.token || null;
  } catch (err) {
    console.error('[PESAPAL] RequestToken failed:', err);
    return null;
  }
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

