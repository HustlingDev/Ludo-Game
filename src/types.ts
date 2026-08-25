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
}

export type GameMode = 'local_pass_play' | 'local_vs_bot' | 'online_multiplayer';

export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export type BoardTheme = 'classic_wood' | 'modern_neon' | 'vibrant_carnival' | 'nordic_minimal';

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

// WebSocket message protocols
export type WSClientAction =
  | { type: 'CREATE_ROOM'; payload: { hostName: string; avatar: string; color: PlayerColor; maxPlayers: number; turnTimeLimit: number; withBots: boolean } }
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
