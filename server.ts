import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/api.js';

import {
  GameState,
  Player,
  PlayerColor,
  WSClientAction,
  WSServerAction,
  ChatMessage,
  FloatingReaction,
} from './src/types.js';
import {
  createInitialGameState,
  createInitialPlayer,
  createDefaultTokens,
  getOppositeColor,
  applyDiceRoll,
  applyTokenMove,
  selectBestBotMove,
  getNextActiveColorIndex,
} from './src/utils/ludoEngine.js';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId?: string;
}

interface ServerRoom {
  id: string;
  state: GameState;
  hostPlayerId: string;
  clients: Map<string, WebSocket>; // playerId -> WebSocket
  chatHistory: ChatMessage[];
  timerInterval?: NodeJS.Timeout;
  botTimeout?: NodeJS.Timeout;
  playerMisses?: Record<string, number>;
}

const rooms = new Map<string, ServerRoom>();
const clients = new Map<WebSocket, ClientConnection>();

const ALL_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToRoom(room: ServerRoom, action: WSServerAction) {
  const msg = JSON.stringify(action);
  room.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function sendToClient(ws: WebSocket, action: WSServerAction) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(action));
  }
}

function getAvailableColor(existingPlayers: Player[], preferred?: PlayerColor, is2Player: boolean = false): PlayerColor {
  const taken = new Set(existingPlayers.map((p) => p.color));
  if (is2Player && existingPlayers.length === 1) {
    return getOppositeColor(existingPlayers[0].color);
  }
  if (preferred && !taken.has(preferred)) {
    return preferred;
  }
  if (existingPlayers.length === 1) {
    const opp = getOppositeColor(existingPlayers[0].color);
    if (!taken.has(opp)) return opp;
  }
  return ALL_COLORS.find((c) => !taken.has(c)) || 'red';
}

function startRoomTimer(room: ServerRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
  }

  if (room.state.turnTimeLimit <= 0) return;

  room.timerInterval = setInterval(() => {
    if (room.state.status !== 'playing') {
      if (room.timerInterval) clearInterval(room.timerInterval);
      return;
    }

    room.state.turnTimeRemaining -= 1;

    if (room.state.turnTimeRemaining <= 0) {
      // Turn timeout! Force action
      handleTurnTimeout(room);
    } else {
      broadcastToRoom(room, {
        type: 'GAME_STATE_UPDATE',
        payload: { state: room.state },
      });
    }
  }, 1000);
}

function handleTurnTimeout(room: ServerRoom) {
  if (room.state.status !== 'playing') return;

  const activeColor = room.state.activeColors[room.state.activeColorIndex];
  const activePlayer = room.state.players.find((p) => p.color === activeColor);
  if (!activePlayer) return;

  if (!room.playerMisses) {
    room.playerMisses = {};
  }

  const curMisses = (room.playerMisses[activeColor] || 0) + 1;
  room.playerMisses[activeColor] = curMisses;

  // 2nd Miss -> Kick Player, remove their pieces from the board, and let the rest commence!
  if (curMisses >= 2) {
    const kickedName = activePlayer.name;

    // Remove kicked player's pieces from board
    activePlayer.tokens = activePlayer.tokens.map((t) => ({
      ...t,
      state: 'YARD' as const,
      step: -1,
      trackIndex: -1,
    }));
    activePlayer.isConnected = false;

    const remainingColors = room.state.activeColors.filter((c) => c !== activeColor);

    if (remainingColors.length <= 1) {
      // Remaining player wins!
      const winnerC = remainingColors[0] || 'red';
      room.state.status = 'finished';
      room.state.winnerOrder = [winnerC];
      room.state.lastMoveDescription = `${kickedName} was kicked for missing 2 consecutive turns! Match finished.`;

      broadcastToRoom(room, {
        type: 'GAME_STATE_UPDATE',
        payload: { state: room.state },
      });
      return;
    }

    const nextIndex = room.state.activeColorIndex % remainingColors.length;
    const nextColor = remainingColors[nextIndex];
    const nextMisses = room.playerMisses[nextColor] || 0;
    const nextTurnLimit = nextMisses === 1 ? 20 : (room.state.turnTimeLimit || 15);

    room.state = {
      ...room.state,
      activeColors: remainingColors,
      activeColorIndex: nextIndex,
      hasRolled: false,
      canRoll: true,
      validTokenMoves: [],
      mustSelectToken: false,
      consecutiveSixes: 0,
      turnTimeLimit: nextTurnLimit,
      turnTimeRemaining: nextTurnLimit,
      lastMoveDescription: `${kickedName} was kicked for inactivity. Their pieces were removed. Match continues!`,
    };

    broadcastToRoom(room, {
      type: 'GAME_STATE_UPDATE',
      payload: { state: room.state },
    });

    checkBotTurn(room);
  } else {
    // 1st Miss (Strike 1) -> Pass turn to next player without auto-playing
    const nextIdx = (room.state.activeColorIndex + 1) % room.state.activeColors.length;
    const nextColor = room.state.activeColors[nextIdx];
    const nextMisses = room.playerMisses[nextColor] || 0;
    const nextTurnLimit = nextMisses === 1 ? 20 : (room.state.turnTimeLimit || 15);

    room.state = {
      ...room.state,
      hasRolled: false,
      canRoll: true,
      validTokenMoves: [],
      mustSelectToken: false,
      consecutiveSixes: 0,
      activeColorIndex: nextIdx,
      turnTimeLimit: nextTurnLimit,
      turnTimeRemaining: nextTurnLimit,
      lastMoveDescription: `${activePlayer.name} timed out. Turn passed to next player.`,
    };

    broadcastToRoom(room, {
      type: 'GAME_STATE_UPDATE',
      payload: { state: room.state },
    });

    checkBotTurn(room);
  }
}

