import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  GameState,
  Player,
  PlayerColor,
  GameMode,
  BoardTheme,
  ChatMessage,
  FloatingReaction,
  WSClientAction,
  WSServerAction,
  UserSettings,
  Friend,
  FriendRequest,
  NotificationItem,
  PlayerStats,
  MatchHistoryItem,
  LeaderboardEntry,
} from '../types';
import {
  createInitialGameState,
  createInitialPlayer,
  applyDiceRoll,
  applyTokenMove,
  getValidTokenMoves,
  selectBestBotMove,
  calculateEloChange,
  calculateXpGain,
} from '../utils/ludoEngine';
import { sounds } from '../utils/audio';
import { ToastMessage } from '../components/ErrorToast';

const STORAGE_KEY_USER = 'ludo_user_profile';
const STORAGE_KEY_SETTINGS = 'ludo_user_settings';
const STORAGE_KEY_STATS = 'ludo_user_stats';
const STORAGE_KEY_HISTORY = 'ludo_user_history';
const STORAGE_KEY_FRIENDS = 'ludo_user_friends';
const STORAGE_KEY_REQUESTS = 'ludo_user_requests';
const STORAGE_KEY_NOTIFS = 'ludo_user_notifications';

export interface UserProfile {
  name: string;
  avatar: string;
  preferredColor: PlayerColor;
  rating: number;
}

const DEFAULT_PROFILE: UserProfile = {
  name: `Player_${Math.floor(1000 + Math.random() * 9000)}`,
  avatar: '👑',
  preferredColor: 'red',
  rating: 1200,
};

const DEFAULT_SETTINGS: UserSettings = {
  gameplay: {
    animationSpeed: 'normal',
    autoMoveSingleChoice: true,
    confirmMoves: false,
  },
  audio: {
    bgmEnabled: false,
    bgmVolume: 0.3,
    sfxEnabled: true,
    sfxVolume: 0.7,
    muteAll: false,
  },
  appearance: {
    theme: 'dark',
    boardTheme: 'classic_arrows',
  },
  privacy: {
    onlineStatus: true,
    allowFriendRequests: true,
    allowGameInvites: true,
  },
  accessibility: {
    reducedMotion: false,
    largerText: false,
    highContrast: false,
  },
};

const DEFAULT_STATS: PlayerStats = {
  totalGames: 14,
  wins: 9,
  losses: 5,
  winRate: 64,
  totalCaptures: 28,
  gamesAbandoned: 0,
  currentRating: 1200,
  highestRating: 1248,
  currentLevel: 4,
  currentXp: 380,
  nextLevelXp: 600,
  favoriteGameMode: 'local_vs_bot',
  recentForm: ['W', 'W', 'L', 'W', 'W'],
};

const DEFAULT_FRIENDS: Friend[] = [
  {
    id: 'f1',
    name: 'MasterDice',
    avatar: '🐉',
    status: 'online',
    rating: 1350,
    favoriteColor: 'green',
  },
  {
    id: 'f2',
    name: 'StarRunner',
    avatar: '🚀',
    status: 'in_game',
    rating: 1280,
    favoriteColor: 'yellow',
  },
  {
    id: 'f3',
    name: 'CyberKing',
    avatar: '⚡',
    status: 'offline',
    rating: 1190,
    favoriteColor: 'blue',
    lastSeen: '2h ago',
  },
  {
    id: 'f4',
    name: 'RoyalPawn',
    avatar: '👑',
    status: 'online',
    rating: 1410,
    favoriteColor: 'red',
  },
];

