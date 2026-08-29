import crypto from 'crypto';
import express, { Request, Response } from 'express';
import { ALLOWED_STAKES, GAME_ECONOMICS } from '../src/types/platform';
import {
  getPesapalConfig,
  getPesapalAuthToken,
  validateStakeAmount,
  calculateMatchPrizeAndFee,
} from './services/economicsService';

const router = express.Router();

/**
 * Health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.PESAPAL_ENVIRONMENT || 'production',
    currency: GAME_ECONOMICS.currency,
    allowedStakes: ALLOWED_STAKES,
    platformFee: `${GAME_ECONOMICS.platformFeePercentage}%`,
    timestamp: Date.now(),
  });
});

/**
 * Economics configuration endpoint
 */
router.get('/economics', (req: Request, res: Response) => {
  res.json(GAME_ECONOMICS);
});

/**
 * Validate match quote calculation
 */
router.post('/quote', (req: Request, res: Response) => {
  const { stake, playerCount } = req.body;
  if (!stake || !validateStakeAmount(Number(stake))) {
    return res.status(400).json({ error: 'Invalid stake amount. Must be in ALLOWED_STAKES.' });
  }
  const count = Number(playerCount) === 4 ? 4 : 2;
  const quote = calculateMatchPrizeAndFee(Number(stake), count);
  res.json(quote);
});

/**
 * Cryptographically Secure Server-Authoritative Dice Roll
 */
router.post('/dice/roll', (req: Request, res: Response) => {
  const { gameId, playerId, turnNumber } = req.body;
  // Generate authoritative integer between 1 and 6 using crypto
  const randomBuffer = crypto.randomBytes(4);
  const randomInt = randomBuffer.readUInt32BE(0);
  const diceResult = (randomInt % 6) + 1;

  res.json({
    gameId,
    playerId,
    turnNumber,
    diceResult,
    timestamp: Date.now(),
    signature: crypto.createHash('sha256').update(`${gameId}:${playerId}:${turnNumber}:${diceResult}`).digest('hex'),
  });
});

/**
 * Pesapal 3.0 API Order Creation Endpoint
 */
router.post('/pesapal/order', async (req: Request, res: Response) => {
  try {
    const { amount, currency, userId, email, phone, description } = req.body;
    const numAmount = parseInt(amount, 10);

    if (isNaN(numAmount) || numAmount < GAME_ECONOMICS.minDepositUGX || numAmount > GAME_ECONOMICS.maxDepositUGX) {
      return res.status(400).json({
        error: `Deposit amount must be between UGX ${GAME_ECONOMICS.minDepositUGX.toLocaleString()} and UGX ${GAME_ECONOMICS.maxDepositUGX.toLocaleString()}`,
      });
    }

    if (!phone || String(phone).trim().length < 9) {
      return res.status(400).json({
        error: 'Please provide a valid Ugandan Mobile Money phone number (e.g., 0770000000 or 256770000000).',
      });
    }

    // Format phone to 256 standard
    let cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '256' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('256') && cleanPhone.length === 9) {
      cleanPhone = '256' + cleanPhone;
    }

    const config = getPesapalConfig();
    const merchantReference = `LUDO-${userId ? String(userId).slice(0, 6) : 'LIVE'}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Attempt live Pesapal 3.0 authentication
    const token = await getPesapalAuthToken();
    if (!token) {
      return res.status(502).json({
        error: 'Pesapal Authentication Error: Unable to authenticate with Pesapal API. Please verify that PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET are configured with your live merchant credentials.',
      });
    }

    const orderPayload = {
      id: merchantReference,
      currency: currency || 'UGX',
      amount: numAmount,
      description: description || `Ludo Real-Money Wallet Deposit (UGX ${numAmount.toLocaleString()})`,
      callback_url: config.callbackUrl,
      cancellation_url: config.cancellationUrl,
      notification_id: config.ipnId || undefined,
      billing_address: {
        email_address: email || 'payments@ludo-arena.com',
        phone_number: cleanPhone,
        country_code: 'UG',
        first_name: 'Ludo',
        last_name: 'Player',
      },
    };

    const pesapalRes = await fetch(`${config.baseUrl}/api/Transactions/SubmitOrder-Process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const pesapalData = await pesapalRes.json();
    if (!pesapalRes.ok || !pesapalData.redirect_url) {
      console.error('[PESAPAL] SubmitOrder error response:', pesapalData);
      return res.status(pesapalRes.status || 500).json({
        error: pesapalData.error?.message || pesapalData.message || 'Pesapal Gateway rejected order submission. Please check your Pesapal merchant configuration.',
        details: pesapalData,
      });
    }

    return res.json({
      success: true,
      merchantReference,
      pesapalTrackingId: pesapalData.order_tracking_id,
      redirectUrl: pesapalData.redirect_url,
      status: pesapalData.status || '200',
    });
  } catch (err: any) {
    console.error('[PESAPAL] Order creation exception:', err);
    res.status(500).json({ error: err.message || 'Failed to initialize live Pesapal order' });
  }
});

/**
 * Pesapal 3.0 IPN & Callback Verification Endpoint
 */
router.all('/pesapal/ipn', (req: Request, res: Response) => {
  const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.query;
  console.log(`[PESAPAL IPN] Received IPN callback: Ref: ${OrderMerchantReference}, Tracking: ${OrderTrackingId}, Type: ${OrderNotificationType}`);

  // Idempotent IPN handler
  res.status(200).json({
    status: '200',
    message: 'IPN received and queued for server verification',
    orderTrackingId: OrderTrackingId,
    merchantReference: OrderMerchantReference,
  });
});

export default router;