function checkBotTurn(room: ServerRoom) {
  if (room.state.status !== 'playing') return;

  const activeColor = room.state.activeColors[room.state.activeColorIndex];
  const activePlayer = room.state.players.find((p) => p.color === activeColor);

  if (!activePlayer || activePlayer.type !== 'bot' || activePlayer.hasWon) {
    return;
  }

  if (room.botTimeout) clearTimeout(room.botTimeout);

  room.botTimeout = setTimeout(() => {
    if (room.state.status !== 'playing') return;

    // Bot rolls the dice
    const diceVal = Math.floor(Math.random() * 6) + 1;
    const { newState, hasValidMoves } = applyDiceRoll(room.state, diceVal);
    room.state = newState;

    broadcastToRoom(room, {
      type: 'DICE_ROLLED',
      payload: {
        diceValue: diceVal,
        playerColor: activeColor,
        consecutiveSixes: newState.consecutiveSixes,
      },
    });
    broadcastToRoom(room, {
      type: 'GAME_STATE_UPDATE',
      payload: { state: room.state },
    });

    if (hasValidMoves) {
      room.botTimeout = setTimeout(() => {
        if (room.state.status !== 'playing') return;
        const bestTokenId = selectBestBotMove(
          room.state,
          activePlayer,
          room.state.validTokenMoves
        );
        executeRoomMove(room, bestTokenId);
      }, 700);
    } else {
      checkBotTurn(room);
    }
  }, 900);
}