const DEFAULT_HISTORY: MatchHistoryItem[] = [
  {
    id: 'm1',
    date: 'Today, 2:40 PM',
    timestamp: Date.now() - 3600000,
    players: [
      { name: 'You', avatar: '👑', color: 'red', rating: 1200, isUser: true, isWinner: true, rank: 1 },
      { name: 'Bot Green', avatar: '🤖', color: 'green', rating: 1180, isUser: false, isWinner: false, rank: 2 },
      { name: 'Bot Yellow', avatar: '🤖', color: 'yellow', rating: 1190, isUser: false, isWinner: false, rank: 3 },
      { name: 'Bot Blue', avatar: '🤖', color: 'blue', rating: 1210, isUser: false, isWinner: false, rank: 4 },
    ],
    winnerColor: 'red',
    winnerName: 'You',
    gameMode: 'local_vs_bot',
    durationSeconds: 340,
    ratingChange: 18,
    result: 'VICTORY',
    capturesMade: 3,
  },
  {
    id: 'm2',
    date: 'Yesterday, 8:15 PM',
    timestamp: Date.now() - 86400000,
    players: [
      { name: 'MasterDice', avatar: '🐉', color: 'green', rating: 1340, isUser: false, isWinner: true, rank: 1 },
      { name: 'You', avatar: '👑', color: 'red', rating: 1182, isUser: true, isWinner: false, rank: 2 },
      { name: 'StarRunner', avatar: '🚀', color: 'yellow', rating: 1270, isUser: false, isWinner: false, rank: 3 },
      { name: 'CyberBot', avatar: '🤖', color: 'blue', rating: 1150, isUser: false, isWinner: false, rank: 4 },
    ],
    winnerColor: 'green',
    winnerName: 'MasterDice',
    gameMode: 'online_multiplayer',
    durationSeconds: 490,
    ratingChange: -12,
    result: '2ND PLACE',
    capturesMade: 1,
  },
];

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, id: 'u1', name: 'GrandMaster_Ludo', avatar: '👑', rating: 1890, wins: 142, winRate: 78, xp: 12500, gamesPlayed: 182 },
  { rank: 2, id: 'u2', name: 'PhoenixReign', avatar: '🔥', rating: 1765, wins: 115, winRate: 72, xp: 9800, gamesPlayed: 160 },
  { rank: 3, id: 'u3', name: 'DragonKnight', avatar: '🐉', rating: 1680, wins: 98, winRate: 68, xp: 8200, gamesPlayed: 144 },
  { rank: 4, id: 'u4', name: 'StarRunner', avatar: '🚀', rating: 1540, wins: 84, winRate: 65, xp: 6900, gamesPlayed: 129 },
  { rank: 5, id: 'u5', name: 'RoyalPawn', avatar: '💎', rating: 1410, wins: 62, winRate: 61, xp: 5100, gamesPlayed: 101 },
  { rank: 6, id: 'u6', name: 'MasterDice', avatar: '🎯', rating: 1350, wins: 54, winRate: 58, xp: 4400, gamesPlayed: 93 },
  { rank: 7, id: 'u_current', name: 'You', avatar: '👑', rating: 1200, wins: 9, winRate: 64, xp: 380, gamesPlayed: 14, isCurrentUser: true },
];

