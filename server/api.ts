import crypto from 'crypto';
import express, { Request, Response } from 'express';
import { ALLOWED_STAKES, GAME_ECONOMICS } from '../src/types/platform';
import {
  getPesaJetConfig,
  createPesaJetCollection,
  createPesaJetDisbursement,
  getPesaJetTransactionStatus,
  verifyPesaJetWebhookSignature,
  formatUgandaPhone,
  detectUgandaProvider,
  validateStakeAmount,
  calculateMatchPrizeAndFee,
} from './services/economicsService';

const router = express.Router();

/**
 * Health check
 */
router.get('/health', (req: Request, res: Response) => {
  const config = getPesaJetConfig();
  res.json({
    status: 'ok',
    provider: 'PesaJet 1.0 (MTN & Airtel Uganda)',
    currency: GAME_ECONOMICS.currency,
    allowedStakes: ALLOWED_STAKES,
    platformFee: `${GAME_ECONOMICS.platformFeePercentage}%`,
    webhookConfigured: Boolean(config.webhookSecret),
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

async function handleCollectionRequest(req: Request, res: Response) {
  try {
    const { amount, phone, phoneNumber, provider, userId, description } = req.body;
    const numAmount = parseInt(amount, 10);
    const targetPhone = phone || phoneNumber;

    if (isNaN(numAmount) || numAmount < GAME_ECONOMICS.minDepositUGX || numAmount > GAME_ECONOMICS.maxDepositUGX) {
      return res.status(400).json({
        error: `Deposit amount must be between UGX ${GAME_ECONOMICS.minDepositUGX.toLocaleString()} and UGX ${GAME_ECONOMICS.maxDepositUGX.toLocaleString()}`,
      });
    }

    if (!targetPhone || String(targetPhone).trim().length < 9) {
      return res.status(400).json({
        error: 'Please provide a valid Ugandan Mobile Money phone number (e.g. 0794915844 / +256794915844).',
      });
    }

    const formattedPhone = formatUgandaPhone(targetPhone);
    const detectedProvider = provider || detectUgandaProvider(formattedPhone);
    const reference = `LUDO-${userId ? String(userId).slice(0, 6) : 'DEP'}-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const idempotencyKey = `dep-${reference}`;

    const result = await createPesaJetCollection({
      amount: numAmount,
      phoneNumber: formattedPhone,
      provider: detectedProvider,
      reference,
      idempotencyKey,
      description: description || `Ludo Arena Deposit (UGX ${numAmount.toLocaleString()})`,
    });

    if (!result.success) {
      console.warn('[PESAJET COLLECTION ERROR]', result.error, result.data);
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to initiate Mobile Money deposit request with PesaJet.',
        reference,
        phoneNumber: formattedPhone,
        provider: detectedProvider,
      });
    }

    return res.json({
      success: true,
      transactionId: result.transactionId,
      reference,
      phoneNumber: formattedPhone,
      provider: detectedProvider,
      amount: numAmount,
      status: result.status || 'PENDING',
      message: `Mobile Money payment prompt sent to ${formattedPhone} (${detectedProvider.toUpperCase()}). Please enter your PIN on your phone to complete deposit.`,
    });
  } catch (err: any) {
    console.error('[PESAJET] Collection Exception:', err);
    res.status(500).json({ error: err.message || 'Server error processing PesaJet deposit' });
  }
}

/**
 * PesaJet Mobile Money Deposit (Collection) Endpoint
 * Triggers a real-time Mobile Money USSD prompt on the customer's phone
 */
router.post('/pesajet/collection', handleCollectionRequest);
router.post('/payments/collection', handleCollectionRequest);

/**
 * PesaJet Mobile Money Withdrawal (Disbursement) Endpoint
 */
router.post('/pesajet/disbursement', async (req: Request, res: Response) => {
  try {
    const { amount, phone, phoneNumber, provider, userId } = req.body;
    const numAmount = parseInt(amount, 10);
    const targetPhone = phone || phoneNumber;

    if (isNaN(numAmount) || numAmount < GAME_ECONOMICS.minWithdrawalUGX) {
      return res.status(400).json({
        error: `Minimum withdrawal is UGX ${GAME_ECONOMICS.minWithdrawalUGX.toLocaleString()}`,
      });
    }

    if (!targetPhone || String(targetPhone).trim().length < 9) {
      return res.status(400).json({
        error: 'Please provide a valid Ugandan Mobile Money phone number for payout.',
      });
    }

    const formattedPhone = formatUgandaPhone(targetPhone);
    const detectedProvider = provider || detectUgandaProvider(formattedPhone);
    const reference = `WTH-${userId ? String(userId).slice(0, 6) : 'USR'}-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const idempotencyKey = `wth-${reference}`;

    const result = await createPesaJetDisbursement({
      amount: numAmount,
      phoneNumber: formattedPhone,
      provider: detectedProvider,
      reference,
      idempotencyKey,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to dispatch payout via PesaJet.',
      });
    }

    return res.json({
      success: true,
      transactionId: result.transactionId,
      reference,
      phoneNumber: formattedPhone,
      provider: detectedProvider,
      amount: numAmount,
      status: result.status || 'PENDING',
      message: `Withdrawal of UGX ${numAmount.toLocaleString()} initiated to ${formattedPhone} (${detectedProvider.toUpperCase()}).`,
    });
  } catch (err: any) {
    console.error('[PESAJET] Disbursement Exception:', err);
    res.status(500).json({ error: err.message || 'Server error processing PesaJet payout' });
  }
});

/**
 * Query Transaction Status from PesaJet
 */
router.get('/pesajet/status/:id', async (req: Request, res: Response) => {
  try {
    const transactionId = req.params.id;
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    const result = await getPesaJetTransactionStatus(transactionId);
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error querying status' });
  }
});

/**
 * PesaJet Webhook Endpoint
 * Verifies HMAC-SHA256 signature using PESAJET_WEBHOOK_SECRET
 */
router.post('/pesajet/webhook', (req: Request, res: Response) => {
  const signature =
    (req.headers['x-pesajet-signature'] as string) ||
    (req.headers['x-signature'] as string) ||
    (req.headers['pesajet-signature'] as string) ||
    (req.headers['signature'] as string);

  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  console.log(`[PESAJET WEBHOOK] Received webhook payload:`, req.body);

  if (signature) {
    const isValid = verifyPesaJetWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn(`[PESAJET WEBHOOK] Invalid signature header received: ${signature}`);
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
  }

  const { type, status, reference, transactionId, amount, phoneNumber } = req.body || {};

  console.log(`[PESAJET WEBHOOK] Transaction ${transactionId || reference} (${type}) is now: ${status} for ${amount} UGX (${phoneNumber})`);

  // Webhook acknowledged successfully
  res.status(200).json({
    received: true,
    transactionId: transactionId || reference,
    status: status || 'PROCESSED',
    timestamp: Date.now(),
  });
});

// Online Players Lobby Directory
interface LobbyOnlineUser {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  status: 'available' | 'in_game';
  country: string;
  lastSeen: number;
}

const onlineLobbyUsers = new Map<string, LobbyOnlineUser>();

// Seed default online players
const SEED_PLAYERS: LobbyOnlineUser[] = [
  { id: 'ply_kato', name: 'Kato Derrick', avatar: '👑', rating: 1420, status: 'available', country: 'UG', lastSeen: Date.now() },
  { id: 'ply_namubiru', name: 'Sarah Namubiru', avatar: '⚡', rating: 1350, status: 'available', country: 'UG', lastSeen: Date.now() },
  { id: 'ply_mukasa', name: 'Brian Mukasa', avatar: '🐉', rating: 1280, status: 'available', country: 'UG', lastSeen: Date.now() },
  { id: 'ply_amina', name: 'Zainab Amina', avatar: '💎', rating: 1390, status: 'available', country: 'UG', lastSeen: Date.now() },
  { id: 'ply_okello', name: 'John Okello', avatar: '🦁', rating: 1210, status: 'available', country: 'UG', lastSeen: Date.now() },
  { id: 'ply_nabulime', name: 'Joy Nabulime', avatar: '🔥', rating: 1310, status: 'available', country: 'UG', lastSeen: Date.now() },
];
SEED_PLAYERS.forEach((p) => onlineLobbyUsers.set(p.id, p));

router.get('/lobby/players', (req: Request, res: Response) => {
  const now = Date.now();
  Array.from(onlineLobbyUsers.entries()).forEach(([id, user]) => {
    if (!id.startsWith('ply_') && now - user.lastSeen > 120000) {
      onlineLobbyUsers.delete(id);
    }
  });

  const playersList = Array.from(onlineLobbyUsers.values()).map((p) => ({
    ...p,
    isOnline: true,
  }));
  res.json({ players: playersList });
});

router.post('/lobby/heartbeat', (req: Request, res: Response) => {
  const { id, name, avatar, rating, status } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const userId = id || `usr_${String(name).toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  onlineLobbyUsers.set(userId, {
    id: userId,
    name,
    avatar: avatar || '👑',
    rating: rating || 1200,
    status: status || 'available',
    country: 'UG',
    lastSeen: Date.now(),
  });
  res.json({ success: true, userId });
});

router.post('/challenges/send', (req: Request, res: Response) => {
  const { fromPlayer, toPlayerId, stakeUGX } = req.body;
  if (!fromPlayer || !toPlayerId) {
    return res.status(400).json({ error: 'Missing challenge parameters' });
  }

  const opponent = onlineLobbyUsers.get(toPlayerId);
  const opponentName = opponent ? opponent.name : 'Opponent';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let roomId = '';
  for (let i = 0; i < 6; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  res.json({
    success: true,
    roomId,
    message: `Challenge accepted by ${opponentName}! 1v1 duel starting on opposite corners!`,
    stakeUGX: stakeUGX || 0,
  });
});

export default router;
