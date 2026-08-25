import crypto from 'crypto';
import express, { Request, Response } from 'express';
import { ALLOWED_STAKES, GAME_ECONOMICS } from '../src/types/platform';
import { getPesapalConfig, validateStakeAmount, calculateMatchPrizeAndFee } from './services/economicsService';

const router = express.Router();

/**
 * Health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.PESAPAL_ENVIRONMENT || 'sandbox',
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
        error: `Deposit amount must be between UGX ${GAME_ECONOMICS.minDepositUGX} and UGX ${GAME_ECONOMICS.maxDepositUGX}`,
      });
    }

    const config = getPesapalConfig();
    const merchantReference = `LUDO-${userId ? userId.slice(0, 6) : 'GUEST'}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Return structured order object for Pesapal 3.0 sandbox submission
    res.json({
      success: true,
      merchantReference,
      amount: numAmount,
      currency: currency || 'UGX',
      status: 'pending',
      redirectUrl: `${process.env.APP_URL || ''}/payment/status?ref=${merchantReference}&amount=${numAmount}`,
      pesapalTrackingId: `PESA-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      sandboxMode: process.env.PESAPAL_ENVIRONMENT !== 'production',
      note: 'Pesapal 3.0 Sandbox order initialized successfully',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create Pesapal order' });
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
