/**
 * Core TypeScript definitions for the Ludo Multiplayer & UGX Real-Money Wallet platform
 */

export type Currency = 'UGX';

/**
 * Valid server-enforced real-money stakes in UGX
 */
export const ALLOWED_STAKES = [200, 500, 1000, 2000, 5000, 10000] as const;
export type AllowedStake = typeof ALLOWED_STAKES[number];

/**
 * Exact Service Fee Schedule (UGX) per user rules:
 * - 200 UGX Stake: 2P: 30, 3P: 50, 4P: 60
 * - 500 UGX Stake: 2P: 50, 3P: 80, 4P: 100
 * - 1000 UGX Stake: 2P: 100, 3P: 200, 4P: 300
 * - 2000 UGX Stake: 2P: 400, 3P: 500, 4P: 800
 * - 5000 UGX Stake: 2P: 1000, 3P: 1500, 4P: 2000
 * - 10000 UGX Stake: 2P: 2000, 3P: 3000, 4P: 4500
 */
export const SERVICE_FEE_TABLE: Record<number, Record<number, number>> = {
  200: { 2: 30, 3: 50, 4: 60 },
  500: { 2: 50, 3: 80, 4: 100 },
  1000: { 2: 100, 3: 200, 4: 300 },
  2000: { 2: 400, 3: 500, 4: 800 },
  5000: { 2: 1000, 3: 1500, 4: 2000 },
  10000: { 2: 2000, 3: 3000, 4: 4500 },
};

export function getServiceFee(stake: number, playerCount: number = 2): number {
  const count = playerCount >= 4 ? 4 : playerCount === 3 ? 3 : 2;
  if (SERVICE_FEE_TABLE[stake] && SERVICE_FEE_TABLE[stake][count] !== undefined) {
    return SERVICE_FEE_TABLE[stake][count];
  }
  // Default fallback 10%
  return Math.round(stake * count * 0.1);
}

/**
 * Financial configuration
 */
export interface GameEconomicsConfig {
  currency: Currency;
  allowedStakes: readonly number[];
  platformFeePercentage: number;
  minDepositUGX: number;
  maxDepositUGX: number;
  minWithdrawalUGX: number;
  maxWithdrawalUGX: number;
  dailyDefaultDepositLimitUGX: number;
}

export const GAME_ECONOMICS: GameEconomicsConfig = {
  currency: 'UGX',
  allowedStakes: ALLOWED_STAKES,
  platformFeePercentage: 10,
  minDepositUGX: 200,
  maxDepositUGX: 500000,
  minWithdrawalUGX: 1000,
  maxWithdrawalUGX: 500000,
  dailyDefaultDepositLimitUGX: 50000,
};

/**
 * User & Profile
 */
export type UserEligibility = 'unverified' | 'pending' | 'verified' | 'restricted';
export type UserAccountStatus = 'active' | 'suspended' | 'self_excluded';

export interface UserProfileDoc {
  id: string;
  username: string; // strictly lowercase letters, no numbers (e.g. "katoderrick")
  displayName: string;
  email?: string;
  phone?: string;
  avatar: string;
  level: number;
  xp: number;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  termsAccepted?: boolean;
  ageConfirmed?: boolean;
  diceSkin?: DiceSkin;
  status: UserAccountStatus;
  eligibilityStatus: UserEligibility;
  role?: 'user' | 'admin' | 'finance_admin' | 'game_moderator' | 'super_admin';
  createdAt: number;
  updatedAt: number;
}

export type DiceSkin = 'classic_ivory' | 'neon_cyan' | 'golden_royale' | 'ruby_velvet' | 'obsidian_dark' | 'emerald_luxe';

/**
 * Wallet & Ledger
 */
export interface WalletDoc {
  userId: string;
  availableBalance: number; // Integer in UGX
  lockedBalance: number;    // Integer in UGX
  currency: Currency;
  status: 'active' | 'locked' | 'frozen';
  createdAt: number;
  updatedAt: number;
}

export type TransactionType =
  | 'deposit'
  | 'gameEntry'
  | 'gamePrize'
  | 'platformFee'
  | 'refund'
  | 'withdrawal'
  | 'adjustment';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface WalletTransactionDoc {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // Integer (positive for credit, negative for debit)
  currency: Currency;
  reference: string;
  gameId?: string;
  depositId?: string;
  withdrawalId?: string;
  status: TransactionStatus;
  createdAt: number;
  metadata?: Record<string, any>;
}

/**
 * PesaJet 1.0 Mobile Money Integration (MTN & Airtel Uganda)
 */
export type DepositStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'reversed';

export interface DepositDoc {
  id: string;
  userId: string;
  merchantReference: string;
  pesajetTransactionId?: string;
  phoneNumber?: string;
  provider?: 'mtn' | 'airtel';
  amount: number; // Integer in UGX
  currency: Currency;
  status: DepositStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  failureReason?: string;
  metadata?: Record<string, any>;
}

/**
 * Withdrawals
 */
export interface WithdrawalDoc {
  id: string;
  userId: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed';
  payoutMethod: 'airtel_money' | 'mtn_momo' | 'bank_transfer';
  payoutAccount: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  failureReason?: string;
}

/**
 * Responsible Gaming
 */
export interface ResponsibleGamingDoc {
  userId: string;
  dailyDepositLimit: number;
  weeklyDepositLimit: number;
  lossLimit: number;
  sessionTimeLimitMinutes: number;
  selfExcludedUntil?: number;
  coolingOffUntil?: number;
  updatedAt: number;
}

/**
 * Audit Log
 */
export interface AuditLogDoc {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Game Modes & Board Types
 */
export type PlatformGameMode =
  | 'free_play'
  | '1v1'
  | '4_player'
  | 'private_room'
  | 'vs_bot';

export type LudoPlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface GameSettlementDoc {
  id: string;
  gameId: string;
  winnerId: string;
  totalPot: number;
  platformFee: number;
  prizeAmount: number;
  currency: Currency;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  createdAt: number;
  completedAt?: number;
  transactionReferences?: string[];
}

export function calculatePrizePool(stakePerPlayer: number, playerCount: number = 2) {
  const count = playerCount >= 4 ? 4 : playerCount === 3 ? 3 : 2;
  const totalPot = stakePerPlayer * count;
  const platformFee = getServiceFee(stakePerPlayer, count);
  const winnerPrize = totalPot - platformFee;
  return {
    totalPot,
    platformFee,
    winnerPrize,
  };
}

