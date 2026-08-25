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
} from '../types';
import {
  createInitialGameState,
  createInitialPlayer,
  applyDiceRoll,
  applyTokenMove,
  getValidTokenMoves,
  selectBestBotMove,
} from '../utils/ludoEngine';
import { sounds } from '../utils/audio';

const STORAGE_KEY_USER = 'ludo_user_profile';
const STORAGE_KEY_THEME = 'ludo_board_theme';

export interface UserProfile {
  name: string;
  avatar: string;
  preferredColor: PlayerColor;
}

const DEFAULT_PROFILE: UserProfile = {
  name: `Player_${Math.floor(1000 + Math.random() * 9000)}`,
  avatar: '👑',
  preferredColor: 'red',
};

export function useLudoGame() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [theme, setTheme] = useState<BoardTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      return (saved as BoardTheme) || 'classic_wood';
    } catch {
      return 'classic_wood';
    }
  });

  const [soundMuted, setSoundMuted] = useState(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(true);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
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

  // Save profile & theme
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    sounds.setMuted(soundMuted);
  }, [soundMuted]);

  // Handle Confetti on Win
  useEffect(() => {
    if (gameState.status === 'finished' || (gameState.winnerOrder && gameState.winnerOrder.length > 0)) {
      sounds.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [gameState.status, gameState.winnerOrder.length]);

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
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      socket.onclose = () => {
        console.log('WebSocket closed');
      };
    },
    []
  );

  const handleServerAction = useCallback(
    (action: WSServerAction) => {
      switch (action.type) {
        case 'ROOM_CREATED':
        case 'ROOM_JOINED':
          setMyPlayerId(action.payload.playerId);
          setGameState(action.payload.state);
          setIsLobbyOpen(false);
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

        case 'ERROR':
          alert(action.payload.message);
          break;
      }
    },
    []
  );

  // Send WS message helper
  const sendWSAction = useCallback((action: WSClientAction) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  // Offline local bot turn runner
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
          }, 650);
        }
      }, 450);
    }, 850);

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
  ]);

  // Offline Turn Countdown Timer
  useEffect(() => {
    if (gameState.mode === 'online_multiplayer') return;
    if (gameState.status !== 'playing' || gameState.turnTimeLimit <= 0) return;

    if (localTurnTimerRef.current) clearInterval(localTurnTimerRef.current);

    localTurnTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.status !== 'playing') return prev;
        if (prev.turnTimeRemaining <= 1) {
          // Timeout! Auto-roll or pass
          const activeColor = prev.activeColors[prev.activeColorIndex];
          const activePlayer = prev.players.find((p) => p.color === activeColor);
          if (!activePlayer) return prev;

          if (!prev.hasRolled) {
            const rollVal = Math.floor(Math.random() * 6) + 1;
            const { newState, hasValidMoves } = applyDiceRoll(prev, rollVal);
            if (hasValidMoves && newState.validTokenMoves.length > 0) {
              const bestTokenId = selectBestBotMove(newState, activePlayer, newState.validTokenMoves);
              const moveResult = applyTokenMove(newState, bestTokenId);
              return moveResult.newState;
            }
            return newState;
          } else if (prev.mustSelectToken && prev.validTokenMoves.length > 0) {
            const bestTokenId = selectBestBotMove(prev, activePlayer, prev.validTokenMoves);
            const moveResult = applyTokenMove(prev, bestTokenId);
            return moveResult.newState;
          }
          return prev;
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
  }, [gameState.mode, gameState.activeColorIndex, gameState.hasRolled, gameState.status, gameState.turnTimeLimit]);

  // Roll Dice Trigger
  const handleRollDice = useCallback(() => {
    const activeColor = gameState.activeColors[gameState.activeColorIndex];
    const activePlayer = gameState.players.find((p) => p.color === activeColor);

    if (!gameState.canRoll || !activePlayer) return;

    if (gameState.mode === 'online_multiplayer') {
      if (activePlayer.id !== myPlayerId) return; // Not your turn
      sendWSAction({
        type: 'ROLL_DICE',
        payload: { roomId: gameState.roomId },
      });
      return;
    }

    // Local roll
    sounds.playDiceRoll();
    setIsRollingAnimation(true);
    const diceVal = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setIsRollingAnimation(false);
      sounds.playDiceResult(diceVal);

      const { newState, hasValidMoves } = applyDiceRoll(gameState, diceVal);
      setGameState(newState);

      // Auto move if only 1 valid move and it's a human player
      if (hasValidMoves && newState.validTokenMoves.length === 1 && activePlayer.type === 'human') {
        setTimeout(() => {
          handleMoveToken(newState.validTokenMoves[0], newState);
        }, 500);
      }
    }, 450);
  }, [gameState, myPlayerId, sendWSAction]);

  // Move Token Trigger
  const handleMoveToken = useCallback(
    (tokenId: number, overrideState?: GameState) => {
      const currentState = overrideState || gameState;
      const activeColor = currentState.activeColors[currentState.activeColorIndex];
      const activePlayer = currentState.players.find((p) => p.color === activeColor);

      if (!currentState.mustSelectToken || !activePlayer) return;
      if (!currentState.validTokenMoves.includes(tokenId)) return;

      if (currentState.mode === 'online_multiplayer') {
        if (activePlayer.id !== myPlayerId) return;
        sendWSAction({
          type: 'MOVE_TOKEN',
          payload: { roomId: currentState.roomId, tokenId },
        });
        return;
      }

      // Local move
      const moveResult = applyTokenMove(currentState, tokenId);
      if (moveResult.capturedColor) {
        sounds.playCapture();
      } else if (moveResult.reachedHome) {
        sounds.playTokenHome();
      } else {
        sounds.playTokenStep();
      }
      setGameState(moveResult.newState);
      setDraggedTokenId(null);
      setHoveredTokenId(null);
    },
    [gameState, myPlayerId, sendWSAction]
  );

  // Start Offline Game
  const startLocalGame = useCallback(
    (mode: 'local_pass_play' | 'local_vs_bot', playerConfigs: { name: string; avatar: string; color: PlayerColor; type: 'human' | 'bot'; botDifficulty?: 'easy' | 'medium' | 'hard' }[]) => {
      const players: Player[] = playerConfigs.map((cfg, idx) =>
        createInitialPlayer(`local_p${idx + 1}`, cfg.name, cfg.avatar, cfg.color, cfg.type, cfg.botDifficulty || 'medium', idx === 0)
      );
      const newState = createInitialGameState('LOCAL', mode, players, 30);
      setGameState(newState);
      setMyPlayerId('local_p1');
      setIsLobbyOpen(false);
      sounds.playTurnNotification();
    },
    []
  );

  // Online Multiplayer Actions
  const createOnlineRoom = useCallback(
    (hostName: string, avatar: string, color: PlayerColor, turnTimeLimit: number, withBots: boolean) => {
      connectWebSocket((ws) => {
        ws.send(
          JSON.stringify({
            type: 'CREATE_ROOM',
            payload: { hostName, avatar, color, maxPlayers: 4, turnTimeLimit, withBots },
          })
        );
      });
    },
    [connectWebSocket]
  );

  const joinOnlineRoom = useCallback(
    (roomId: string, playerName: string, avatar: string, preferredColor?: PlayerColor) => {
      connectWebSocket((ws) => {
        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            payload: { roomId, playerName, avatar, preferredColor },
          })
        );
      });
    },
    [connectWebSocket]
  );

  const startOnlineGame = useCallback(() => {
    sendWSAction({
      type: 'START_GAME',
      payload: { roomId: gameState.roomId },
    });
  }, [gameState.roomId, sendWSAction]);

  const addBotToRoom = useCallback(
    (color: PlayerColor, difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
      sendWSAction({
        type: 'ADD_BOT',
        payload: { roomId: gameState.roomId, color, difficulty },
      });
    },
    [gameState.roomId, sendWSAction]
  );

  const removeBotFromRoom = useCallback(
    (color: PlayerColor) => {
      sendWSAction({
        type: 'REMOVE_BOT',
        payload: { roomId: gameState.roomId, color },
      });
    },
    [gameState.roomId, sendWSAction]
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      if (gameState.mode === 'online_multiplayer') {
        sendWSAction({
          type: 'SEND_CHAT',
          payload: { roomId: gameState.roomId, text },
        });
      } else {
        const activeColor = gameState.activeColors[gameState.activeColorIndex];
        const sender = gameState.players.find((p) => p.color === activeColor);
        const msg: ChatMessage = {
          id: `msg_${Date.now()}`,
          senderId: 'local',
          senderName: sender?.name || profile.name,
          senderColor: sender?.color || 'red',
          text,
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, msg]);
      }
    },
    [gameState, profile.name, sendWSAction]
  );

  const sendEmojiReaction = useCallback(
    (emoji: string) => {
      if (gameState.mode === 'online_multiplayer') {
        sendWSAction({
          type: 'SEND_EMOJI',
          payload: { roomId: gameState.roomId, emoji },
        });
      } else {
        const activeColor = gameState.activeColors[gameState.activeColorIndex];
        const sender = gameState.players.find((p) => p.color === activeColor);
        const reaction: FloatingReaction = {
          id: `react_${Date.now()}_${Math.random()}`,
          emoji,
          senderName: sender?.name || profile.name,
          senderColor: sender?.color || 'red',
          x: 20 + Math.random() * 60,
          y: 30 + Math.random() * 40,
        };
        setReactions((prev) => [...prev, reaction]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
        }, 3500);
      }
    },
    [gameState, profile.name, sendWSAction]
  );

  const restartGame = useCallback(() => {
    if (gameState.mode === 'online_multiplayer') {
      sendWSAction({
        type: 'RESTART_GAME',
        payload: { roomId: gameState.roomId },
      });
    } else {
      const resetPlayers = gameState.players.map((p) => ({
        ...p,
        tokens: p.tokens.map((t) => ({
          ...t,
          state: 'YARD' as const,
          step: -1,
          trackIndex: -1,
        })),
        hasWon: false,
        rank: undefined,
        consecutiveSixes: 0,
      }));
      setGameState(createInitialGameState('LOCAL', gameState.mode, resetPlayers, gameState.turnTimeLimit));
    }
  }, [gameState, sendWSAction]);

  const leaveGame = useCallback(() => {
    if (gameState.mode === 'online_multiplayer') {
      sendWSAction({
        type: 'LEAVE_ROOM',
        payload: { roomId: gameState.roomId },
      });
    }
    setIsLobbyOpen(true);
  }, [gameState, sendWSAction]);

  return {
    gameState,
    profile,
    setProfile,
    theme,
    setTheme,
    soundMuted,
    setSoundMuted,
    isLobbyOpen,
    setIsLobbyOpen,
    isRulesOpen,
    setIsRulesOpen,
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    reactions,
    myPlayerId,
    draggedTokenId,
    setDraggedTokenId,
    hoveredTokenId,
    setHoveredTokenId,
    isRollingAnimation,
    handleRollDice,
    handleMoveToken,
    startLocalGame,
    createOnlineRoom,
    joinOnlineRoom,
    startOnlineGame,
    addBotToRoom,
    removeBotFromRoom,
    sendChatMessage,
    sendEmojiReaction,
    restartGame,
    leaveGame,
  };
}
