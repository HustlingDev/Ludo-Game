/**
 * Core TypeScript definitions for the Ludo Multiplayer & UGX Real-Money Wallet platform
 */

export type Currency = 'UGX';

/**
 * Valid server-enforced real-money stakes in UGX
 */
export const ALLOWED_STAKES = [500, 1000, 2000, 5000, 10000, 20000] as const;
export type AllowedStake = typeof ALLOWED_STAKES[number];

/**
 * Financial configuration
 */
export interface GameEconomicsConfig {
  currency: Currency;
  allowedStakes: readonly number[];
  platformFeePercentage: number; // e.g. 10 for 10%
  minDepositUGX: number;
  maxDepositUGX: number;
  minWithdrawalUGX: number;
  maxWithdrawalUGX: number;
  dailyDefaultDepositLimitUGX: number;
}

export const GAME_ECONOMICS: GameEconomicsConfig = {
  currency: 'UGX',
  allowedStakes: ALLOWED_STAKES,
  platformFeePercentage: 10, // 10% rake
  minDepositUGX: 500,
  maxDepositUGX: 500000,
  minWithdrawalUGX: 2000,
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
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  avatar: string;
  level: number;
  xp: number;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  status: UserAccountStatus;
  eligibilityStatus: UserEligibility;
  role?: 'user' | 'admin' | 'finance_admin' | 'game_moderator' | 'super_admin';
  createdAt: number;
  updatedAt: number;
}

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
  const totalPot = stakePerPlayer * playerCount;
  const platformFee = Math.round(totalPot * 0.1); // 10% platform fee
  const winnerPrize = totalPot - platformFee;
  return {
    totalPot,
    platformFee,
    winnerPrize,
  };
}

