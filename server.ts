import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
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

function getAvailableColor(existingPlayers: Player[], preferred?: PlayerColor): PlayerColor {
  const taken = new Set(existingPlayers.map((p) => p.color));
  if (preferred && !taken.has(preferred)) {
    return preferred;
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
  const activeColor = room.state.activeColors[room.state.activeColorIndex];
  const activePlayer = room.state.players.find((p) => p.color === activeColor);
  if (!activePlayer) return;

  if (!room.state.hasRolled) {
    // Auto-roll dice on timeout
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
      // Auto move the best token after 800ms
      setTimeout(() => {
        if (room.state.status === 'playing' && room.state.mustSelectToken) {
          const bestTokenId = selectBestBotMove(
            room.state,
            activePlayer,
            room.state.validTokenMoves
          );
          executeRoomMove(room, bestTokenId);
        }
      }, 800);
    } else {
      checkBotTurn(room);
    }
  } else if (room.state.mustSelectToken && room.state.validTokenMoves.length > 0) {
    // Auto move first or best valid token
    const bestTokenId = selectBestBotMove(
      room.state,
      activePlayer,
      room.state.validTokenMoves
    );
    executeRoomMove(room, bestTokenId);
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

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
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
          const color = getAvailableColor(room.state.players);
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
