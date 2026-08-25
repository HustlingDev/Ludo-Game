export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type PlayerType = 'human' | 'bot';

export type TokenState = 'YARD' | 'TRACK' | 'HOME_STRETCH' | 'HOME';

export interface Token {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  state: TokenState;
  step: number; // -1 for YARD, 0..50 for common track (relative to player start), 51..55 for HOME_STRETCH, 56 for HOME
  trackIndex: number; // 0..51 absolute board index when on track, or -1
  yardIndex: number; // 0..3 slot in yard
}

export interface Player {
  id: string; // socketId or local id
  name: string;
  avatar: string;
  color: PlayerColor;
  type: PlayerType;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  isHost?: boolean;
  isConnected: boolean;
  tokens: Token[];
  rank?: number; // 1, 2, 3, 4 when completed
  hasWon: boolean;
  consecutiveSixes: number;
  rating?: number;
}

export type GameMode = 'local_pass_play' | 'local_vs_bot' | 'online_multiplayer';

export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export type BoardTheme =
  | 'classic_arrows'
  | 'star_minimal'
  | 'geometric_diamond'
  | 'classic_wood'
  | 'modern_neon';

export interface GameState {
  roomId: string;
  mode: GameMode;
  status: GameStatus;
  players: Player[];
  activeColorIndex: number; // index into activeColors array
  activeColors: PlayerColor[];
  diceValue: number;
  hasRolled: boolean;
  canRoll: boolean;
  validTokenMoves: number[]; // token IDs (0..3) of current player that can legally move
  turnTimeLimit: number; // in seconds (e.g. 20, 0 for infinite)
  turnTimeRemaining: number;
  winnerOrder: PlayerColor[];
  lastMoveDescription?: string;
  consecutiveSixes: number;
  mustSelectToken: boolean;
  isCompetitive?: boolean;
  startedAt?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: PlayerColor;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  senderColor: PlayerColor;
  x: number; // 0..100 percentage
  y: number; // 0..100 percentage
}

// User Settings
export interface UserSettings {
  gameplay: {
    animationSpeed: 'fast' | 'normal' | 'slow';
    autoMoveSingleChoice: boolean;
    confirmMoves: boolean;
  };
  audio: {
    bgmEnabled: boolean;
    bgmVolume: number;
    sfxEnabled: boolean;
    sfxVolume: number;
    muteAll: boolean;
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    boardTheme: BoardTheme;
  };
  privacy: {
    onlineStatus: boolean;
    allowFriendRequests: boolean;
    allowGameInvites: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    largerText: boolean;
    highContrast: boolean;
  };
}

// Friend & Social Types
export interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'in_game' | 'offline';
  rating: number;
  favoriteColor: PlayerColor;
  lastSeen?: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  rating: number;
  timestamp: number;
}

// Notification System
export interface NotificationItem {
  id: string;
  type: 'friend_request' | 'game_invite' | 'achievement' | 'reward' | 'friend_online' | 'tournament';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionData?: {
    roomId?: string;
    friendId?: string;
    rewardXp?: number;
  };
}

// Player Statistics
export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalCaptures: number;
  gamesAbandoned: number;
  currentRating: number;
  highestRating: number;
  currentLevel: number;
  currentXp: number;
  nextLevelXp: number;
  favoriteGameMode: string;
  recentForm: ('W' | 'L')[];
}

// Match History
export interface MatchHistoryItem {
  id: string;
  date: string;
  timestamp: number;
  players: {
    name: string;
    avatar: string;
    color: PlayerColor;
    rating: number;
    isUser: boolean;
    isWinner: boolean;
    rank: number;
  }[];
  winnerColor: PlayerColor;
  winnerName: string;
  gameMode: GameMode;
  durationSeconds: number;
  ratingChange: number;
  result: 'VICTORY' | '2ND PLACE' | '3RD PLACE' | 'DEFEAT';
  capturesMade: number;
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  rating: number;
  wins: number;
  winRate: number;
  xp: number;
  gamesPlayed: number;
  isCurrentUser?: boolean;
}

// WebSocket message protocols
export type WSClientAction =
  | { type: 'CREATE_ROOM'; payload: { hostName: string; avatar: string; color: PlayerColor; maxPlayers: number; turnTimeLimit: number; withBots: boolean; isCompetitive?: boolean } }
  | { type: 'JOIN_ROOM'; payload: { roomId: string; playerName: string; avatar: string; preferredColor?: PlayerColor } }
  | { type: 'START_GAME'; payload: { roomId: string } }
  | { type: 'ROLL_DICE'; payload: { roomId: string } }
  | { type: 'MOVE_TOKEN'; payload: { roomId: string; tokenId: number } }
  | { type: 'ADD_BOT'; payload: { roomId: string; color: PlayerColor; difficulty: 'easy' | 'medium' | 'hard' } }
  | { type: 'REMOVE_BOT'; payload: { roomId: string; color: PlayerColor } }
  | { type: 'SEND_CHAT'; payload: { roomId: string; text: string } }
  | { type: 'SEND_EMOJI'; payload: { roomId: string; emoji: string } }
  | { type: 'LEAVE_ROOM'; payload: { roomId: string } }
  | { type: 'RESTART_GAME'; payload: { roomId: string } };

export type WSServerAction =
  | { type: 'ROOM_CREATED'; payload: { roomId: string; state: GameState; playerId: string } }
  | { type: 'ROOM_JOINED'; payload: { roomId: string; state: GameState; playerId: string } }
  | { type: 'GAME_STATE_UPDATE'; payload: { state: GameState } }
  | { type: 'DICE_ROLLED'; payload: { diceValue: number; playerColor: PlayerColor; consecutiveSixes: number } }
  | { type: 'TOKEN_MOVED'; payload: { playerColor: PlayerColor; tokenId: number; fromStep: number; toStep: number; capturedColor?: PlayerColor } }
  | { type: 'CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'EMOJI_REACTION'; payload: FloatingReaction }
  | { type: 'PLAYER_DISCONNECTED'; payload: { playerId: string; name: string } }
  | { type: 'ERROR'; payload: { message: string } };