function executeRoomMove(room: ServerRoom, tokenId: number) {
  const activeColor = room.state.activeColors[room.state.activeColorIndex];
  const activePlayer = room.state.players.find((p) => p.color === activeColor);
  const fromToken = activePlayer?.tokens.find((t) => t.id === tokenId);
  const fromStep = fromToken?.step ?? -1;

  const { newState, capturedColor } = applyTokenMove(room.state, tokenId);
  room.state = newState;

  broadcastToRoom(room, {
    type: 'TOKEN_MOVED',
    payload: {
      playerColor: activeColor,
      tokenId,
      fromStep,
      toStep: fromStep + room.state.diceValue,
      capturedColor,
    },
  });

  broadcastToRoom(room, {
    type: 'GAME_STATE_UPDATE',
    payload: { state: room.state },
  });

  if (room.state.status === 'playing') {
    checkBotTurn(room);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    })
  );

  // Platform & Economics API Routes
  app.use('/api', apiRouter);

  // Online Players Directory & Challenge System
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

  app.get('/api/lobby/players', (req, res) => {
    const now = Date.now();
    // Clean stale users (older than 45 seconds of no heartbeat)
    Array.from(onlineLobbyUsers.entries()).forEach(([id, user]) => {
      if (now - user.lastSeen > 45000) {
        onlineLobbyUsers.delete(id);
      }
    });

    const playersList = Array.from(onlineLobbyUsers.values()).map((p) => ({
      ...p,
      isOnline: true,
    }));
    res.json({ players: playersList });
  });

  app.post('/api/lobby/heartbeat', (req, res) => {
    const { id, name, avatar, rating, status } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const userId = id || `usr_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
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

  // Direct 1v1 Challenge Endpoint
  app.post('/api/challenges/send', (req, res) => {
    const { fromPlayer, toPlayerId, stakeUGX } = req.body;
    if (!fromPlayer || !toPlayerId) {
      return res.status(400).json({ error: 'Missing challenge parameters' });
    }

    const opponent = onlineLobbyUsers.get(toPlayerId);
    const opponentName = opponent ? opponent.name : 'Opponent';

    // Create 1v1 Room where players are placed on opposite sides:
    // Host gets 'red', opponent gets 'yellow' (diagonally opposite across 15x15 board)
    const roomId = generateRoomCode();
    const hostColor: PlayerColor = fromPlayer.preferredColor || 'red';
    const opponentColor: PlayerColor = getOppositeColor(hostColor);

    const hostPlayer = createInitialPlayer(
      fromPlayer.id || `host_${Date.now()}`,
      fromPlayer.name,
      fromPlayer.avatar || '👑',
      hostColor,
      'human',
      'medium',
      true
    );

    const oppPlayer = createInitialPlayer(
      toPlayerId,
      opponentName,
      opponent?.avatar || '🎯',
      opponentColor,
      toPlayerId.startsWith('ply_') ? 'bot' : 'human',
      'medium',
      false
    );

    const gameState = createInitialGameState(
      roomId,
      'online_multiplayer',
      [hostPlayer, oppPlayer],
      30
    );
    gameState.isCompetitive = Boolean(stakeUGX && stakeUGX > 0);
    gameState.status = 'playing'; // Instantly launch match

    const room: ServerRoom = {
      id: roomId,
      state: gameState,
      hostPlayerId: hostPlayer.id,
      clients: new Map(),
      chatHistory: [],
    };

    rooms.set(roomId, room);
    startRoomTimer(room);

    res.json({
      success: true,
      roomId,
      message: `Challenge accepted by ${opponentName}! Opponents positioned on opposite corners (${hostColor.toUpperCase()} vs ${opponentColor.toUpperCase()}).`,
      roomState: gameState,
    });
  });

  app.get('/api/rooms/public', (req, res) => {
    const publicRooms = Array.from(rooms.values())
      .filter((r) => r.state.status === 'waiting' && r.state.players.length < 4)
      .map((r) => ({
        roomId: r.id,
        playerCount: r.state.players.length,
        maxPlayers: 4,
        hostName: r.state.players.find((p) => p.isHost)?.name || 'Host',
        status: r.state.status,
      }));
    res.json({ rooms: publicRooms });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    const playerId = `usr_${Math.random().toString(36).substring(2, 9)}`;
    const conn: ClientConnection = { ws, playerId };
    clients.set(ws, conn);

    ws.on('message', (data: string) => {
      try {
        const action = JSON.parse(data) as WSClientAction;
        handleClientAction(ws, conn, action);
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      if (conn.roomId) {
        const room = rooms.get(conn.roomId);
        if (room) {
          room.clients.delete(conn.playerId);
          const p = room.state.players.find((pl) => pl.id === conn.playerId);
          if (p) {
            p.isConnected = false;
            broadcastToRoom(room, {
              type: 'PLAYER_DISCONNECTED',
              payload: { playerId: conn.playerId, name: p.name },
            });
            broadcastToRoom(room, {
              type: 'GAME_STATE_UPDATE',
              payload: { state: room.state },
            });

            // If everyone disconnected, delete room after 5 mins
            if (Array.from(room.clients.values()).length === 0) {
              setTimeout(() => {
                if (room.clients.size === 0) {
                  if (room.timerInterval) clearInterval(room.timerInterval);
                  if (room.botTimeout) clearTimeout(room.botTimeout);
                  rooms.delete(room.id);
                }
              }, 300000);
            }
          }
        }
      }
      clients.delete(ws);
    });
  });

  function handleClientAction(ws: WebSocket, conn: ClientConnection, action: WSClientAction) {
    switch (action.type) {
      case 'CREATE_ROOM': {
        const { hostName, avatar, color, turnTimeLimit, withBots } = action.payload;
        const roomId = generateRoomCode();
        conn.roomId = roomId;

        const hostPlayer = createInitialPlayer(
          conn.playerId,
          hostName || 'Player 1',
          avatar || '👑',
          color || 'red',
          'human',
          'medium',
          true
        );

        const initialPlayers: Player[] = [hostPlayer];

        if (withBots) {
          const colorsToAdd = ALL_COLORS.filter((c) => c !== hostPlayer.color);
          const botNames = ['CyberBot', 'RoboStar', 'LudoAI'];
          const botAvatars = ['🤖', '⚡', '🛸'];
          colorsToAdd.forEach((c, idx) => {
            initialPlayers.push(
              createInitialPlayer(
                `bot_${c}`,
                botNames[idx] || `Bot ${c.toUpperCase()}`,
                botAvatars[idx] || '🤖',
                c,
                'bot',
                'medium',
                false
              )
            );
          });
        }

        const gameState = createInitialGameState(
          roomId,
          'online_multiplayer',
          initialPlayers,
          turnTimeLimit || 30
        );

        // Waiting in lobby if not full or waiting for players
        gameState.status = 'waiting';

        const room: ServerRoom = {
          id: roomId,
          state: gameState,
          hostPlayerId: conn.playerId,
          clients: new Map([[conn.playerId, ws]]),
          chatHistory: [],
        };

        rooms.set(roomId, room);

        sendToClient(ws, {
          type: 'ROOM_CREATED',
          payload: { roomId, state: room.state, playerId: conn.playerId },
        });
        break;
      }

      case 'JOIN_ROOM': {
        const { roomId, playerName, avatar, preferredColor } = action.payload;
        const targetId = roomId.trim().toUpperCase();
        const room = rooms.get(targetId);

        if (!room) {
          sendToClient(ws, {
            type: 'ERROR',
            payload: { message: `Room ${targetId} not found. Please check code.` },
          });
          return;
        }

        // Check if reconnecting
        const existingPlayer = room.state.players.find((p) => p.name === playerName);
        if (existingPlayer) {
          existingPlayer.isConnected = true;
          existingPlayer.id = conn.playerId;
          conn.roomId = targetId;
          room.clients.set(conn.playerId, ws);

          sendToClient(ws, {
            type: 'ROOM_JOINED',
            payload: { roomId: targetId, state: room.state, playerId: conn.playerId },
          });
          broadcastToRoom(room, {
            type: 'GAME_STATE_UPDATE',
            payload: { state: room.state },
          });
          return;
        }

        if (room.state.players.length >= 4) {
          sendToClient(ws, {
            type: 'ERROR',
            payload: { message: 'Room is already full (max 4 players).' },
          });
          return;
        }

        conn.roomId = targetId;
        room.clients.set(conn.playerId, ws);

        const assignedColor = getAvailableColor(room.state.players, preferredColor);
        const newPlayer = createInitialPlayer(
          conn.playerId,
          playerName || `Player ${room.state.players.length + 1}`,
          avatar || '🎯',
          assignedColor,
          'human',
          'medium',
          false
        );

        room.state.players.push(newPlayer);
        room.state.activeColors = room.state.players.map((p) => p.color);

        sendToClient(ws, {
          type: 'ROOM_JOINED',
          payload: { roomId: targetId, state: room.state, playerId: conn.playerId },
        });

        broadcastToRoom(room, {
          type: 'GAME_STATE_UPDATE',
          payload: { state: room.state },
        });
        break;
      }

      case 'ADD_BOT': {
        const room = rooms.get(action.payload.roomId);
        if (!room || room.state.players.length >= 4) return;
        const color = getAvailableColor(room.state.players, action.payload.color);
        const botPlayer = createInitialPlayer(
          `bot_${color}_${Math.random().toString(36).substring(2, 5)}`,
          `Bot ${color.toUpperCase()}`,
          '🤖',
          color,
          'bot',
          action.payload.difficulty || 'medium',
          false
        );
        room.state.players.push(botPlayer);
        room.state.activeColors = room.state.players.map((p) => p.color);
        broadcastToRoom(room, {
          type: 'GAME_STATE_UPDATE',
          payload: { state: room.state },
        });
        break;
      }

      case 'REMOVE_BOT': {
        const room = rooms.get(action.payload.roomId);
        if (!room) return;
        room.state.players = room.state.players.filter(
          (p) => !(p.type === 'bot' && p.color === action.payload.color)
        );
        room.state.activeColors = room.state.players.map((p) => p.color);
        broadcastToRoom(room, {
          type: 'GAME_STATE_UPDATE',
          payload: { state: room.state },
        });
        break;
      }

      case 'START_GAME': {
        const room = rooms.get(action.payload.roomId);
        if (!room) return;
        if (room.state.players.length < 2) {
          // Auto add a bot if single player started
          const color = getAvailableColor(room.state.players, undefined, true);
          const botPlayer = createInitialPlayer(
            `bot_${color}`,
            `Bot ${color.toUpperCase()}`,
            '🤖',
            color,
            'bot',
            'medium',
            false
          );
          room.state.players.push(botPlayer);
        }

        // When two players are versing each other, ensure they are positioned on opposite sides of the board!
        if (room.state.players.length === 2) {
          const p1 = room.state.players[0];
          const p2 = room.state.players[1];
          const oppColor = getOppositeColor(p1.color);
          if (p2.color !== oppColor) {
            p2.color = oppColor;
            p2.tokens = createDefaultTokens(oppColor);
          }
        }

        room.state = createInitialGameState(
          room.id,
          'online_multiplayer',
          room.state.players,
          room.state.turnTimeLimit || 30
        );
        room.state.status = 'playing';

        startRoomTimer(room);

        broadcastToRoom(room, {
          type: 'GAME_STATE_UPDATE',
          payload: { state: room.state },
        });

        checkBotTurn(room);
        break;
      }

      case 'ROLL_DICE': {
        const room = rooms.get(action.payload.roomId);
        if (!room || room.state.status !== 'playing' || !room.state.canRoll) return;

        const activeColor = room.state.activeColors[room.state.activeColorIndex];
        const activePlayer = room.state.players.find((p) => p.color === activeColor);
        if (!activePlayer || activePlayer.id !== conn.playerId) {
          return; // Not your turn
        }

        const diceVal = Math.floor(Math.random() * 6) + 1;
        const { newState, hasValidMoves } = applyDiceRoll(room.state, diceVal);
        room.state = newState;

        broadcastToRoom(room, {
          type: 'DICE_ROLLED',
          payload: {
            diceValue: diceVal,
            playerColor: activeColor,
            consecutiveSixes: newState.consecutiveSixes,
          },
        });

        broadcastToRoom(room, {
          type: 'GAME_STATE_UPDATE',
          payload: { state: room.state },
        });

        if (hasValidMoves && room.state.validTokenMoves.length === 1) {
          // Auto move if only 1 choice after 600ms for smooth speed
          setTimeout(() => {
            if (room.state.status === 'playing' && room.state.mustSelectToken) {
              executeRoomMove(room, room.state.validTokenMoves[0]);
            }
          }, 600);
        } else if (!hasValidMoves) {
          checkBotTurn(room);
        }
        break;
      }

      case 'MOVE_TOKEN': {
        const room = rooms.get(action.payload.roomId);
        if (!room || room.state.status !== 'playing' || !room.state.mustSelectToken) return;

        const activeColor = room.state.activeColors[room.state.activeColorIndex];
        const activePlayer = room.state.players.find((p) => p.color === activeColor);
        if (!activePlayer || activePlayer.id !== conn.playerId) return;

        if (!room.state.validTokenMoves.includes(action.payload.tokenId)) return;

        executeRoomMove(room, action.payload.tokenId);
        break;
      }

      case 'SEND_CHAT': {
        const room = rooms.get(action.payload.roomId);
        if (!room) return;
        const sender = room.state.players.find((p) => p.id === conn.playerId);
        const chatMsg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          senderId: conn.playerId,
          senderName: sender?.name || 'Player',
          senderColor: sender?.color || 'red',
          text: action.payload.text.slice(0, 150),
          timestamp: Date.now(),
        };
        room.chatHistory.push(chatMsg);
        if (room.chatHistory.length > 50) room.chatHistory.shift();

        broadcastToRoom(room, {
          type: 'CHAT_MESSAGE',
          payload: chatMsg,
        });
        break;
      }

      case 'SEND_EMOJI': {
        const room = rooms.get(action.payload.roomId);
        if (!room) return;
        const sender = room.state.players.find((p) => p.id === conn.playerId);
        const reaction: FloatingReaction = {
          id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          emoji: action.payload.emoji,
          senderName: sender?.name || 'Player',
          senderColor: sender?.color || 'red',
          x: 20 + Math.random() * 60,
          y: 30 + Math.random() * 40,
        };

        broadcastToRoom(room, {
          type: 'EMOJI_REACTION',
          payload: reaction,
        });
        break;
      }

      case 'RESTART_GAME': {
        const room = rooms.get(action.payload.roomId);
        if (!room) return;
        room.state = createInitialGameState(
          room.id,
          'online_multiplayer',
          room.state.players.map((p) => ({
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
          })),
          room.state.turnTimeLimit || 30
        );
        room.state.status = 'playing';
        startRoomTimer(room);

        broadcastToRoom(room, {
          type: 'GAME_STATE_UPDATE',
          payload: { state: room.state },
        });
        checkBotTurn(room);
        break;
      }

      case 'LEAVE_ROOM': {
        const room = rooms.get(action.payload.roomId);
        if (room) {
          room.clients.delete(conn.playerId);
          room.state.players = room.state.players.filter((p) => p.id !== conn.playerId);
          room.state.activeColors = room.state.players.map((p) => p.color);
          broadcastToRoom(room, {
            type: 'GAME_STATE_UPDATE',
            payload: { state: room.state },
          });
        }
        conn.roomId = undefined;
        break;
      }
    }
  }

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Ludo Real-Time Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
