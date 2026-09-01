import crypto from 'crypto';
import { ALLOWED_STAKES, GAME_ECONOMICS, getServiceFee } from '../../src/types/platform.js';

export interface PesaJetConfig {
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  baseUrl: string;
  webhookUrl: string;
}

export function getPesaJetConfig(): PesaJetConfig {
  const appUrl = (process.env.APP_URL || 'https://ludo-arena-theta.vercel.app').replace(/\/$/, '');
  return {
    apiKey: process.env.PESAJET_API_KEY || 'pk_f89be8bd38a605a5eccb68d5719362410e8235e0a9925f20',
    apiSecret: process.env.PESAJET_API_SECRET || 'sk_09c75a891c55e4b755df59dd12a8d80b3199d16736af9712',
    webhookSecret: process.env.PESAJET_WEBHOOK_SECRET || 'whsec_bf04d3ace455bc25d12d3bc76ce37d91c40cb1b55eba74d2',
    baseUrl: (process.env.PESAJET_BASE_URL || 'https://payments.pesajet.com/api/v1').replace(/\/$/, ''),
    webhookUrl: process.env.PESAJET_WEBHOOK_URL || `${appUrl}/api/pesajet/webhook`,
  };
}

/**
  * Formats Ugandan phone number to international E.164 standard (+256...)
  */
export function formatUgandaPhone(phone: string): string {
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('256') && cleaned.length >= 12) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+256${cleaned.substring(1)}`;
  }
  if (cleaned.length === 9) {
    return `+256${cleaned}`;
  }
  return `+${cleaned}`;
}

/**
 * Auto-detects Ugandan mobile network provider (mtn or airtel)
 */
export function detectUgandaProvider(phone: string): 'mtn' | 'airtel' {
  const formatted = formatUgandaPhone(phone);
  // Extract the 2-digit local prefix after +256 (e.g. 77, 78, 76, 70, 75, 74)
  const localPrefix = formatted.replace('+256', '').substring(0, 2);
  const mtnPrefixes = ['77', '78', '76', '39', '31', '32'];
  const airtelPrefixes = ['70', '75', '74', '20'];

  if (mtnPrefixes.includes(localPrefix)) {
    return 'mtn';
  }
  if (airtelPrefixes.includes(localPrefix)) {
    return 'airtel';
  }
  // Default to MTN if undetermined
  return 'mtn';
}

export interface PesaJetCollectionParams {
  amount: number;
  phoneNumber: string;
  provider?: 'mtn' | 'airtel';
  reference: string;
  idempotencyKey?: string;
  description?: string;
}

export interface PesaJetDisbursementParams {
  amount: number;
  phoneNumber: string;
  provider?: 'mtn' | 'airtel';
  reference: string;
  idempotencyKey?: string;
}

/**
 * Create a PesaJet Mobile Money Collection (Customer Deposit)
 */
export async function createPesaJetCollection(params: PesaJetCollectionParams) {
  const config = getPesaJetConfig();
  const formattedPhone = formatUgandaPhone(params.phoneNumber);
  const provider = params.provider || detectUgandaProvider(formattedPhone);
  const idempotencyKey = params.idempotencyKey || `coll-${params.reference}-${Date.now()}`;

  const payload = {
    type: 'COLLECTION',
    amount: Math.round(params.amount),
    currency: 'UGX',
    phoneNumber: formattedPhone,
    provider,
    reference: params.reference,
    idempotencyKey,
  };

  try {
    const res = await fetch(`${config.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.message || data?.error || `PesaJet API error (${res.status})`,
        data,
      };
    }

    return {
      success: true,
      transactionId: data?.transactionId || data?.id || `TRX-${Date.now()}`,
      status: data?.status || 'PENDING',
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to reach PesaJet API',
    };
  }
}

/**
 * Create a PesaJet Mobile Money Disbursement (Player Withdrawal Payout)
 */
export async function createPesaJetDisbursement(params: PesaJetDisbursementParams) {
  const config = getPesaJetConfig();
  const formattedPhone = formatUgandaPhone(params.phoneNumber);
  const provider = params.provider || detectUgandaProvider(formattedPhone);
  const idempotencyKey = params.idempotencyKey || `disb-${params.reference}-${Date.now()}`;

  const payload = {
    type: 'DISBURSEMENT',
    amount: Math.round(params.amount),
    currency: 'UGX',
    phoneNumber: formattedPhone,
    provider,
    reference: params.reference,
    idempotencyKey,
  };

  try {
    const res = await fetch(`${config.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.message || data?.error || `PesaJet API error (${res.status})`,
        data,
      };
    }

    return {
      success: true,
      transactionId: data?.transactionId || data?.id || `TRX-${Date.now()}`,
      status: data?.status || 'PENDING',
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to reach PesaJet API',
    };
  }
}

/**
 * Query status of a PesaJet Transaction
 */
export async function getPesaJetTransactionStatus(transactionId: string) {
  const config = getPesaJetConfig();
  try {
    const res = await fetch(`${config.baseUrl}/payments/${encodeURIComponent(transactionId)}`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.message || data?.error || `Status query failed (${res.status})`,
      };
    }

    return {
      success: true,
      transactionId,
      status: data?.status,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error querying transaction status',
    };
  }
}

/**
 * Verifies PesaJet Webhook Signature (HMAC-SHA256)
 */
export function verifyPesaJetWebhookSignature(rawBody: string | Buffer, signatureHeader?: string): boolean {
  const config = getPesaJetConfig();
  if (!config.webhookSecret || !signatureHeader) {
    return false;
  }

  try {
    const cleanHeader = signatureHeader.replace(/^sha256=/, '').trim();
    const hmac = crypto.createHmac('sha256', config.webhookSecret);
    hmac.update(rawBody);
    const computedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(cleanHeader, 'hex'),
      Buffer.from(computedSignature, 'hex')
    );
  } catch (err) {
    console.error('[PESAJET WEBHOOK] Signature verification failed:', err);
    return false;
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
  const count = playerCount >= 4 ? 4 : playerCount === 3 ? 3 : 2;
  const totalPot = stake * count;
  const platformFee = getServiceFee(stake, count);
  const prizeAmount = totalPot - platformFee;
  return {
    totalPot,
    platformFee,
    prizeAmount,
  };
}