export function useLudoGame() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      return saved ? JSON.parse(saved) : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  const [history, setHistory] = useState<MatchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : DEFAULT_HISTORY;
    } catch {
      return DEFAULT_HISTORY;
    }
  });

  const [friends, setFriends] = useState<Friend[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FRIENDS);
      return saved ? JSON.parse(saved) : DEFAULT_FRIENDS;
    } catch {
      return DEFAULT_FRIENDS;
    }
  });

  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'req_1',
              senderId: 'u_req1',
              senderName: 'LudoTitan',
              senderAvatar: '🦁',
              rating: 1260,
              timestamp: Date.now() - 120000,
            },
          ];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'notif_1',
              type: 'reward',
              title: 'Daily Login Reward',
              message: 'Claim +50 XP for daily check-in!',
              timestamp: Date.now() - 3600000,
              read: false,
              actionData: { rewardXp: 50 },
            },
            {
              id: 'notif_2',
              type: 'friend_online',
              title: 'Friend Online',
              message: 'MasterDice is online now.',
              timestamp: Date.now() - 7200000,
              read: true,
            },
          ];
    } catch {
      return [];
    }
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal open states
  const [activeModal, setActiveModal] = useState<
    'lobby' | 'rules' | 'settings' | 'friends' | 'stats' | 'history' | 'leaderboard' | 'notifications' | 'wallet' | 'auth' | null
  >('lobby');


  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [draggedTokenId, setDraggedTokenId] = useState<number | null>(null);
  const [hoveredTokenId, setHoveredTokenId] = useState<number | null>(null);
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string>('local_player_1');

  // Core game state
  const [gameState, setGameState] = useState<GameState>(() => {
    const p1 = createInitialPlayer('p1', profile.name, profile.avatar, profile.preferredColor, 'human', 'medium', true);
    const p2 = createInitialPlayer('p2', 'Bot Green', '🤖', 'green', 'bot', 'medium', false);
    const p3 = createInitialPlayer('p3', 'Bot Yellow', '🤖', 'yellow', 'bot', 'medium', false);
    const p4 = createInitialPlayer('p4', 'Bot Blue', '🤖', 'blue', 'bot', 'medium', false);
    return createInitialGameState('OFFLINE', 'local_vs_bot', [p1, p2, p3, p4], 30);
  });

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localTurnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Toast Helpers
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save states to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {}
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {}
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(friends));
    } catch {}
  }, [friends]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(pendingRequests));
    } catch {}
  }, [pendingRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Sync Audio Settings
  useEffect(() => {
    sounds.setMuteAll(settings.audio.muteAll);
    sounds.setSfxMuted(!settings.audio.sfxEnabled);
    sounds.setBgmMuted(!settings.audio.bgmEnabled);
    sounds.setSfxVolume(settings.audio.sfxVolume);
    sounds.setBgmVolume(settings.audio.bgmVolume);
  }, [settings.audio]);

  // Handle Confetti and Game Completion Record
  const isMatchRecordedRef = useRef(false);

  useEffect(() => {
    if (gameState.status === 'finished' || (gameState.winnerOrder && gameState.winnerOrder.length > 0)) {
      sounds.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      if (!isMatchRecordedRef.current) {
        isMatchRecordedRef.current = true;

        const winnerColor = gameState.winnerOrder[0];
        const isUserWinner = winnerColor === profile.preferredColor;
        const opponentRatings = gameState.players
          .filter((p) => p.color !== profile.preferredColor)
          .map((p) => p.rating || 1200);

        const eloDelta = calculateEloChange(
          profile.rating,
          opponentRatings,
          isUserWinner ? 1 : 2,
          gameState.players.length,
          true
        );

        const xpEarned = calculateXpGain(isUserWinner ? 1 : 2, 2, gameState.mode);

        // Update profile
        const newRating = Math.max(800, profile.rating + eloDelta);
        setProfile((prev) => ({
          ...prev,
          rating: newRating,
        }));

        // Update stats
        setStats((prev) => {
          const totalGames = prev.totalGames + 1;
          const wins = prev.wins + (isUserWinner ? 1 : 0);
          const losses = prev.losses + (isUserWinner ? 0 : 1);
          const winRate = Math.round((wins / totalGames) * 100);
          const currentXp = prev.currentXp + xpEarned;
          const nextLevelXp = prev.nextLevelXp;
          let level = prev.currentLevel;
          let remXp = currentXp;

          if (remXp >= nextLevelXp) {
            level += 1;
            remXp -= nextLevelXp;
            addToast({
              type: 'success',
              title: 'Level Up!',
              message: `Congratulations! You reached Level ${level}!`,
            });
          }

          return {
            ...prev,
            totalGames,
            wins,
            losses,
            winRate,
            currentRating: newRating,
            highestRating: Math.max(prev.highestRating, newRating),
            currentLevel: level,
            currentXp: remXp,
            recentForm: [isUserWinner ? 'W' : 'L', ...prev.recentForm.slice(0, 4)],
          };
        });

        // Add to history
        const newHistoryItem: MatchHistoryItem = {
          id: `match_${Date.now()}`,
          date: 'Just now',
          timestamp: Date.now(),
          players: gameState.players.map((p) => ({
            name: p.name,
            avatar: p.avatar,
            color: p.color,
            rating: p.rating || 1200,
            isUser: p.color === profile.preferredColor,
            isWinner: p.color === winnerColor,
            rank: p.color === winnerColor ? 1 : 2,
          })),
          winnerColor,
          winnerName: gameState.players.find((p) => p.color === winnerColor)?.name || 'Winner',
          gameMode: gameState.mode,
          durationSeconds: Math.floor((Date.now() - (gameState.startedAt || Date.now())) / 1000),
          ratingChange: eloDelta,
          result: isUserWinner ? 'VICTORY' : 'DEFEAT',
          capturesMade: 2,
        };

        setHistory((prev) => [newHistoryItem, ...prev]);

        addToast({
          type: isUserWinner ? 'success' : 'info',
          title: isUserWinner ? 'Match Victory!' : 'Match Finished',
          message: `${eloDelta >= 0 ? '+' : ''}${eloDelta} ELO | +${xpEarned} XP`,
        });
      }
    } else {
      isMatchRecordedRef.current = false;
    }
  }, [gameState.status, gameState.winnerOrder, profile.preferredColor, profile.rating, gameState.mode, addToast]);

  // Connect WebSocket helper with friendly reconnection and error feedback
  const connectWebSocket = useCallback(
    (onOpen?: (ws: WebSocket) => void) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (onOpen) onOpen(wsRef.current);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (onOpen) onOpen(socket);
      };

      socket.onmessage = (event) => {
        try {
          const action = JSON.parse(event.data) as WSServerAction;
          handleServerAction(action);
        } catch {
          addToast({
            type: 'error',
            title: 'Message Error',
            message: 'Something went wrong while synchronizing game state.',
          });
        }
      };

      socket.onerror = () => {
        addToast({
          type: 'error',
          title: 'Connection Issue',
          message: 'Connection lost. Reconnecting to multiplayer server...',
          actionText: 'Retry Now',
          onAction: () => connectWebSocket(onOpen),
        });
      };

      socket.onclose = () => {
        console.log('WebSocket closed');
      };
    },
    [addToast]
  );

  const handleServerAction = useCallback(
    (action: WSServerAction) => {
      switch (action.type) {
        case 'ROOM_CREATED':
        case 'ROOM_JOINED':
          setMyPlayerId(action.payload.playerId);
          setGameState({
            ...action.payload.state,
            startedAt: Date.now(),
          });
          setActiveModal(null);
          addToast({
            type: 'success',
            title: 'Room Joined',
            message: `Connected to Room #${action.payload.roomId}`,
          });
          break;

        case 'GAME_STATE_UPDATE':
          setGameState(action.payload.state);
          break;

        case 'DICE_ROLLED':
          sounds.playDiceRoll();
          setIsRollingAnimation(true);
          setTimeout(() => {
            setIsRollingAnimation(false);
            sounds.playDiceResult(action.payload.diceValue);
          }, 400);
          break;

        case 'TOKEN_MOVED':
          if (action.payload.capturedColor) {
            sounds.playCapture();
          } else {
            sounds.playTokenStep();
          }
          break;

        case 'CHAT_MESSAGE':
          setChatMessages((prev) => [...prev, action.payload]);
          break;

        case 'EMOJI_REACTION':
          setReactions((prev) => [...prev, action.payload]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== action.payload.id));
          }, 3500);
          break;

        case 'PLAYER_DISCONNECTED':
          addToast({
            type: 'warning',
            title: 'Player Disconnected',
            message: `${action.payload.name} has left the room.`,
          });
          break;

        case 'ERROR':
          addToast({
            type: 'error',
            title: 'Notice',
            message: action.payload.message || 'Something went wrong. Please try again.',
          });
          break;
      }
    },
    [addToast]
  );

  const sendWSAction = useCallback((action: WSClientAction) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  // Offline local bot runner
  useEffect(() => {
    if (gameState.mode === 'online_multiplayer') return;
    if (gameState.status !== 'playing') return;

    const activeColor = gameState.activeColors[gameState.activeColorIndex];
    const activePlayer = gameState.players.find((p) => p.color === activeColor);

    if (!activePlayer || activePlayer.type !== 'bot' || activePlayer.hasWon) {
      return;
    }

    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    botTimerRef.current = setTimeout(() => {
      if (gameState.status !== 'playing') return;

      // Bot rolls dice
      sounds.playDiceRoll();
      setIsRollingAnimation(true);

      const rollVal = Math.floor(Math.random() * 6) + 1;

      setTimeout(() => {
        setIsRollingAnimation(false);
        sounds.playDiceResult(rollVal);

        const { newState, hasValidMoves } = applyDiceRoll(gameState, rollVal);
        setGameState(newState);

        if (hasValidMoves) {
          botTimerRef.current = setTimeout(() => {
            const bestTokenId = selectBestBotMove(newState, activePlayer, newState.validTokenMoves);
            const moveResult = applyTokenMove(newState, bestTokenId);
            if (moveResult.capturedColor) {
              sounds.playCapture();
            } else if (moveResult.reachedHome) {
              sounds.playTokenHome();
            } else {
              sounds.playTokenStep();
            }
            setGameState(moveResult.newState);
          }, 550);
        }
      }, 350);
    }, 700);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [
    gameState.activeColorIndex,
    gameState.hasRolled,
    gameState.status,
    gameState.mode,
    gameState.players,
    gameState.activeColors,
    gameState.diceValue,
  ]);

  // Turn timer countdown
  useEffect(() => {
    if (gameState.status !== 'playing' || gameState.turnTimeLimit <= 0) return;

    localTurnTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.turnTimeRemaining <= 1) {
          // Timeout: pass turn
          sounds.playButton();
          const nextIdx = (prev.activeColorIndex + 1) % prev.activeColors.length;
          return {
            ...prev,
            hasRolled: false,
            canRoll: true,
            validTokenMoves: [],
            mustSelectToken: false,
            consecutiveSixes: 0,
            activeColorIndex: nextIdx,
            turnTimeRemaining: prev.turnTimeLimit,
            lastMoveDescription: 'Turn timed out! Passed to next player.',
          };
        }
        if (prev.turnTimeRemaining <= 4) {
          sounds.playCountdownTick();
        }
        return {
          ...prev,
          turnTimeRemaining: prev.turnTimeRemaining - 1,
        };
      });
    }, 1000);

    return () => {
      if (localTurnTimerRef.current) clearInterval(localTurnTimerRef.current);
    };
  }, [gameState.status, gameState.turnTimeLimit, gameState.activeColorIndex]);

  // User Actions: Dice Roll
  const handleRollDice = () => {
    if (!gameState.canRoll || gameState.status !== 'playing') return;

    if (gameState.mode === 'online_multiplayer') {
      sendWSAction({ type: 'ROLL_DICE', payload: { roomId: gameState.roomId } });
    } else {
      sounds.playDiceRoll();
      setIsRollingAnimation(true);
      const rollVal = Math.floor(Math.random() * 6) + 1;

      setTimeout(() => {
        setIsRollingAnimation(false);
        sounds.playDiceResult(rollVal);

        const { newState, hasValidMoves } = applyDiceRoll(gameState, rollVal);
        setGameState(newState);

        // Auto move single choice if enabled in settings
        if (
          hasValidMoves &&
          settings.gameplay.autoMoveSingleChoice &&
          newState.validTokenMoves.length === 1
        ) {
          setTimeout(() => {
            handleMoveToken(newState.validTokenMoves[0], newState);
          }, 350);
        }
      }, 350);
    }
  };

  // User Actions: Token Move
  const handleMoveToken = (tokenId: number, customState?: GameState) => {
    const stateToUse = customState || gameState;
    if (!stateToUse.mustSelectToken) {
      addToast({
        type: 'warning',
        title: 'Invalid Move',
        message: 'You cannot make that move right now. Please roll first.',
      });
      return;
    }

    if (!stateToUse.validTokenMoves.includes(tokenId)) {
      addToast({
        type: 'warning',
        title: 'Illegal Move',
        message: 'This token cannot move with the current dice value.',
      });
      return;
    }

    if (stateToUse.mode === 'online_multiplayer') {
      sendWSAction({
        type: 'MOVE_TOKEN',
        payload: { roomId: stateToUse.roomId, tokenId },
      });
    } else {
      const moveResult = applyTokenMove(stateToUse, tokenId);
      if (moveResult.capturedColor) {
        sounds.playCapture();
        addToast({
          type: 'info',
          title: 'Capture!',
          message: `Captured ${moveResult.capturedColor.toUpperCase()} token! Earned an extra turn!`,
        });
      } else if (moveResult.reachedHome) {
        sounds.playTokenHome();
      } else {
        sounds.playTokenStep();
      }
      setGameState(moveResult.newState);
    }
  };

  // Start Local Game
  const handleStartLocalGame = (
    mode: 'local_pass_play' | 'local_vs_bot',
    configs: {
      name: string;
      avatar: string;
      color: PlayerColor;
      type: 'human' | 'bot';
      botDifficulty?: 'easy' | 'medium' | 'hard';
    }[]
  ) => {
    sounds.playButton();
    const players: Player[] = configs.map((c, idx) =>
      createInitialPlayer(
        `p_${c.color}`,
        c.name,
        c.avatar,
        c.color,
        c.type,
        c.botDifficulty || 'medium',
        idx === 0
      )
    );

    const initial = createInitialGameState('LOCAL', mode, players, 30);
    initial.startedAt = Date.now();
    setGameState(initial);
    setActiveModal(null);
  };

  // Online Multiplayer Room Handlers
  const handleCreateOnlineRoom = (
    hostName: string,
    avatar: string,
    color: PlayerColor,
    turnTimeLimit: number,
    withBots: boolean,
    isCompetitive: boolean = true
  ) => {
    sounds.playButton();
    connectWebSocket((socket) => {
      socket.send(
        JSON.stringify({
          type: 'CREATE_ROOM',
          payload: {
            hostName,
            avatar,
            color,
            maxPlayers: 4,
            turnTimeLimit,
            withBots,
            isCompetitive,
          },
        })
      );
    });
  };

  const handleJoinOnlineRoom = (
    roomId: string,
    playerName: string,
    avatar: string,
    color?: PlayerColor
  ) => {
    sounds.playButton();
    connectWebSocket((socket) => {
      socket.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          payload: {
            roomId: roomId.trim().toUpperCase(),
            playerName,
            avatar,
            preferredColor: color,
          },
        })
      );
    });
  };

  // Social & Friend Actions
  const handleSendFriendRequest = (userName: string) => {
    const newReq: FriendRequest = {
      id: `req_${Date.now()}`,
      senderId: `u_${Date.now()}`,
      senderName: userName,
      senderAvatar: '🎯',
      rating: 1200,
      timestamp: Date.now(),
    };
    setPendingRequests((prev) => [...prev, newReq]);
    addToast({
      type: 'success',
      title: 'Request Sent',
      message: `Friend request sent to ${userName}!`,
    });
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    const req = pendingRequests.find((r) => r.id === requestId);
    if (!req) return;

    const newFriend: Friend = {
      id: req.senderId,
      name: req.senderName,
      avatar: req.senderAvatar,
      status: 'online',
      rating: req.rating,
      favoriteColor: 'green',
    };

    setFriends((prev) => [...prev, newFriend]);
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    addToast({
      type: 'success',
      title: 'Friend Added',
      message: `You and ${req.senderName} are now friends!`,
    });
  };

  const handleRejectFriendRequest = (requestId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleRemoveFriend = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  const handleInviteFriendToGame = (friend: Friend) => {
    // Generate private room code
    const generatedRoom = `LUDO_${Math.floor(1000 + Math.random() * 9000)}`;
    handleCreateOnlineRoom(profile.name, profile.avatar, profile.preferredColor, 30, true, true);
    addToast({
      type: 'success',
      title: 'Invitation Sent',
      message: `Invited ${friend.name} to private match #${generatedRoom}!`,
    });
  };

  // Notifications Actions
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationAction = (notification: NotificationItem) => {
    if (notification.type === 'reward' && notification.actionData?.rewardXp) {
      setStats((prev) => ({
        ...prev,
        currentXp: prev.currentXp + notification.actionData!.rewardXp!,
      }));
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      addToast({
        type: 'success',
        title: 'Reward Claimed',
        message: `Claimed +${notification.actionData.rewardXp} XP!`,
      });
    }
  };

  // Chat & Emoji Reactions
  const handleSendChat = (text: string) => {
    if (!text.trim()) return;
    if (gameState.mode === 'online_multiplayer') {
      sendWSAction({
        type: 'SEND_CHAT',
        payload: { roomId: gameState.roomId, text },
      });
    } else {
      const activeColor = gameState.activeColors[gameState.activeColorIndex];
      const activePlayer = gameState.players.find((p) => p.color === activeColor);
      const newMsg: ChatMessage = {
        id: `chat_${Date.now()}`,
        senderId: 'local_user',
        senderName: profile.name,
        senderColor: activePlayer?.color || 'red',
        text,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, newMsg]);
    }
  };

  const handleSendEmoji = (emoji: string) => {
    if (gameState.mode === 'online_multiplayer') {
      sendWSAction({
        type: 'SEND_EMOJI',
        payload: { roomId: gameState.roomId, emoji },
      });
    } else {
      const activeColor = gameState.activeColors[gameState.activeColorIndex];
      const activePlayer = gameState.players.find((p) => p.color === activeColor);
      const newReaction: FloatingReaction = {
        id: `rx_${Date.now()}`,
        emoji,
        senderName: profile.name,
        senderColor: activePlayer?.color || 'red',
        x: 40 + Math.random() * 20,
        y: 40 + Math.random() * 20,
      };
      setReactions((prev) => [...prev, newReaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 3500);
    }
  };

  return {
    profile,
    setProfile,
    settings,
    setSettings,
    stats,
    history,
    friends,
    pendingRequests,
    notifications,
    leaderboard,
    toasts,
    dismissToast,
    addToast,
    activeModal,
    setActiveModal,
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    reactions,
    draggedTokenId,
    hoveredTokenId,
    setDraggedTokenId,
    setHoveredTokenId,
    isRollingAnimation,
    myPlayerId,
    gameState,
    handleRollDice,
    handleMoveToken,
    handleStartLocalGame,
    handleCreateOnlineRoom,
    handleJoinOnlineRoom,
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleRemoveFriend,
    handleInviteFriendToGame,
    handleMarkAllNotificationsRead,
    handleClearAllNotifications,
    handleNotificationAction,
    handleSendChat,
    handleSendEmoji,
  };
}
