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
import { DiceSkin, calculatePrizePool, getServiceFee } from '../types/platform';
import {
  createInitialGameState,
  createInitialPlayer,
  getOppositeColor,
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
const STORAGE_KEY_DICE_SKIN = 'ludo_user_dice_skin';

export interface UserProfile {
  name: string;
  avatar: string;
  preferredColor: PlayerColor;
  rating: number;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'player',
  avatar: '👑',
  preferredColor: 'red',
  rating: 1200,
};

const DEFAULT_SETTINGS: UserSettings = {
  gameplay: {
    animationSpeed: 'normal',
    autoMoveSingleChoice: false,
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
  totalGames: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  totalCaptures: 0,
  gamesAbandoned: 0,
  currentRating: 1200,
  highestRating: 1200,
  currentLevel: 1,
  currentXp: 0,
  nextLevelXp: 500,
  favoriteGameMode: 'online_multiplayer',
  recentForm: [],
};

const DEFAULT_FRIENDS: Friend[] = [];
const DEFAULT_HISTORY: MatchHistoryItem[] = [];
const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [];

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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedDiceSkin, setSelectedDiceSkin] = useState<DiceSkin>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DICE_SKIN);
      return (saved as DiceSkin) || 'classic_ivory';
    } catch {
      return 'classic_ivory';
    }
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeModal, setActiveModal] = useState<
    | 'lobby'
    | 'settings'
    | 'friends'
    | 'stats'
    | 'history'
    | 'leaderboard'
    | 'notifications'
    | 'rules'
    | 'wallet'
    | 'auth'
    | 'admin'
    | null
  >(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [draggedTokenId, setDraggedTokenId] = useState<number | null>(null);
  const [hoveredTokenId, setHoveredTokenId] = useState<number | null>(null);
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string>('local_host');

  // Consecutive misses tracker for the 2-strike 15s/20s kick rule
  const playerMissesRef = useRef<Record<string, number>>({});

  // Active Game State (Default 15s turn limit)
  const [gameState, setGameState] = useState<GameState>(() => {
    const p1 = createInitialPlayer('p_red', profile.name, profile.avatar, 'red', 'human', undefined, true);
    const p2 = createInitialPlayer('p_yellow', 'mukasa', '🦁', 'yellow', 'bot', 'medium');
    const init = createInitialGameState('LOCAL', 'local_pass_play', [p1, p2], 15);
    init.status = 'lobby';
    return init;
  });

  const wsRef = useRef<WebSocket | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localTurnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMatchRecordedRef = useRef(false);

  // Sync profile & storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DICE_SKIN, selectedDiceSkin);
    } catch {}
  }, [selectedDiceSkin]);

  // Online / Offline connectivity listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast({
        type: 'success',
        title: 'Connection Restored',
        message: 'You are back online and connected to Ludo Arena!',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        type: 'error',
        title: 'No Internet Connection',
        message: 'Connection lost. Please check your mobile data or Wi-Fi.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const sendWSAction = useCallback((action: WSClientAction) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  // Connect WebSocket helper
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
            message: 'Multiplayer synchronization error.',
          });
        }
      };

      socket.onerror = () => {
        addToast({
          type: 'error',
          title: 'Connection Issue',
          message: 'Connection lost. Reconnecting...',
          actionText: 'Retry Now',
          onAction: () => connectWebSocket(onOpen),
        });
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
          }, 450);
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
            title: 'Player Left',
            message: `${action.payload.name} disconnected from the match.`,
          });
          break;

        case 'ERROR':
          addToast({
            type: 'error',
            title: 'Game Error',
            message: action.payload.message,
          });
          break;
      }
    },
    [addToast]
  );

  // Bot Turn Automation
  useEffect(() => {
    if (gameState.status !== 'playing' || gameState.mode === 'online_multiplayer') return;

    const curColor = gameState.activeColors[gameState.activeColorIndex];
    const curPlayer = gameState.players.find((p) => p.color === curColor);

    if (!curPlayer || curPlayer.type !== 'bot') return;

    // Step 1: Bot needs to roll
    if (gameState.canRoll && !gameState.hasRolled) {
      botTimerRef.current = setTimeout(() => {
        sounds.playDiceRoll();
        setIsRollingAnimation(true);
        const rollVal = Math.floor(Math.random() * 6) + 1;

        setTimeout(() => {
          setIsRollingAnimation(false);
          sounds.playDiceResult(rollVal);

          const { newState } = applyDiceRoll(gameState, rollVal);
          setGameState(newState);
        }, 350);
      }, 650);

      return () => {
        if (botTimerRef.current) clearTimeout(botTimerRef.current);
      };
    }

    // Step 2: Bot needs to select and move a token
    if (gameState.hasRolled && gameState.mustSelectToken && gameState.validTokenMoves.length > 0) {
      botTimerRef.current = setTimeout(() => {
        setGameState((prev) => {
          if (prev.status !== 'playing') return prev;
          const activeC = prev.activeColors[prev.activeColorIndex];
          const activeP = prev.players.find((p) => p.color === activeC);
          if (!activeP || activeP.type !== 'bot') return prev;

          if (!prev.mustSelectToken || prev.validTokenMoves.length === 0) return prev;

          const bestTokenId = selectBestBotMove(prev, activeP, prev.validTokenMoves);
          const moveResult = applyTokenMove(prev, bestTokenId);

          if (moveResult.capturedColor) {
            sounds.playCapture();
          } else if (moveResult.reachedHome) {
            sounds.playTokenHome();
          } else {
            sounds.playTokenStep();
          }

          return moveResult.newState;
        });
      }, 550);

      return () => {
        if (botTimerRef.current) clearTimeout(botTimerRef.current);
      };
    }
  }, [
    gameState.activeColorIndex,
    gameState.hasRolled,
    gameState.mustSelectToken,
    gameState.canRoll,
    gameState.validTokenMoves,
    gameState.status,
    gameState.mode,
  ]);

  // Turn timer countdown with 15s (1st miss) / 20s (2nd miss kick) logic
  useEffect(() => {
    if (gameState.status !== 'playing') return;

    localTurnTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.status !== 'playing') return prev;

        const curColor = prev.activeColors[prev.activeColorIndex];
        const curPlayer = prev.players.find((p) => p.color === curColor);
        const curMisses = playerMissesRef.current[curColor] || 0;

        // When time expires
        if (prev.turnTimeRemaining <= 1) {
          sounds.playButton();
          const newMisses = curMisses + 1;
          playerMissesRef.current[curColor] = newMisses;

          // Second Consecutive Miss -> Kick Player!
          if (newMisses >= 2) {
            addToast({
              type: 'error',
              title: 'Player Kicked!',
              message: `⚠️ ${curPlayer?.name || 'Player'} was kicked for missing 2 consecutive turns! Stake forfeited and distributed to remaining players.`,
            });

            // Remove or eliminate kicked player from active match
            const remainingColors = prev.activeColors.filter((c) => c !== curColor);
            if (remainingColors.length <= 1) {
              // Remaining player wins automatically!
              const winnerC = remainingColors[0] || 'red';
              sounds.playVictory();
              return {
                ...prev,
                status: 'finished',
                winnerOrder: [winnerC],
                lastMoveDescription: `${curPlayer?.name || 'Player'} forfeited! Match concluded.`,
              };
            }

            const nextIndex = prev.activeColorIndex % remainingColors.length;
            const nextColor = remainingColors[nextIndex];
            const nextMisses = playerMissesRef.current[nextColor] || 0;
            const nextTurnLimit = nextMisses === 1 ? 20 : 15;

            return {
              ...prev,
              activeColors: remainingColors,
              activeColorIndex: nextIndex,
              hasRolled: false,
              canRoll: true,
              validTokenMoves: [],
              mustSelectToken: false,
              consecutiveSixes: 0,
              turnTimeLimit: nextTurnLimit,
              turnTimeRemaining: nextTurnLimit,
              lastMoveDescription: `${curPlayer?.name} was kicked for inactivity.`,
            };
          } else {
            // First Miss (Strike 1) -> Pass turn with warning
            addToast({
              type: 'warning',
              title: 'Turn Missed (Strike 1)',
              message: `⚠️ ${curPlayer?.name || 'Player'} timed out (15s limit). Final warning: 20s timer on next turn before forfeiture!`,
            });

            const nextIdx = (prev.activeColorIndex + 1) % prev.activeColors.length;
            const nextColor = prev.activeColors[nextIdx];
            const nextMisses = playerMissesRef.current[nextColor] || 0;
            const nextTurnLimit = nextMisses === 1 ? 20 : 15;

            return {
              ...prev,
              hasRolled: false,
              canRoll: true,
              validTokenMoves: [],
              mustSelectToken: false,
              consecutiveSixes: 0,
              activeColorIndex: nextIdx,
              turnTimeLimit: nextTurnLimit,
              turnTimeRemaining: nextTurnLimit,
              lastMoveDescription: `${curPlayer?.name} timed out. Turn passed.`,
            };
          }
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
  }, [gameState.status, gameState.activeColorIndex, addToast]);

  // Dice Roll
  const handleRollDice = () => {
    if (!gameState.canRoll || gameState.status !== 'playing') return;

    // Reset current player's misses on successful active play
    const curColor = gameState.activeColors[gameState.activeColorIndex];
    playerMissesRef.current[curColor] = 0;

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

  // Token Move
  const handleMoveToken = (tokenId: number, customState?: GameState) => {
    const stateToUse = customState || gameState;
    if (!stateToUse.mustSelectToken) {
      addToast({
        type: 'warning',
        title: 'Invalid Move',
        message: 'Please roll the dice first.',
      });
      return;
    }

    if (!stateToUse.validTokenMoves.includes(tokenId)) {
      addToast({
        type: 'warning',
        title: 'Illegal Move',
        message: 'This token cannot make that move.',
      });
      return;
    }

    // Reset current player's misses
    const curColor = stateToUse.activeColors[stateToUse.activeColorIndex];
    playerMissesRef.current[curColor] = 0;

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
          title: 'Token Captured!',
          message: `Captured ${moveResult.capturedColor.toUpperCase()} token! Bonus turn awarded!`,
        });
      } else if (moveResult.reachedHome) {
        sounds.playTokenHome();
      } else {
        sounds.playTokenStep();
      }
      setGameState(moveResult.newState);
    }
  };

  // Start Stake Game (2P, 3P, 4P with specific stake and 15s turn limit)
  const handleStartStakeGame = (
    stakeUGX: number,
    playerCount: 2 | 3 | 4,
    diceSkin: DiceSkin
  ) => {
    sounds.playButton();
    playerMissesRef.current = {};
    setSelectedDiceSkin(diceSkin);

    const humanPlayer = createInitialPlayer(
      'p_red',
      profile.name.toLowerCase().replace(/[^a-z]/g, '') || 'player',
      profile.avatar,
      'red',
      'human',
      undefined,
      true
    );

    const contenderNames = ['mukasa', 'namubiru', 'okello', 'tendo'];
    const contenderAvatars = ['🦁', '⚡', '👑', '🎯'];

    let players: Player[] = [humanPlayer];

    if (playerCount === 2) {
      // 1v1 Duel on opposite side (Red vs Yellow)
      const p2 = createInitialPlayer(
        'p_yellow',
        contenderNames[0],
        contenderAvatars[0],
        'yellow',
        'bot',
        'medium'
      );
      players.push(p2);
    } else if (playerCount === 3) {
      const p2 = createInitialPlayer(
        'p_green',
        contenderNames[0],
        contenderAvatars[0],
        'green',
        'bot',
        'medium'
      );
      const p3 = createInitialPlayer(
        'p_yellow',
        contenderNames[1],
        contenderAvatars[1],
        'yellow',
        'bot',
        'medium'
      );
      players.push(p2, p3);
    } else {
      const p2 = createInitialPlayer(
        'p_green',
        contenderNames[0],
        contenderAvatars[0],
        'green',
        'bot',
        'medium'
      );
      const p3 = createInitialPlayer(
        'p_yellow',
        contenderNames[1],
        contenderAvatars[1],
        'yellow',
        'bot',
        'medium'
      );
      const p4 = createInitialPlayer(
        'p_blue',
        contenderNames[2],
        contenderAvatars[2],
        'blue',
        'bot',
        'medium'
      );
      players.push(p2, p3, p4);
    }

    const initial = createInitialGameState('LOCAL', 'local_pass_play', players, 15);
    initial.startedAt = Date.now();
    initial.status = 'playing';
    initial.lastMoveDescription = `Challenge Started! Stake: UGX ${stakeUGX.toLocaleString()} (${playerCount}P)`;

    setGameState(initial);
    setActiveModal(null);

    const prizeCalc = calculatePrizePool(stakeUGX, playerCount);
    addToast({
      type: 'success',
      title: 'Match Commenced!',
      message: `Stake: UGX ${stakeUGX.toLocaleString()} • Winner Prize: UGX ${prizeCalc.winnerPrize.toLocaleString()} (15s Turn Timer)`,
    });
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
    playerMissesRef.current = {};

    let adjustedConfigs = [...configs];
    if (adjustedConfigs.length === 2) {
      const p1Color = adjustedConfigs[0].color;
      const oppColor = getOppositeColor(p1Color);
      adjustedConfigs[1] = {
        ...adjustedConfigs[1],
        color: oppColor,
      };
    }

    const players: Player[] = adjustedConfigs.map((c, idx) =>
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

    const initial = createInitialGameState('LOCAL', mode, players, 15);
    initial.startedAt = Date.now();
    initial.status = 'playing';
    setGameState(initial);
    setActiveModal(null);
  };

  // Online Multiplayer Room Handlers
  const handleCreateOnlineRoom = (
    hostName: string,
    avatar: string,
    color: PlayerColor,
    turnTimeLimit: number = 15,
    withBots: boolean = true
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
            turnTimeLimit: 15,
            withBots,
            isCompetitive: true,
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
    handleCreateOnlineRoom(profile.name, profile.avatar, profile.preferredColor, 15, true);
    addToast({
      type: 'success',
      title: 'Invitation Sent',
      message: `Invited ${friend.name} to private match!`,
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

  const handleExitToLobby = () => {
    sounds.playButton();
    setGameState((prev) => ({
      ...prev,
      status: 'lobby',
    }));
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
    isOnline,
    selectedDiceSkin,
    setSelectedDiceSkin,
    handleRollDice,
    handleMoveToken,
    handleStartStakeGame,
    handleStartLocalGame,
    handleCreateOnlineRoom,
    handleJoinOnlineRoom,
    handleExitToLobby,
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
